<template>
  <div class="user-manage-container">
    <el-container>
      <el-header class="header">
        <div class="logo">管理员后台</div>
        <div class="user-info">
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-main>
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户管理</span>
              <div class="search-box">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索用户名/手机号"
                  style="width: 200px; margin-right: 10px"
                  clearable
                  @clear="fetchUsers"
                  @keyup.enter="fetchUsers"
                />
                <el-button type="primary" @click="fetchUsers">搜索</el-button>
              </div>
            </div>
          </template>
          
          <el-table :data="tableData" v-loading="loading" style="width: 100%">
            <el-table-column prop="_id" label="ID" width="220" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="手机号" />
            <el-table-column prop="role" label="权限等级">
              <template #default="scope">
                <el-tag :type="scope.row.role === 'admin' ? 'danger' : ''">{{ scope.row.role || 'user' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-main>
    </el-container>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="修改用户信息" width="30%">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="权限等级">
          <el-select v-model="editForm.role" placeholder="Select">
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
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

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

const handleEdit = (row) => {
  editForm.id = row._id;
  editForm.name = row.name || '';
  editForm.phone = row.phone || '';
  editForm.role = row.role || 'user';
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

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-manage-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
