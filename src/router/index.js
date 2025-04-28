import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SigninView from '@/views/SigninView.vue'
import SignupView from '@/views/SignupView.vue'
import DashboardView from '@/views/DashboardView.vue'
import InventoryView from '@/views/InventoryView.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import SessionView from '@/views/SessionView.vue'

const routes = [
  {
    path: '/',
    redirect: '/signin',
  },
  {
    path: '/signin',
    name: 'Signin',
    component: SigninView,
    meta: { requiresAuth: false },
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupView,
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView,
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: InventoryView,
      },
      {
        path: '/sessions',
        name: 'Session',
        component: SessionView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Proteção de rotas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/signin')
  } else if (
    !requiresAuth &&
    authStore.isAuthenticated &&
    (to.path === '/signin' || to.path === '/signup')
  ) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
