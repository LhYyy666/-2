import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import pinia from '../stores';
import Login from '../views/Login.vue';
import Layout from '../layout/index.vue';
import UserManagement from '../views/UserManagement.vue';
import DeviceSerialLog from '../views/DeviceSerialLog.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'UserManagement',
        component: UserManagement,
        meta: { requiresAuth: true, title: '用户管理' }
      }
      ,
      {
        path: 'devices',
        name: 'DeviceSerialLog',
        component: DeviceSerialLog,
        meta: { requiresAuth: true, title: '设备串码日志' }
      }
    ]
  },
  // Catch all redirect to home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(pinia);
  if (to.meta.requiresAuth && !authStore.token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
