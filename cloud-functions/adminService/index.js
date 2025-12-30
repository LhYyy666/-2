const cloud = require('wx-server-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
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

      default:
        return { code: 404, msg: `Unknown type: ${type}` };
    }
  } catch (err) {
    console.error('Error:', err);
    return { code: 500, msg: err.message };
  }
};

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

  // 假设管理员集合为 'admins'
  const res = await db.collection('admins').where({ username }).get();
  if (res.data.length === 0) {
    return { code: 401, msg: 'Invalid credentials' };
  }

  const admin = res.data[0];
  // 验证密码 (假设数据库存的是 bcrypt hash)
  // 初始时如果数据库是明文，可以临时改成 admin.password === password
  const isValid = await bcrypt.compare(password, admin.password);
  
  if (!isValid) {
    return { code: 401, msg: 'Invalid credentials' };
  }

  const token = generateToken({ id: admin._id, username: admin.username });
  return { code: 0, data: { token } };
}

async function handleGetUsers(data) {
  const { page = 1, pageSize = 10, keyword } = data;
  const skip = (page - 1) * pageSize;

  let query = db.collection('users');
  if (keyword) {
    // 模糊搜索 name 或 phone
    query = query.where(_.or([
      { name: db.RegExp({ regexp: keyword, options: 'i' }) },
      { phone: db.RegExp({ regexp: keyword, options: 'i' }) }
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

async function handleUpdateUser(data) {
  const { id, ...updates } = data;
  if (!id) return { code: 400, msg: 'Missing id' };

  // 移除 token 字段防止写入数据库
  delete updates.token;
  delete updates.type;

  await db.collection('users').doc(id).update({
    data: updates
  });

  return { code: 0, msg: 'Updated successfully' };
}

async function handleDeleteUser(data) {
  const { id } = data;
  if (!id) return { code: 400, msg: 'Missing id' };

  await db.collection('users').doc(id).remove();

  return { code: 0, msg: 'Deleted successfully' };
}
