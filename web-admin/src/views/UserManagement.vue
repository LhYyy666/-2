<template>
  <div class="user-manage-container">
    <el-card class="box-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">用户列表</span>
          </div>
          <div class="header-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名/手机号/地区"
              style="width: 250px; margin-right: 15px"
              clearable
              prefix-icon="Search"
              @clear="fetchUsers"
              @keyup.enter="fetchUsers"
            />
            <el-button type="primary" icon="Search" @click="fetchUsers">搜索</el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="tableData" 
        v-loading="loading" 
        style="width: 100%" 
        border 
        stripe
        highlight-current-row
      >
        <el-table-column prop="county" label="地区" width="240" align="center" show-overflow-tooltip>
          <template #default="scope">
            <div class="cell">{{ scope.row.county || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" min-width="120" align="center" />
        <el-table-column prop="phone" label="手机号" min-width="150" align="center" />
        <el-table-column prop="role" label="权限等级" min-width="120" align="center">
          <template #default="scope">
            <el-tag :type="roleType(scope.row.role)" effect="plain" round>
              {{ roleLabel(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" link icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUsers"
          @current-change="handlePageChange"
          background
        />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="修改用户信息" width="500px" destroy-on-close>
      <el-form :model="editForm" label-width="80px" class="edit-form">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="权限等级">
          <el-select v-model="editForm.role" placeholder="请选择权限" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import request from '../api/request';
import { ElMessage, ElMessageBox } from 'element-plus';

const loading = ref(false);
const tableData = ref([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');

const dialogVisible = ref(false);
const submitting = ref(false);
const editForm = reactive({
  id: '',
  name: '',
  phone: '',
  role: ''
});

const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await request.post('', {
      type: 'get-users',
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value
    });
    tableData.value = res.list;
    total.value = res.total;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchUsers();
};

const normalizeRole = (r) => {
  if (!r) return 'user';
  const s = String(r).toLowerCase();
  if (s === 'admin' || r === '管理员' || r === '行政') return 'admin';
  if (s === 'user' || r === '普通用户') return 'user';
  return 'user';
};

const roleLabel = (r) => {
  const nr = normalizeRole(r);
  return nr === 'admin' ? '管理员' : '普通用户';
};

const roleType = (r) => (normalizeRole(r) === 'admin' ? 'danger' : 'success');

const handleEdit = (row) => {
  editForm.id = row._id;
  editForm.name = row.name || '';
  editForm.phone = row.phone || '';
  editForm.grid = row.grid || '';
  editForm.role = normalizeRole(row.role || 'user');
  dialogVisible.value = true;
};

const submitEdit = async () => {
  submitting.value = true;
  try {
    await request.post('', {
      type: 'update-user',
      id: editForm.id,
      name: editForm.name,
      phone: editForm.phone,
      grid: editForm.grid,
      role: editForm.role
    });
    ElMessage.success('更新成功');
    dialogVisible.value = false;
    fetchUsers();
  } catch (error) {
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除该用户吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await request.post('', {
        type: 'delete-user',
        id: row._id
      });
      ElMessage.success('删除成功');
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
  });
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped lang="scss">
.user-manage-container {
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
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.edit-form {
  padding: 0 20px;
}
</style>
