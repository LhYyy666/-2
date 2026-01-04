import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('admin_token') || '');
  const role = ref(localStorage.getItem('admin_role') || '');
  const county = ref(localStorage.getItem('admin_county') || '');

  function setToken(newToken, newRole, newCounty) {
    token.value = newToken;
    localStorage.setItem('admin_token', newToken);
    
    if (newRole) {
      role.value = newRole;
      localStorage.setItem('admin_role', newRole);
    }
    
    if (newCounty) {
      county.value = newCounty;
      localStorage.setItem('admin_county', newCounty);
    }
  }

  function logout() {
    token.value = '';
    role.value = '';
    county.value = '';
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_role');
    localStorage.removeItem('admin_county');
  }

  return { token, role, county, setToken, logout };
});
