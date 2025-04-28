<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5"> Dashboard </v-card-title>
          <v-card-text>
            <p>Bem-vindo ao seu dashboard!</p>
            <p>Você está autenticado e pode acessar recursos protegidos.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" @click="logout"> Sair </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'DashboardView',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()

    const logout = () => {
      authStore.logout()
      router.push('/signin')
    }

    return {
      logout,
    }
  },
}
</script>
