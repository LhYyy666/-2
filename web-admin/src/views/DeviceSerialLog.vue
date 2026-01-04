<template>
  <div class="device-serial-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button 
              v-if="isSuperAdmin && !showRegionList" 
              link 
              @click="backToRegionList"
              style="margin-right: 8px; font-size: 16px; padding: 0;"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <span class="title">设备串码日志{{ selectedCounty ? ` - ${selectedCounty}` : '' }}</span>
          </div>
          <div class="header-right">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".xlsx,.xls"
              @change="handleFileChange"
            >
              <el-button type="primary" icon="Upload">选择 Excel 文件</el-button>
            </el-upload>
            <el-button
              type="warning"
              icon="Download"
              @click="exportTemplate"
            >
              导出模板
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="showRegionList" class="region-list-container">
        <el-row :gutter="20">
          <el-col :span="6" v-for="county in counties" :key="county" style="margin-bottom: 20px;">
            <el-card shadow="hover" class="region-card" @click="selectRegion(county)">
              <div class="region-content">
                <h3>{{ county }}</h3>
                <p>点击查看详情</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div v-else>
        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
          <el-input
            v-model="keyword"
            placeholder="搜索SN/CEMI/设备名称/型号"
            style="width: 300px"
            clearable
            @clear="fetchDb"
            @keyup.enter="fetchDb"
          />
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-select
              v-model="selectedStatus"
              style="width: 140px"
              @change="handleStatusChange"
            >
              <el-option label="全部" value="全部" />
              <el-option label="未出库" value="未出库" />
              <el-option label="已出库" value="已出库" />
            </el-select>
            <el-button type="success" icon="Document" @click="exportFiltered">导出当前筛选</el-button>
            <el-button type="primary" icon="Refresh" @click="fetchDb">刷新列表</el-button>
            <el-button v-if="isSuperAdmin" @click="backToRegionList">返回区域列表</el-button>
          </div>
        </div>

        <el-table
          v-if="parsedRows.length"
          :data="parsedRows"
          style="width: 100%"
          border
          stripe
          highlight-current-row
        >
          <el-table-column prop="SN" label="SN" min-width="160" align="center" />
          <el-table-column prop="CEMI" label="CEMI" min-width="160" align="center" />
          <el-table-column prop="deviceName" label="设备名称" min-width="160" align="center" />
          <el-table-column prop="deviceModel" label="设备型号" min-width="140" align="center" />
          <el-table-column prop="inboundTime" label="入库时间" min-width="160" align="center" />
          <el-table-column label="使用状态" min-width="120" align="center">
            <template #default="{ row }">
              <el-link
                v-if="isShipped(row.status)"
                type="primary"
                @click="openReceipt(row)"
              >
                {{ row.status }}
              </el-link>
              <span v-else>{{ row.status }}</span>
            </template>
          </el-table-column>
        </el-table>

        <el-table
          :data="filteredDbRows"
          v-loading="dbLoading"
          style="width: 100%; margin-top: 12px"
          border
          stripe
          highlight-current-row
        >
          <el-table-column prop="SN" label="SN" min-width="160" align="center" />
          <el-table-column prop="CEMI" label="CEMI" min-width="160" align="center" />
          <el-table-column prop="deviceName" label="设备名称" min-width="160" align="center" />
          <el-table-column prop="deviceModel" label="设备型号" min-width="140" align="center" />
          <el-table-column prop="inboundTime" label="入库时间" min-width="160" align="center" />
          <el-table-column label="使用状态" min-width="120" align="center">
            <template #default="{ row }">
              <el-link
                v-if="isShipped(row.status)"
                type="primary"
                @click="openReceipt(row)"
              >
                {{ row.status }}
              </el-link>
              <span v-else>{{ row.status }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="dbPage"
            v-model:page-size="dbPageSize"
            :total="dbTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleDbPageChange(1)"
            @current-change="handleDbPageChange"
            background
          />
        </div>
      </div>
    </el-card>
    <el-dialog v-model="receiptDialogVisible" title="领取信息" width="420px" :close-on-click-modal="true">
      <div v-if="receiptLoading" style="text-align:center;padding:12px;">
        <el-icon><Loading /></el-icon> 加载中...
      </div>
      <div v-else>
        <div style="margin-bottom:8px;">领取人员：{{ receiptInfo.person || '未知' }}</div>
        <div>领取时间：{{ receiptInfo.time || '未知' }}</div>
      </div>
      <template #footer>
        <el-button @click="receiptDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import * as XLSX from 'xlsx';
import { ElMessage } from 'element-plus';
import request from '@/api/request';
import { Loading, ArrowLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const isSuperAdmin = computed(() => authStore.role === 'super_admin');

const counties = ['长武', '彬州', '永寿', '旬邑', '淳化', '武功', '礼泉', '乾县', '秦都', '渭城', '兴平'];
const showRegionList = ref(false);
const selectedCounty = ref('');

const parsedRows = ref([]);
const importing = ref(false);
const dbRows = ref([]);
const dbLoading = ref(false);
const dbTotal = ref(0);
const dbPage = ref(1);
const dbPageSize = ref(10);
const keyword = ref('');
const selectedStatus = ref('全部');

const isShipped = (s) => {
  const v = String(s || '').trim();
  return ['已出库', '已使用', '已借出', '已售出'].includes(v);
};
const isUnshipped = (s) => {
  const v = String(s || '').trim();
  return ['未出库', '未使用', '未借出', '未售出'].includes(v);
};
const filteredDbRows = computed(() => {
  if (selectedStatus.value === '全部') return dbRows.value;
  if (selectedStatus.value === '已出库') {
    return dbRows.value.filter(r => isShipped(r.status));
  }
  return dbRows.value.filter(r => isUnshipped(r.status) || !isShipped(r.status));
});

const formatToCST = (val) => {
  if (!val) return '';
  let d;
  if (typeof val === 'number') {
    d = new Date(val);
  } else if (typeof val === 'string') {
    const n = Number(val);
    d = !Number.isNaN(n) && val.trim() !== '' ? new Date(n) : new Date(val);
  } else {
    d = new Date(val);
  }
  if (isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  }
};

const normalizeHeader = (h) => {
  if (!h) return '';
  const s = String(h).trim();
  if (s.toLowerCase() === 'sn') return 'SN';
  if (s.toUpperCase() === 'CEMI') return 'CEMI';
  if (s === '设备名称') return 'deviceName';
  if (s === '设备型号') return 'deviceModel';
  if (s === '入库时间') return 'inboundTime';
  if (s === '使用状态') return 'status';
  return s;
};

const exportTemplate = () => {
  const headers = ['SN', 'CEMI', '设备名称', '设备型号', '入库时间'];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '模板');
  XLSX.writeFile(wb, '设备串码导入模板.xlsx');
};

const handleFileChange = async (fileEvent) => {
  try {
    const file = fileEvent?.raw || fileEvent?.target?.files?.[0] || fileEvent;
    if (!file) {
      ElMessage.error('未选择文件');
      return;
    }
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) {
      ElMessage.error('表格为空');
      return;
    }
    const header = rows[0].map(normalizeHeader);
    const colIndex = (key) => header.indexOf(key);
    const idxSN = colIndex('SN');
    const idxCEMI = colIndex('CEMI');
    const idxName = colIndex('deviceName');
    const idxModel = colIndex('deviceModel');
    const idxInbound = colIndex('inboundTime');
    const idxStatus = colIndex('status');
    if (idxSN < 0 || idxCEMI < 0 || idxName < 0 || idxModel < 0 || idxInbound < 0) {
      ElMessage.error('缺少必要表头：SN、CEMI、设备名称、设备型号、入库时间');
      return;
    }
    const out = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const item = {
        SN: String(r[idxSN] ?? '').trim(),
        CEMI: String(r[idxCEMI] ?? '').trim(),
        deviceName: String(r[idxName] ?? '').trim(),
        deviceModel: String(r[idxModel] ?? '').trim(),
        inboundTime: String(r[idxInbound] ?? '').trim(),
        status: String((idxStatus >= 0 ? r[idxStatus] : '未使用') ?? '未使用').trim()
      };
      if (!item.SN && !item.CEMI) continue;
      out.push(item);
    }
    parsedRows.value = out;
    ElMessage.success(`解析成功，记录数：${out.length}`);
    await submitImport();
  } catch (e) {
    ElMessage.error('解析失败：' + (e?.message || '未知错误'));
  }
};

const submitImport = async () => {
  if (!parsedRows.value.length) {
    ElMessage.error('无可导入数据');
    return;
  }
  try {
    importing.value = true;
    try {
      const r = await request.post('', { type: 'import-device-serials', list: parsedRows.value });
      ElMessage.success(`导入成功：新增 ${r.inserted} 条，重复 ${r.duplicated} 条`);
      
      // 检查是否有区域信息
      if (r.debug) {
        if (!r.debug.hasUser) {
          ElMessage.warning('警告：未能识别管理员身份，请检查登录状态');
        } else if (!r.debug.county && r.debug.role === 'admin') {
          ElMessage.warning('注意：当前账号未检测到区域(county)信息，导入设备未标记区域。请尝试重新登录或联系总管理员配置。');
        }
      }

      fetchDb();
    } catch (err1) {
      try {
        const r = await request.post('', { type: 'importDeviceSerials', list: parsedRows.value });
        ElMessage.success(`导入成功：新增 ${r.inserted} 条，重复 ${r.duplicated} 条`);
        fetchDb();
      } catch (err2) {
        // 一些后端使用中文类型
        const r = await request.post('', { type: '导入设备序列', list: parsedRows.value });
        ElMessage.success(`导入成功：新增 ${r.inserted} 条，重复 ${r.duplicated} 条`);
        fetchDb();
      }
    }
    parsedRows.value = [];
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('导入失败：' + (e?.message || '未知错误'));
    }
  } finally {
    importing.value = false;
  }
};

const fetchDb = async () => {
  dbLoading.value = true;
  try {
    // 只有在非导入状态下才尝试同步（或者每次都同步，看需求，这里保留原逻辑）
    // ...sync logic...
    
    // 如果是总管理员，且处于区域列表模式，不需要加载设备列表
    if (isSuperAdmin.value && showRegionList.value) {
      dbLoading.value = false;
      return;
    }

    try {
      const res = await request.post('', {
        type: 'list-device-serials',
        page: dbPage.value,
        pageSize: dbPageSize.value,
        keyword: keyword.value,
        status: selectedStatus.value === '全部' ? undefined : selectedStatus.value,
        county: selectedCounty.value || undefined // 传递选中的区域
      });
      dbRows.value = res.data?.list || res.list || [];
      dbTotal.value = res.data?.total || res.total || 0;
    } catch {
      // ... fallback logic ...
      try {
        const res = await request.post('', {
          type: 'listDeviceSerials',
          page: dbPage.value,
          pageSize: dbPageSize.value,
          keyword: keyword.value,
          status: selectedStatus.value === '全部' ? undefined : selectedStatus.value,
          county: selectedCounty.value || undefined
        });
        dbRows.value = res.data?.list || res.list || [];
        dbTotal.value = res.data?.total || res.total || 0;
      } catch {
        const res = await request.post('', {
          type: '设备串码列表',
          page: dbPage.value,
          pageSize: dbPageSize.value,
          keyword: keyword.value,
          status: selectedStatus.value === '全部' ? undefined : selectedStatus.value,
          county: selectedCounty.value || undefined
        });
        dbRows.value = res.data?.list || res.list || [];
        dbTotal.value = res.data?.total || res.total || 0;
      }
    }
  } catch (e) {
    ElMessage.error('加载失败');
  } finally {
    dbLoading.value = false;
  }
};

const selectRegion = (county) => {
  selectedCounty.value = county;
  showRegionList.value = false;
  dbPage.value = 1; // 重置页码
  fetchDb();
};

const backToRegionList = () => {
  showRegionList.value = true;
  selectedCounty.value = '';
  dbRows.value = [];
  dbTotal.value = 0;
};

onMounted(() => {
  if (isSuperAdmin.value) {
    showRegionList.value = true;
  } else {
    fetchDb();
  }
});
</script>

<style scoped lang="scss">
.device-serial-container {
  background-color: transparent;
}
.box-card {
  border: none;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
.tip {
  margin-bottom: 12px;
}
.pagination-container {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.region-list-container {
  padding: 20px 0;
}

.region-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .region-content {
    h3 {
      font-size: 20px;
      color: #303133;
      margin-bottom: 8px;
    }
    
    p {
      color: #909399;
      font-size: 14px;
    }
  }
}
 </style>
