<template>
  <div>
    <v-card>
      <v-card-title>
        <h3>Gerenciamento de Usuários</h3>
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" class="mr-4" @click="openDialog()">
          Novo Usuário
        </v-btn>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Pesquisar por nome ou e-mail"
          single-line
          hide-details
          density="compact"
          class="ml-4"
          style="max-width: 300px"
          @keyup.enter="fetchUsers"
          @click:append="fetchUsers"
        ></v-text-field>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          :page="page"
          :items-per-page="limit"
          :items-length="totalItems"
          class="elevation-1 mt-4"
          item-value="id"
          @update:options="handleOptionsUpdate"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-tooltip text="Editar">
              <template v-slot:activator="{ props }">
                <v-icon
                  size="small"
                  color="primary"
                  class="mr-2"
                  v-bind="props"
                  @click="openDialog(item)"
                >
                  mdi-pencil
                </v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Excluir">
              <template v-slot:activator="{ props }">
                <v-icon size="small" color="error" v-bind="props" @click="deleteItem(item)">
                  mdi-delete
                </v-icon>
              </template>
            </v-tooltip>
          </template>
          <template v-slot:no-data>
            <div class="text-center py-4">Nenhum usuário encontrado</div>
          </template>
          <template v-slot:loading>
            <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
          </template>
          <template v-slot:bottom></template>
        </v-data-table>

        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <v-pagination
            v-model="page"
            :length="totalPages"
            @update:model-value="fetchUsers"
            :total-visible="7"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog.show" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="form" v-model="dialog.valid">
            <v-text-field
              v-model="dialog.item.name"
              label="Nome Completo"
              :rules="[rules.required]"
              required
              variant="outlined"
              density="comfortable"
              autofocus
            ></v-text-field>

            <v-text-field
              v-model="dialog.item.email"
              label="E-mail"
              type="email"
              :rules="[rules.required, rules.email]"
              required
              variant="outlined"
              density="comfortable"
              class="mt-3"
            ></v-text-field>

            <v-text-field
              v-model="dialog.item.password"
              label="Senha"
              type="password"
              :rules="isEditing ? [] : [rules.required, rules.password]"
              :required="!isEditing"
              variant="outlined"
              density="comfortable"
              class="mt-3"
              :hint="isEditing ? 'Deixe em branco para não alterar' : 'Mínimo de 6 caracteres'"
              persistent-hint
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog"> Cancelar </v-btn>
          <v-btn
            color="primary"
            :loading="dialog.loading"
            :disabled="!dialog.valid"
            @click="submitForm"
          >
            {{ isEditing ? 'Salvar' : 'Criar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.show" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 error--text">Confirmar Exclusão</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir o usuário <strong>"{{ deleteDialog.item?.name }}"</strong>?
          <br />
          <span class="text-caption text-error">Esta ação não pode ser desfeita.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="closeDeleteDialog"
            :disabled="deleteDialog.loading"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="deleteDialog.loading"
          >
            Excluir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Fechar </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { apiService } from '@/services/apiService.js'

// --- Estado Reativo ---
const loading = ref(false)
const search = ref('')
const page = ref(1)
const limit = ref(10)
const totalItems = ref(0)
const users = ref([])
const form = ref(null)

// --- Dialogs ---
const snackbar = reactive({ show: false, text: '', color: 'success' })
const deleteDialog = reactive({ show: false, loading: false, item: null })

const defaultItem = () => ({ id: null, name: '', email: '', password: '' })
const dialog = reactive({
  show: false,
  valid: false,
  loading: false,
  item: defaultItem(),
})

// --- Propriedades Computadas ---
const isEditing = computed(() => !!dialog.item.id)
const totalPages = computed(() => Math.ceil(totalItems.value / limit.value))

// --- Regras de Validação ---
const rules = {
  required: (v) => !!v || 'Campo obrigatório',
  email: (v) => /.+@.+\..+/.test(v) || 'E-mail deve ser válido',
  password: (v) => (v && v.length >= 6) || 'A senha deve ter no mínimo 6 caracteres',
}

// --- Cabeçalhos da Tabela ---
const headers = [
  { title: 'Nome', key: 'name', sortable: true, align: 'start' },
  { title: 'E-mail', key: 'email', sortable: true },
  { title: 'Criado em', key: 'createdAt', sortable: true },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
]

// --- Métodos ---

const formatDate = (dateInput) => {
  if (!dateInput) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(dateInput),
  )
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value, search: search.value }
    const data = await apiService.getUsers(params)
    users.value = data.users || []
    totalItems.value = data.total || 0
  } catch (error) {
    snackbar.text = error.message || 'Erro ao carregar usuários.'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    loading.value = false
  }
}

const handleOptionsUpdate = ({ page: newPage, itemsPerPage: newLimit }) => {
  page.value = newPage
  limit.value = newLimit
  fetchUsers()
}

// --- Métodos dos Dialogs ---

const openDialog = (item = null) => {
  if (item) {
    // Editando: preenche o formulário com os dados do item
    dialog.item = { ...item, password: '' } // Limpa a senha por segurança
  } else {
    // Criando: reseta para o padrão
    dialog.item = defaultItem()
  }
  dialog.show = true
  dialog.loading = false
  form.value?.resetValidation()
}

const closeDialog = () => {
  dialog.show = false
}

const submitForm = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  dialog.loading = true
  try {
    const payload = {
      name: dialog.item.name,
      email: dialog.item.email,
    }
    // Adiciona a senha apenas se for um novo usuário ou se ela foi preenchida na edição
    if (dialog.item.password) {
      payload.password = dialog.item.password
    }

    if (isEditing.value) {
      await apiService.updateUser(dialog.item.id, payload)
      snackbar.text = 'Usuário atualizado com sucesso!'
    } else {
      await apiService.createUser(payload)
      snackbar.text = 'Usuário criado com sucesso!'
    }

    snackbar.color = 'success'
    snackbar.show = true
    closeDialog()
    fetchUsers()
  } catch (error) {
    snackbar.text = error.message
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    dialog.loading = false
  }
}

const deleteItem = (item) => {
  deleteDialog.item = item
  deleteDialog.show = true
}

const closeDeleteDialog = () => {
  deleteDialog.show = false
  deleteDialog.item = null
}

const confirmDelete = async () => {
  deleteDialog.loading = true
  try {
    await apiService.deleteUser(deleteDialog.item.id)
    snackbar.text = 'Usuário excluído com sucesso!'
    snackbar.color = 'success'
    snackbar.show = true
    closeDeleteDialog()
    // Se o item excluído era o único na página, volta para a página anterior
    if (users.value.length === 1 && page.value > 1) {
      page.value = page.value - 1
    }
    fetchUsers()
  } catch (error) {
    console.error(error)
    snackbar.text = error.message
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    deleteDialog.loading = false
  }
}

// --- Lifecycle Hook ---
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
}
</style>
