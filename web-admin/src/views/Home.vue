<template>
  <div class="home-container">
    <div class="welcome-section">
      <h2>{{ welcomeTitle }}</h2>
      <p>请选择您要管理的功能模块</p>
    </div>
    
    <div class="menu-cards">
      <el-card class="menu-card" shadow="hover" @click="$router.push('/users')">
        <div class="card-content">
          <el-icon class="card-icon" color="#409EFF"><User /></el-icon>
          <h3>用户管理</h3>
          <p>管理系统用户、角色及权限设置</p>
        </div>
      </el-card>

      <el-card class="menu-card" shadow="hover" @click="$router.push('/devices')">
        <div class="card-content">
          <el-icon class="card-icon" color="#67C23A"><Document /></el-icon>
          <h3>设备串码日志</h3>
          <p>查询设备入库、出库及领取记录</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { User, Document } from '@element-plus/icons-vue';

const authStore = useAuthStore();

const welcomeTitle = computed(() => {
  if (authStore.role === 'super_admin') {
    return '总管理员，欢迎进入管理员后台';
  }
  if (authStore.role === 'admin' && authStore.county) {
    return `${authStore.county}管理员，欢迎进入管理员后台`;
  }
  return '欢迎进入管理员后台';
});
</script>

<style scoped lang="scss">
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  
  .welcome-section {
    text-align: center;
    margin-bottom: 40px;
    
    h2 {
      font-size: 28px;
      color: #303133;
      margin-bottom: 10px;
    }
    
    p {
      color: #909399;
      font-size: 16px;
    }
  }
  
  .menu-cards {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    justify-content: center;
    
    .menu-card {
      width: 300px;
      cursor: pointer;
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-5px);
      }
      
      .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 20px;
        
        .card-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        h3 {
          font-size: 20px;
          margin-bottom: 10px;
          color: #303133;
        }
        
        p {
          color: #606266;
          font-size: 14px;
          line-height: 1.5;
        }
      }
    }
  }
}
</style>
