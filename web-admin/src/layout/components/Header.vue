<template>
  <div class="header-container">
    <div class="left">
      <div class="logo" @click="goHome">
        <img src="@/assets/vue.svg" alt="Logo" class="logo-img" />
      </div>
      <el-divider direction="vertical" class="divider" />
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="route.path !== '/home'">{{ route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right">
      <el-dropdown trigger="click" @command="handleCommand">
        <span class="el-dropdown-link">
          <el-avatar :size="32" icon="UserFilled" />
          <span class="username">管理员</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const goHome = () => {
  router.push('/');
};

const handleCommand = (command) => {
  if (command === 'logout') {
    authStore.logout();
    router.push('/login');
    ElMessage.success('已退出登录');
  }
};
</script>

<style scoped lang="scss">
.header-container {
  height: 60px;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  
  .left {
    display: flex;
    align-items: center;
    
    .logo {
      display: flex;
      align-items: center;
      cursor: pointer;
      margin-right: 15px;
      
      .logo-img {
        width: 24px;
        height: 24px;
        margin-right: 8px;
      }
    }
    
    .divider {
      height: 20px;
      margin-right: 15px;
    }
  }
  
  .right {
    .el-dropdown-link {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: #333;
      
      .username {
        margin-left: 8px;
        margin-right: 4px;
        font-size: 14px;
      }
    }
  }
}
</style>