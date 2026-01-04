const cloud = require('wx-server-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

cloud.init({
  env: 'cloud1-2gyakmjl948dda68'
});

const db = cloud.database({
  env: 'cloud1-2gyakmjl948dda68'
});
const _ = db.command;
// 建议在云函数配置中设置环境变量 JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-please-change';

// 辅助函数：生成 Token
const generateToken = (payload) => {
  // Token 有效期 2 小时
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
};

// 辅助函数：验证 Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

exports.main = async (event, context) => {
  // 为了支持云函数 URL 化 (HTTP 触发)，我们需要处理 event 的结构
  // HTTP 触发时，body 通常是 JSON 字符串，需要解析
  let body = event.body;
  try {
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
  } catch (e) {
    // body 可能是 null 或已经是对象
  }

  // 兼容普通调用和 HTTP 调用
  const data = body || event; 
  const type = data.type || event.type; 

  // 获取 Token
  // HTTP 触发: event.headers.authorization
  // SDK 调用: 可以在 data 中传，或者 context 中可能有（如果走了云开发鉴权）
  let token = null;
  if (event.headers) {
    // headers key 可能是小写也可能是大写
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }
  // 兜底：允许在 data 中传 token
  if (!token && data && data.token) {
    token = data.token;
  }

  // 路由分发
  try {
    switch (type) {
      case 'admin-login':
        return await handleLogin(data);

      case 'sync-device-status':
      case 'syncDeviceStatus':
        return await handleSyncDeviceStatus();
      
      case 'version':
        return { code: 0, version: '1.0.1' };
      
      // 以下接口需要鉴权
      case 'get-users':
      case 'update-user':
      case 'delete-user':
        if (!ensureAuth(token)) {
          return { code: 401, msg: 'Unauthorized' };
        }
        if (type === 'get-users') return await handleGetUsers(data);
        if (type === 'update-user') return await handleUpdateUser(data);
        if (type === 'delete-user') return await handleDeleteUser(data);
        break;

      // 设备串码导入（不强制鉴权，按需开启）
      case 'import-device-serials':
      case 'importDeviceSerials':
      case '导入设备序列':
        {
          const user = verifyToken(token); // 解析 token 获取用户信息
          return await handleImportDeviceSerials(data, user);
        }
      
      case 'list-device-serials':
      case 'listDeviceSerials':
      case '设备串码列表':
        {
          const user = verifyToken(token); // 解析 token 获取用户信息
          return await handleListDeviceSerials(data, user);
        }

      case 'get-receipt':
      case 'getReceipt':
      case '领取信息':
        return await handleGetReceipt(data);

      case 'debug':
        return await handleDebug();

      default:
        return { code: 404, msg: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error('Error:', err);
    return { code: 500, msg: err.message, stack: err.stack };
  }
};

async function handleDebug() {
  try {
    const ctx = cloud.getWXContext();
    // 尝试读取一条数据
    const testRes = await db.collection('users').limit(1).get();
    return {
      code: 0,
      msg: 'Debug success',
      info: {
        currentEnv: ctx.ENV,
        dbEnv: db.config.env,
        collectionUsersExists: true,
        recordCount: testRes.data.length
      }
    };
  } catch (e) {
    return {
      code: 500,
      msg: 'Debug failed',
      info: {
        currentEnv: cloud.getWXContext().ENV,
        dbEnv: db.config.env,
        error: e.message,
        errorCode: e.errCode
      }
    };
  }
}

function ensureAuth(token) {
  if (!token) return false;
  const decoded = verifyToken(token);
  return !!decoded;
}

async function handleLogin(data) {
  const { username, password } = data;
  if (!username || !password) {
    return { code: 400, msg: 'Username and password required' };
  }

  // 1. 查询总管理员集合 general_admin
  let adminRes = await db.collection('general_admin').where({ username }).get();
  if (adminRes.data.length === 0) {
     // 尝试用 phone
     adminRes = await db.collection('general_admin').where({ phone: username }).get();
  }

  if (adminRes.data.length > 0) {
    // 是总管理员
    const admin = adminRes.data[0];
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return { code: 401, msg: 'Invalid credentials' };
    
    // 生成 token (role: super_admin)
    const token = generateToken({ id: admin._id, username: admin.username, role: 'super_admin' });
    return { code: 0, data: { token, role: 'super_admin' } };
  }

  // 2. 查询普通管理员 (users 集合)
  // 支持 username 或 phone 登录
  let query = db.collection('users').where({ username });
  let res = await query.get();
  
  if (res.data.length === 0) {
    // 尝试用手机号查找
    res = await db.collection('users').where({ phone: username }).get();
  }

  if (res.data.length === 0) {
    return { code: 401, msg: 'Invalid credentials' };
  }

  const user = res.data[0];

  // 检查权限
  if (user.role !== 'admin') {
    return { code: 403, msg: 'Permission denied: Not an admin' };
  }

  // 验证密码
  // 如果数据库中没有密码字段，直接拒绝
  if (!user.password) {
    return { code: 401, msg: 'Password not set' };
  }

  // 验证密码 (假设数据库存的是 bcrypt hash)
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return { code: 401, msg: 'Invalid credentials' };
  }

  const token = generateToken({ id: user._id, username: user.username || user.phone, role: 'admin', county: user.county });
  return { code: 0, data: { token, role: 'admin', county: user.county } };
}

async function handleGetUsers(data) {
  const { page = 1, pageSize = 10, keyword } = data;
  const skip = (page - 1) * pageSize;

  let query = db.collection('users');
  if (keyword) {
    // 模糊搜索 name 或 phone 或 grid
    query = query.where(_.or([
      { name: db.RegExp({ regexp: keyword, options: 'i' }) },
      { phone: db.RegExp({ regexp: keyword, options: 'i' }) },
      { grid: db.RegExp({ regexp: keyword, options: 'i' }) }
    ]));
  }

  const countRes = await query.count();
  const res = await query.skip(skip).limit(pageSize).get();

  return {
    code: 0,
    data: {
      list: res.data,
      total: countRes.total,
      page,
      pageSize
    }
  };
}

// 同步设备状态
async function handleSyncDeviceStatus() {
  try {
    const _ = db.command;
    const MAX_LIMIT = 1000;
    
    // 1. 获取 receipts 集合中的所有 SN
    const receiptsRes = await db.collection('receipts')
      .field({ snList: true })
      .limit(MAX_LIMIT)
      .get();
      
    // 提取所有 snList 中的 SN，假设 snList 是一个数组或字符串
    // 如果 snList 是数组，直接展平；如果是字符串，根据情况分割（这里假设是数组或单值）
    const receiptSNs = receiptsRes.data
      .flatMap(r => r.snList)
      .filter(sn => sn && typeof sn === 'string' && sn.trim() !== '');
      
    if (receiptSNs.length === 0) {
      return { code: 0, msg: 'No receipts to sync', updated: 0 };
    }
    
    // 去重
    const uniqueSNs = [...new Set(receiptSNs)];

    // 2. 批量更新 device_serials
    const BATCH_SIZE = 100;
    let totalUpdated = 0;

    for (let i = 0; i < uniqueSNs.length; i += BATCH_SIZE) {
      const batchSNs = uniqueSNs.slice(i, i + BATCH_SIZE);
      
      const updateRes = await db.collection('device_serials')
        .where({
          SN: _.in(batchSNs),
          status: _.neq('已出库')
        })
        .update({
          data: {
            status: '已出库',
            updatedAt: Date.now()
          }
        });
        
      totalUpdated += updateRes.stats.updated;
    }

    return {
      code: 0,
      msg: 'Sync success',
      updated: totalUpdated
    };
  } catch (err) {
    console.error('Sync error:', err);
    return { code: 500, msg: 'Sync failed: ' + err.message };
  }
}

async function handleUpdateUser(data) {
  const { id, ...updates } = data;
  if (!id) return { code: 400, msg: 'Missing id' };

  // 移除 token 字段防止写入数据库
  delete updates.token;
  delete updates.type;

  updates.role = normalizeRole(updates.role);

  const docRes = await db.collection('users').doc(id).get();
  const user = Array.isArray(docRes.data) ? docRes.data[0] : docRes.data;
  if (!user) {
    return { code: 404, msg: 'User not found' };
  }
  // 移除迁移逻辑，只更新 users 集合
  // 使用事务保证原子性（此处事务非必须，但为了代码结构保留或简化）
  // 仅在 users 集合中更新 role
  await db.collection('users').doc(id).update({ data: updates });

  return { code: 0, msg: 'Updated successfully' };
}

function normalizeRole(role) {
  if (!role) return 'user';
  const s = String(role).toLowerCase();
  if (s === 'admin') return 'admin';
  if (s === 'user') return 'user';
  if (role === '管理员' || role === '行政') return 'admin';
  if (role === '普通用户') return 'user';
  return 'user';
}

async function handleDeleteUser(data) {
  const { id } = data;
  if (!id) return { code: 400, msg: 'Missing id' };

  await db.collection('users').doc(id).remove();

  return { code: 0, msg: 'Deleted successfully' };
}

// 设备串码导入
async function handleImportDeviceSerials(data, user) {
  const { list } = data || {};
  if (!Array.isArray(list) || list.length === 0) {
    return { code: 400, msg: 'empty list' };
  }
  const col = db.collection('device_serials');
  const snList = list.map(x => String(x.SN || '').trim()).filter(Boolean);
  const cemiList = list.map(x => String(x.CEMI || '').trim()).filter(Boolean);
  const existingBySN = snList.length ? (await col.where({ SN: _.in(snList) }).get()).data : [];
  const existingByCEMI = cemiList.length ? (await col.where({ CEMI: _.in(cemiList) }).get()).data : [];
  const seenSN = new Set(existingBySN.map(x => x.SN));
  const seenCEMI = new Set(existingByCEMI.map(x => x.CEMI));
  const now = Date.now();
  let inserted = 0;
  for (const it of list) {
    const SN = String(it.SN || '').trim();
    const CEMI = String(it.CEMI || '').trim();
    if (!SN && !CEMI) continue;
    if ((SN && seenSN.has(SN)) || (CEMI && seenCEMI.has(CEMI))) continue;
    const doc = {
      SN,
      CEMI,
      deviceName: String(it.deviceName || '').trim(),
      deviceModel: String(it.deviceModel || '').trim(),
      inboundTime: String(it.inboundTime || '').trim(),
      status: String(it.status || '未使用').trim(),
      isUsed: 0,
      createdAt: now,
      updatedAt: now
    };
    
    // 如果有 user 信息且有 county，则打上标签
  if (user && user.county) {
    doc.county = user.county;
  }
  
  await col.add({ data: doc });
  inserted++;
}
return { 
  code: 0, 
  data: { 
    inserted, 
    duplicated: list.length - inserted,
    // 返回调试信息帮助排查
    debug: {
      hasUser: !!user,
      county: user?.county || null,
      role: user?.role || null
    }
  } 
};
}

async function handleListDeviceSerials(data, user) {
  const { page = 1, pageSize = 10, keyword, county } = data || {};
  const skip = (page - 1) * pageSize;
  let query = db.collection('device_serials');
  
  // 如果是普通管理员且有 county，则强制过滤
  if (user && user.role === 'admin' && user.county) {
    query = query.where({ county: user.county });
  } else if (county) {
    // 如果不是受限管理员，且前端传了 county，则按前端传的过滤（例如总管理员查看特定区域）
    query = query.where({ county });
  }

  if (keyword) {
    query = query.where(_.or([
      { SN: db.RegExp({ regexp: keyword, options: 'i' }) },
      { CEMI: db.RegExp({ regexp: keyword, options: 'i' }) },
      { deviceName: db.RegExp({ regexp: keyword, options: 'i' }) },
      { deviceModel: db.RegExp({ regexp: keyword, options: 'i' }) }
    ]));
  }
  const countRes = await query.count();
  const res = await query.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get();
  return {
    code: 0,
    data: {
      list: res.data,
      total: countRes.total,
      page,
      pageSize
    }
  };
}

// 查询领取信息
async function handleGetReceipt(data) {
  const { SN, CEMI } = data || {};
  if (!SN && !CEMI) {
    return { code: 400, msg: 'Missing SN or CEMI' };
  }
  // 1. 先尝试直匹配字段（兼容可能存在的直存字段）
  let query = db.collection('receipts');
  if (SN && CEMI) {
    query = query.where(_.or([{ SN }, { CEMI }]));
  } else if (SN) {
    query = query.where({ SN });
  } else {
    query = query.where({ CEMI });
  }
  const directRes = await query.orderBy('createdAt', 'desc').limit(1).get();
  let doc = directRes.data && directRes.data[0];
  // 2. 如果未命中，回退到在 snList 数组中查找包含该 SN 的记录
  if (!doc && SN) {
    const listRes = await db.collection('receipts').orderBy('createdAt', 'desc').limit(1000).get();
    doc = (listRes.data || []).find(d => Array.isArray(d.snList) && d.snList.includes(String(SN).trim()));
  }
  if (!doc) {
    return { code: 0, data: {} };
  }
  const person = doc.person || doc.user || doc.username || doc.recipient || doc.receiver || doc.staffName || doc.name || '';
  const time = doc.time || doc.receivedAt || doc.timestamp || doc.date || doc.createdAt || '';
  return { code: 0, data: { person, time } };
}
