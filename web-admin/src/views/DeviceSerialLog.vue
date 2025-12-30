<template>
  <div class="device-serial-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">设备串码日志</span>
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

      <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
        <el-input
          v-model="keyword"
          placeholder="搜索SN/CEMI/设备名称/型号"
          style="width: 300px"
          clearable
          @clear="fetchDb"
          @keyup.enter="fetchDb"
        />
        <div>
          <el-button type="primary" icon="Refresh" @click="fetchDb">刷新列表</el-button>
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
        <el-table-column prop="status" label="使用状态" min-width="120" align="center" />
      </el-table>

      <el-table
        :data="dbRows"
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
        <el-table-column prop="status" label="使用状态" min-width="120" align="center" />
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
    </el-card>
  </div>
 </template>

 <script setup>
import { ref, onMounted } from 'vue';
import * as XLSX from 'xlsx';
import { ElMessage } from 'element-plus';
import request from '@/api/request';

const parsedRows = ref([]);
const importing = ref(false);
const dbRows = ref([]);
const dbLoading = ref(false);
const dbTotal = ref(0);
const dbPage = ref(1);
const dbPageSize = ref(10);
const keyword = ref('');

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
    // 每次刷新列表前，先执行同步操作
    try {
      const syncRes = await request.post('', { type: 'sync-device-status' });
      if (syncRes && syncRes.updated > 0) {
        ElMessage.success(`同步完成，更新了 ${syncRes.updated} 条记录状态`);
      }
    } catch (e) {
      console.error('Sync failed', e);
      // 不阻塞列表加载，仅记录错误
    }

    try {
      const res = await request.post('', {
        type: 'list-device-serials',
        page: dbPage.value,
        pageSize: dbPageSize.value,
        keyword: keyword.value
      });
      dbRows.value = res.data?.list || res.list || [];
      dbTotal.value = res.data?.total || res.total || 0;
    } catch {
      try {
        const res = await request.post('', {
          type: 'listDeviceSerials',
          page: dbPage.value,
          pageSize: dbPageSize.value,
          keyword: keyword.value
        });
        dbRows.value = res.data?.list || res.list || [];
        dbTotal.value = res.data?.total || res.total || 0;
      } catch {
        const res = await request.post('', {
          type: '设备串码列表',
          page: dbPage.value,
          pageSize: dbPageSize.value,
          keyword: keyword.value
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

const handleDbPageChange = (p) => {
  dbPage.value = p;
  fetchDb();
};

onMounted(() => {
  fetchDb();
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
 </style>
