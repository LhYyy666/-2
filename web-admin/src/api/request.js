import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';
import pinia from '../stores';

// 云函数 HTTP 访问 URL（云函数 URL 化 / HTTP 访问服务）
// 示例：环境域名 + 你配置的路由路径，例如 /adminService
const CLOUD_FUNCTION_URL = '/adminService';

const service = axios.create({
  baseURL: CLOUD_FUNCTION_URL,
  timeout: 10000
});

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore(pinia);
    if (authStore.token) {
      config.headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 约定：code === 0 为成功
    if (res.code !== 0) {
      ElMessage.error(res.msg || 'Error');
      
      if (res.code === 401) {
        const authStore = useAuthStore(pinia);
        authStore.logout();
        // 简单处理：刷新页面或跳转登录
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      return Promise.reject(new Error(res.msg || 'Error'));
    }
    return res.data;
  },
  (error) => {
    ElMessage.error(error.message || 'Network Error');
    return Promise.reject(error);
  }
);

export default service;
