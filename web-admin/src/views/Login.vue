<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <div class="login-info">
          <div class="logo-text">咸阳网格后台管理</div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-content">
          <h2 class="welcome-title">欢迎登录</h2>
          <p class="welcome-desc">请输入您的账号和密码</p>
          
          <el-form 
            :model="loginForm" 
            :rules="rules" 
            ref="loginFormRef" 
            class="login-form"
            size="large"
          >
            <el-form-item prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="用户名" 
                prefix-icon="User"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="密码" 
                prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
                class="custom-input"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="loading" 
                class="login-btn" 
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import request from '../api/request';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const authStore = useAuthStore();
const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await request.post('', {
          type: 'admin-login',
          username: loginForm.username,
          password: loginForm.password
        });
        
        authStore.setToken(res.token, res.role, res.county);
        ElMessage.success('登录成功');
        router.push('/');
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
  background-image: 
    radial-gradient(#e6e6e6 1px, transparent 1px),
    radial-gradient(#e6e6e6 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}

.login-box {
  width: 900px;
  height: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  display: flex;
  overflow: hidden;

  @media (max-width: 960px) {
    width: 90%;
    height: auto;
    min-height: 500px;
  }
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #3CA5F6 0%, #26C6DA 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;

  // 添加纹理效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M1 1h2v2H1V1zm5 0h2v2H6V1zm4 0h2v2h-2V1zm4 0h2v2h-2V1zm4 0h2v2h-2V1zM1 6h2v2H1V6zm5 0h2v2H6V6zm4 0h2v2h-2V6zm4 0h2v2h-2V6zm4 0h2v2h-2V6zM1 11h2v2H1v-2zm5 0h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zM1 16h2v2H1v-2zm5 0h2v2H6v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/%3E%3C/g%3E%3C/svg%3E');
  }

  @media (max-width: 768px) {
    display: none;
  }

  .login-info {
    text-align: center;
    color: #fff;
    z-index: 1;

    .logo-text {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }

    .logo-desc {
      font-size: 16px;
      opacity: 0.85;
      letter-spacing: 0.5px;
    }
  }
}

.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
}

.login-form-content {
  width: 320px;
  padding: 20px;

  .welcome-title {
    font-size: 26px;
    font-weight: 800;
    color: #333;
    margin-bottom: 8px;
  }

  .welcome-desc {
    font-size: 14px;
    color: #909399;
    margin-bottom: 32px;
  }

  .custom-input {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #dcdfe6 inset;
      border-radius: 4px;
      padding: 1px 11px;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 0 0 1px #c0c4cc inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 1px #409eff inset;
      }
    }
    
    :deep(.el-input__inner) {
      height: 40px;
    }
  }

  .login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
    background-color: #3CA5F6;
    border-color: #3CA5F6;
    margin-top: 8px;
    transition: all 0.3s;

    &:hover {
      background-color: #2b95e6;
      border-color: #2b95e6;
      box-shadow: 0 4px 12px rgba(60, 165, 246, 0.3);
    }
  }
}
</style>
