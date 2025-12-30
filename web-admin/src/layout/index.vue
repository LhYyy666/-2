<template>
  <div class="app-wrapper">
    <el-container class="main-container">
      <el-aside width="210px" class="sidebar-container">
        <Sidebar />
      </el-aside>
      <el-container>
        <el-header class="header-wrapper" height="60px">
          <Header />
        </el-header>
        <el-main class="app-main">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
</script>

<style scoped lang="scss">
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.main-container {
  height: 100vh;
}

.header-wrapper {
  padding: 0;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
}

/* Transition */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>