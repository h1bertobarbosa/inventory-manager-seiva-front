<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-h5 primary white--text"> Login </v-card-title>

          <v-card-text class="pt-4">
            <v-form ref="form" v-model="valid" @submit.prevent="submitForm">
              <v-text-field
                v-model="formData.email"
                :rules="emailRules"
                label="E-mail"
                prepend-inner-icon="mdi-email"
                variant="outlined"
                density="comfortable"
                required
                type="email"
              ></v-text-field>

              <v-text-field
                v-model="formData.password"
                :rules="passwordRules"
                label="Senha"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                density="comfortable"
                required
                type="password"
              ></v-text-field>

              <div class="d-flex justify-end mt-3">
                <v-btn
                  color="primary"
                  :loading="loading"
                  :disabled="!valid"
                  @click="submitForm"
                  size="large"
                  class="px-6"
                >
                  Entrar
                </v-btn>
              </div>
            </v-form>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="pa-4">
            <span class="text-body-2">Não tem uma conta?</span>
            <v-spacer></v-spacer>
            <v-btn variant="text" color="primary" @click="goToSignup"> Cadastre-se </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Fechar </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/apiService.js'

export default {
  name: 'SigninForm',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const form = ref(null)
    const valid = ref(false)
    const loading = ref(false)

    const formData = reactive({
      email: '',
      password: '',
    })

    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success',
    })

    const emailRules = [
      (v) => !!v || 'E-mail é obrigatório',
      (v) => /.+@.+\..+/.test(v) || 'E-mail deve ser válido',
    ]

    const passwordRules = [(v) => !!v || 'Senha é obrigatória']

    const submitForm = async () => {
      // A validação do formulário permanece a mesma
      const { valid } = await form.value.validate()
      if (!valid) return

      loading.value = true

      try {
        // 2. Usar o serviço de API para fazer o login
        const data = await apiService.signin(formData)

        // A lógica de sucesso permanece no componente
        authStore.setToken(data.accessToken)
        router.push('/dashboard')
      } catch (error) {
        // A lógica de erro permanece no componente
        console.error('Erro de login:', error)
        snackbar.text = error.message
        snackbar.color = 'error'
        snackbar.show = true
      } finally {
        loading.value = false
      }
    }

    const goToSignup = () => {
      router.push('/signup')
    }

    return {
      form,
      valid,
      loading,
      formData,
      snackbar,
      emailRules,
      passwordRules,
      submitForm,
      goToSignup,
    }
  },
}
</script>
