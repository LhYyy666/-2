import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '');

  function setToken(newToken) {
    token.value = newToken;
    localStorage.setItem('admin_token', newToken);
  }

  function logout() {
    token.value = '';
    localStorage.removeItem('admin_token');
  }

  return { token, setToken, logout };
});
