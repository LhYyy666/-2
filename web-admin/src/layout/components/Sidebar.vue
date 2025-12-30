<template>
  <div class="sidebar-container">
    <div class="logo">
      <img src="@/assets/vue.svg" alt="Logo" class="logo-img" />
      <span class="logo-text">Admin System</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      router
    >
      <el-menu-item index="/">
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
      <el-menu-item index="/devices">
        <el-icon><Document /></el-icon>
        <span>设备串码日志</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { User, Document } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped lang="scss">
.sidebar-container {
  height: 100%;
  background-color: #304156;
  display: flex;
  flex-direction: column;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2b2f3a;
    color: #fff;
    font-weight: bold;
    font-size: 18px;
    
    .logo-img {
      width: 32px;
      height: 32px;
      margin-right: 10px;
    }
  }
  
  .sidebar-menu {
    border-right: none;
    flex: 1;
  }
}
</style>
