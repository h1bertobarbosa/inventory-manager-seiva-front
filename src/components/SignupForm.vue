<template>
  <v-container>
    <v-card class="mx-auto my-8" max-width="600">
      <v-card-title class="text-h5 primary white--text"> Cadastro de Usuário </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="submitForm">
          <v-row>
            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-2">Dados do Usuário</h3>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                :rules="nameRules"
                label="Nome"
                required
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.email"
                :rules="emailRules"
                label="E-mail"
                required
                variant="outlined"
                density="comfortable"
                type="email"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.password"
                :rules="passwordRules"
                label="Senha"
                required
                variant="outlined"
                density="comfortable"
                type="password"
                hint="Mínimo de 6 caracteres"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-2 mt-4">Dados da Empresa</h3>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.companyName"
                :rules="companyNameRules"
                label="Nome da Empresa"
                required
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.companyDocument"
                :rules="companyDocumentRules"
                label="CNPJ"
                required
                variant="outlined"
                density="comfortable"
                v-mask="'##.###.###/####-##'"
                hint="Formato: 00.000.000/0000-00"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.companyEmail"
                :rules="emailRules"
                label="E-mail da Empresa"
                required
                variant="outlined"
                density="comfortable"
                type="email"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="loading"
          :disabled="!valid"
          @click="submitForm"
          size="large"
        >
          Cadastrar
        </v-btn>
      </v-card-actions>
    </v-card>

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
import { VueMaskDirective } from 'v-mask'
import { apiService } from '@/services/apiService.js'

export default {
  name: 'SignupForm',
  directives: {
    mask: VueMaskDirective,
  },
  setup() {
    const form = ref(null)
    const valid = ref(false)
    const loading = ref(false)

    const formData = reactive({
      name: '',
      email: '',
      password: '',
      companyName: '',
      companyDocument: '',
      companyEmail: '',
    })

    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success',
    })

    const nameRules = [
      (v) => !!v || 'Nome é obrigatório',
      (v) => v.length >= 3 || 'Nome deve ter pelo menos 3 caracteres',
    ]

    const emailRules = [
      (v) => !!v || 'E-mail é obrigatório',
      (v) => /.+@.+\..+/.test(v) || 'E-mail deve ser válido',
    ]

    const passwordRules = [
      (v) => !!v || 'Senha é obrigatória',
      (v) => v.length >= 6 || 'Senha deve ter pelo menos 6 caracteres',
    ]

    const companyNameRules = [(v) => !!v || 'Nome da empresa é obrigatório']

    const companyDocumentRules = [
      (v) => !!v || 'CNPJ é obrigatório',
      (v) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v) || 'CNPJ deve estar no formato correto',
    ]

    const submitForm = async () => {
      const { valid } = await form.value.validate()
      if (!valid) return

      loading.value = true

      try {
        // A lógica de formatação do CNPJ permanece no componente
        const formattedData = {
          ...formData,
          companyDocument: formData.companyDocument.replace(/[^\d]/g, ''),
        }

        // 2. Usar o serviço de API para fazer o cadastro
        await apiService.signup(formattedData)

        // A lógica de sucesso permanece no componente
        snackbar.text = 'Cadastro realizado com sucesso!'
        snackbar.color = 'success'
        snackbar.show = true

        form.value.reset()
        Object.keys(formData).forEach((key) => (formData[key] = ''))
      } catch (error) {
        // A lógica de erro permanece no componente
        console.error('Erro de cadastro:', error)
        snackbar.text = error.message
        snackbar.color = 'error'
        snackbar.show = true
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      valid,
      loading,
      formData,
      snackbar,
      nameRules,
      emailRules,
      passwordRules,
      companyNameRules,
      companyDocumentRules,
      submitForm,
    }
  },
}
</script>
