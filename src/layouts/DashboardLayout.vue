<!-- src/layouts/DashboardLayout.vue -->
<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app color="primary" dark>
      <v-list-item class="pa-4">
        <v-list-item-title class="text-h6"> Sistema de Gestão </v-list-item-title>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          :to="{ name: 'Dashboard' }"
          value="dashboard"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-package-variant-closed"
          title="Estoque"
          :to="{ name: 'Inventory' }"
          value="inventory"
        ></v-list-item>

        <v-list-item
          prepend-icon="mdi-package-variant-closed"
          title="Sessões"
          :to="{ name: 'Session' }"
          value="Session"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-package-variant-closed"
          title="Usuários"
          :to="{ name: 'User' }"
          value="User"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list>
          <v-list-item prepend-icon="mdi-logout" title="Sair" @click="logout"></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ currentPageTitle }}</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'DashboardLayout',
  setup() {
    const drawer = ref(true)
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const currentPageTitle = computed(() => {
      const routeMap = {
        Dashboard: 'Dashboard',
        Inventory: 'Estoque',
        Session: 'Sessões',
      }
      return routeMap[route.name] || 'Dashboard'
    })

    const logout = () => {
      authStore.logout()
      router.push('/signin')
    }

    return {
      drawer,
      currentPageTitle,
      logout,
    }
  },
}
</script>
