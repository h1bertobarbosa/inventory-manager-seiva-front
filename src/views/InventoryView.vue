<!-- src/views/InventoryView.vue -->
<template>
  <div>
    <v-card>
      <v-card-title>
        <h3>Listagem de Estoque</h3>
        <v-spacer></v-spacer>

        <v-btn color="primary" prepend-icon="mdi-plus" class="mr-4" @click="openCreateDialog">
          Novo Item
        </v-btn>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Pesquisar"
          single-line
          hide-details
          density="compact"
          class="ml-4"
          style="max-width: 300px"
          @keyup.enter="fetchInventory"
        ></v-text-field>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filterField"
              :items="filterFields"
              label="Filtrar por"
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-menu
              ref="preparationDateMenu"
              v-model="preparationDateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
              v-if="filterField === 'preparationDate'"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="preparationDate"
                  label="Data de Preparação"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="compact"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="preparationDate"
                @update:model-value="preparationDateMenu = false"
              ></v-date-picker>
            </v-menu>
          </v-col>
          <v-col cols="12" sm="4" class="d-flex align-center">
            <v-btn
              color="primary"
              @click="fetchInventory"
              prepend-icon="mdi-filter"
              class="ml-auto"
            >
              Filtrar
            </v-btn>
            <v-btn
              color="secondary"
              @click="clearFilters"
              prepend-icon="mdi-filter-remove"
              class="ml-2"
            >
              Limpar
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="inventoryItems"
          :loading="loading"
          class="elevation-1 mt-4"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          <template v-slot:item.updatedAt="{ item }">
            {{ formatDate(item.updatedAt) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-tooltip text="Entrada">
              <template v-slot:activator="{ props }">
                <v-icon
                  size="small"
                  color="success"
                  class="mr-2"
                  v-bind="props"
                  @click="openInputDialog(item)"
                >
                  mdi-arrow-down-bold-box
                </v-icon>
              </template>
            </v-tooltip>

            <v-tooltip text="Saída">
              <template v-slot:activator="{ props }">
                <v-icon
                  size="small"
                  color="error"
                  class="mr-2"
                  v-bind="props"
                  @click="openOutputDialog(item)"
                >
                  mdi-arrow-up-bold-box
                </v-icon>
              </template>
            </v-tooltip>

            <v-tooltip text="Editar">
              <template v-slot:activator="{ props }">
                <v-icon
                  size="small"
                  color="primary"
                  class="mr-2"
                  v-bind="props"
                  @click="editItem(item)"
                >
                  mdi-pencil
                </v-icon>
              </template>
            </v-tooltip>

            <v-tooltip text="Excluir">
              <template v-slot:activator="{ props }">
                <v-icon size="small" color="grey" v-bind="props" @click="deleteItem(item)">
                  mdi-delete
                </v-icon>
              </template>
            </v-tooltip>
          </template>
          <template v-slot:no-data>
            <div class="text-center py-4">Nenhum item encontrado</div>
          </template>
        </v-data-table>

        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="page"
            :length="totalPages"
            @update:model-value="fetchInventory"
            :total-visible="7"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>

    <!-- Modal de Entrada de Estoque -->
    <v-dialog v-model="inputDialog.show" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-success text-white"> Entrada de Estoque </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="inputForm" v-model="inputDialog.valid">
            <p class="text-subtitle-1 mb-2">
              Item: <strong>{{ inputDialog.item?.description }}</strong>
            </p>
            <p class="text-subtitle-2 mb-4">
              Litros atual: <strong>{{ inputDialog.item?.quantity }}</strong>
            </p>

            <v-text-field
              v-model.number="inputDialog.quantity"
              label="Litros a adicionar"
              type="number"
              min="1"
              :rules="quantityRules"
              required
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-textarea
              v-model="inputDialog.obs"
              label="Observações"
              variant="outlined"
              density="comfortable"
              rows="3"
            ></v-textarea>

            <v-menu
              ref="inputDateMenu"
              v-model="inputDialog.dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="inputDialog.formattedDate"
                  label="Data de Entrada"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="comfortable"
                  variant="outlined"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="inputDialog.date"
                @update:model-value="updateInputDate"
              ></v-date-picker>
            </v-menu>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeInputDialog"> Cancelar </v-btn>
          <v-btn
            color="success"
            :loading="inputDialog.loading"
            :disabled="!inputDialog.valid"
            @click="submitInput"
          >
            Confirmar Entrada
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="createDialog.show" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white"> Novo Item de Estoque </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="createForm" v-model="createDialog.valid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="createDialog.description"
                  label="Descrição"
                  :rules="[(v) => !!v || 'Descrição é obrigatória']"
                  required
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.tankage"
                  label="Armazenamento"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.origin"
                  label="Origem"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.master_preparation"
                  label="Preparação Principal"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.input_type"
                  label="Tipo de Entrada"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="createDialog.quantity"
                  label="Litros"
                  type="number"
                  min="0"
                  :rules="[(v) => v >= 0 || 'Litros não pode ser negativa']"
                  required
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-menu
                  ref="preparationDateMenu"
                  v-model="createDialog.dateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="createDialog.formattedDate"
                      label="Data de Preparação"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      density="comfortable"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="createDialog.date"
                    @update:model-value="updateCreateDate"
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="createDialog.obs"
                  label="Observações"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeCreateDialog"> Cancelar </v-btn>
          <v-btn
            color="primary"
            :loading="createDialog.loading"
            :disabled="!createDialog.valid"
            @click="submitCreate"
          >
            Criar Item
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Modal de Saída de Estoque -->
    <v-dialog v-model="outputDialog.show" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-error text-white"> Saída de Estoque </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="outputForm" v-model="outputDialog.valid">
            <p class="text-subtitle-1 mb-2">
              Item: <strong>{{ outputDialog.item?.description }}</strong>
            </p>
            <p class="text-subtitle-2 mb-4">
              Litros atual: <strong>{{ outputDialog.item?.quantity }}</strong>
            </p>

            <v-text-field
              v-model.number="outputDialog.quantity"
              label="Litros a retirar"
              type="number"
              min="1"
              :max="outputDialog.item?.quantity"
              :rules="[
                (v) => !!v || 'Litros é obrigatória',
                (v) => v > 0 || 'Litros deve ser maior que zero',
                (v) =>
                  v <= outputDialog.item?.quantity ||
                  'Litros não pode ser maior que o estoque atual',
              ]"
              required
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-textarea
              v-model="outputDialog.obs"
              label="Observações"
              variant="outlined"
              density="comfortable"
              rows="3"
            ></v-textarea>

            <v-menu
              ref="outputDateMenu"
              v-model="outputDialog.dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="outputDialog.formattedDate"
                  label="Data de Saída"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="comfortable"
                  variant="outlined"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="outputDialog.date"
                @update:model-value="updateOutputDate"
              ></v-date-picker>
            </v-menu>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeOutputDialog"> Cancelar </v-btn>
          <v-btn
            color="error"
            :loading="outputDialog.loading"
            :disabled="!outputDialog.valid"
            @click="submitOutput"
          >
            Confirmar Saída
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false"> Fechar </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'InventoryView',
  setup() {
    const authStore = useAuthStore()
    const loading = ref(false)
    const search = ref('')
    const page = ref(1)
    const limit = ref(10)
    const totalItems = ref(0)
    const inventoryItems = ref([])
    const filterField = ref('description')
    const preparationDate = ref('')
    const preparationDateMenu = ref(false)
    const inputForm = ref(null)
    const outputForm = ref(null)
    const createForm = ref(null) // *** ADDED: Ref for the create form ***
    const filterFields = [
      { title: 'Descrição', value: 'description' },
      { title: 'Preparação Principal', value: 'masterPreparation' },
      { title: 'Data de Preparação', value: 'preparationDate' },
    ]

    const headers = [
      { title: 'Descrição', key: 'description', sortable: true },
      { title: 'Armazenamento', key: 'tankage', sortable: true },
      { title: 'Origem', key: 'origin', sortable: true },
      { title: 'Litros', key: 'quantity', sortable: true },
      { title: 'Observações', key: 'obs', sortable: false },
      { title: 'Criado em', key: 'createdAt', sortable: true },
      { title: 'Atualizado em', key: 'updatedAt', sortable: true },
      { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
    ]

    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success',
    })

    const inputDialog = reactive({
      show: false,
      valid: false,
      loading: false,
      item: null,
      quantity: 1,
      obs: '',
      date: new Date().toISOString().substr(0, 10),
      dateMenu: false,
      formattedDate: formatDateForDisplay(new Date()),
    })

    const outputDialog = reactive({
      show: false,
      valid: false,
      loading: false,
      item: null,
      quantity: 1,
      obs: '',
      date: new Date().toISOString().substr(0, 10),
      dateMenu: false,
      formattedDate: formatDateForDisplay(new Date()),
    })

    const quantityRules = [
      (v) => !!v || 'Litros é obrigatória',
      (v) => v > 0 || 'Litros deve ser maior que zero',
    ]

    const totalPages = computed(() => {
      return Math.ceil(totalItems.value / limit.value)
    })

    function formatDateForDisplay(date) {
      if (!date) return ''
      if (typeof date === 'string') date = new Date(date)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    }

    function formatDateForApi(dateString) {
      if (!dateString) return new Date().toISOString()
      // Se for uma data no formato brasileiro (DD/MM/YYYY), converte para o formato ISO
      if (dateString.includes('/')) {
        const parts = dateString.split('/')
        const date = new Date(parts[2], parts[1] - 1, parts[0])
        return date.toISOString()
      }
      return new Date(dateString).toISOString()
    }

    const updateInputDate = (date) => {
      inputDialog.date = date
      inputDialog.formattedDate = formatDateForDisplay(date)
      inputDialog.dateMenu = false
    }

    const updateOutputDate = (date) => {
      outputDialog.date = date
      outputDialog.formattedDate = formatDateForDisplay(date)
      outputDialog.dateMenu = false
    }

    const fetchInventory = async () => {
      loading.value = true

      try {
        let url = `http://localhost:3000/inventory?page=${page.value}&limit=${limit.value}`

        // Adicionar filtro se houver pesquisa
        if (search.value) {
          url += `&filter=${filterField.value}:${search.value}`
        }

        // Adicionar filtro de data se selecionado
        if (filterField.value === 'preparationDate' && preparationDate.value) {
          url += `&filter=preparationDate:${preparationDate.value}`
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authStore.token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar dados do estoque')
        }

        const data = await response.json()

        inventoryItems.value = data.items
        totalItems.value = data.total
        page.value = parseInt(data.page)
        limit.value = parseInt(data.limit)
      } catch (error) {
        console.error('Erro:', error)
        snackbar.text = error.message || 'Erro ao carregar dados do estoque'
        snackbar.color = 'error'
        snackbar.show = true
      } finally {
        loading.value = false
      }
    }

    const clearFilters = () => {
      search.value = ''
      filterField.value = 'description'
      preparationDate.value = ''
      page.value = 1
      fetchInventory()
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    }

    const openInputDialog = (item) => {
      inputDialog.item = item
      inputDialog.quantity = 1
      inputDialog.obs = ''
      inputDialog.date = new Date().toISOString().substr(0, 10)
      inputDialog.formattedDate = formatDateForDisplay(new Date())
      inputDialog.show = true
    }

    const closeInputDialog = () => {
      inputDialog.show = false
      inputDialog.item = null
    }

    const openOutputDialog = (item) => {
      outputDialog.item = item
      outputDialog.quantity = 1
      outputDialog.obs = ''
      outputDialog.date = new Date().toISOString().substr(0, 10)
      outputDialog.formattedDate = formatDateForDisplay(new Date())
      outputDialog.show = true
    }

    const closeOutputDialog = () => {
      outputDialog.show = false
      outputDialog.item = null
    }

    const submitInput = async () => {
      if (!inputForm.value.validate()) return

      inputDialog.loading = true

      try {
        const response = await fetch(
          `http://localhost:3000/inventory/${inputDialog.item.id}/input`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quantity: inputDialog.quantity,
              obs: inputDialog.obs,
              outputDate: formatDateForApi(inputDialog.date),
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Erro ao registrar entrada de estoque')
        }

        snackbar.text = 'Entrada de estoque registrada com sucesso!'
        snackbar.color = 'success'
        snackbar.show = true

        closeInputDialog()
        fetchInventory()
      } catch (error) {
        console.error('Erro:', error)
        snackbar.text = error.message || 'Erro ao registrar entrada de estoque'
        snackbar.color = 'error'
        snackbar.show = true
      } finally {
        inputDialog.loading = false
      }
    }

    const submitOutput = async () => {
      if (!outputForm.value.validate()) return

      outputDialog.loading = true

      try {
        const response = await fetch(
          `http://localhost:3000/inventory/${outputDialog.item.id}/output`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${authStore.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quantity: outputDialog.quantity,
              obs: outputDialog.obs,
              outputDate: formatDateForApi(outputDialog.date),
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Erro ao registrar saída de estoque')
        }

        snackbar.text = 'Saída de estoque registrada com sucesso!'
        snackbar.color = 'success'
        snackbar.show = true

        closeOutputDialog()
        fetchInventory()
      } catch (error) {
        console.error('Erro:', error)
        snackbar.text = error.message || 'Erro ao registrar saída de estoque'
        snackbar.color = 'error'
        snackbar.show = true
      } finally {
        outputDialog.loading = false
      }
    }

    const editItem = (item) => {
      // Implementar edição de item
      console.log('Editar item:', item)
    }

    const deleteItem = (item) => {
      // Implementar exclusão de item
      console.log('Excluir item:', item)
    }
    const createDialog = reactive({
      show: false,
      valid: false,
      loading: false,
      description: '',
      tankage: '',
      origin: '',
      master_preparation: '',
      input_type: '',
      obs: '',
      quantity: 0,
      date: new Date().toISOString().substr(0, 10),
      dateMenu: false,
      formattedDate: formatDateForDisplay(new Date()),
    })
    const openCreateDialog = () => {
      // Resetar o formulário
      createDialog.description = ''
      createDialog.tankage = ''
      createDialog.origin = ''
      createDialog.master_preparation = ''
      createDialog.input_type = ''
      createDialog.obs = ''
      createDialog.quantity = 0
      createDialog.date = new Date().toISOString().substr(0, 10)
      createDialog.formattedDate = formatDateForDisplay(new Date())
      createDialog.show = true
    }

    onMounted(() => {
      fetchInventory()
    })

    return {
      loading,
      search,
      page,
      limit,
      totalItems,
      inventoryItems,
      headers,
      snackbar,
      filterField,
      filterFields,
      preparationDate,
      preparationDateMenu,
      totalPages,
      inputDialog,
      outputDialog,
      inputForm,
      outputForm,
      quantityRules,
      fetchInventory,
      clearFilters,
      formatDate,
      editItem,
      deleteItem,
      openInputDialog,
      closeInputDialog,
      openOutputDialog,
      closeOutputDialog,
      submitInput,
      submitOutput,
      updateInputDate,
      updateOutputDate,
      createDialog,
      openCreateDialog,
    }
  },
}
</script>
