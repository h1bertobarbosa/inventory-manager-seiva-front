import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    clearToken() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },

    logout() {
      this.clearToken()
      // Você pode adicionar outras lógicas de logout aqui
    },
  },
})
