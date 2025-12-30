import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

// TODO: 请将此处替换为您的云函数 HTTP 访问 URL (云函数 URL 化)
// 格式通常为: https://<env-id>.service.tcloudbase.com/adminService
const CLOUD_FUNCTION_URL = 'https://your-env-id.service.tcloudbase.com/adminService'; 

const service = axios.create({
  baseURL: CLOUD_FUNCTION_URL,
  timeout: 10000
});

// Request interceptor
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
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
        const authStore = useAuthStore();
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
