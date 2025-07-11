<!-- src/views/SessionView.vue -->
<template>
  <div>
    <v-card>
      <!-- Card Title and Actions (No changes here) -->
      <v-card-title>
        <h3>Listagem de Sessões</h3>
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" class="mr-4" @click="openCreateDialog">
          Nova Sessão
        </v-btn>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Pesquisar Descrição"
          single-line
          hide-details
          density="compact"
          class="ml-4"
          style="max-width: 300px"
          @keyup.enter="fetchSessions"
          @click:append="fetchSessions"
        ></v-text-field>
      </v-card-title>

      <!-- Card Content (Table and Pagination - No changes here) -->
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="sessions"
          :loading="loading"
          :page="page"
          :items-per-page="limit"
          :items-length="totalItems"
          class="elevation-1 mt-4"
          item-value="id"
          @update:options="handleOptionsUpdate"
        >
          <template v-slot:item.sessionDate="{ item }">
            {{ formatDate(item.sessionDate) }}
          </template>
          <template v-slot:item.actions="{ item }">
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
                <v-icon size="small" color="error" v-bind="props" @click="deleteItem(item)">
                  mdi-delete
                </v-icon>
              </template>
            </v-tooltip>
          </template>
          <template v-slot:no-data>
            <div class="text-center py-4">Nenhuma sessão encontrada</div>
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
            @update:model-value="fetchSessions"
            :total-visible="7"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>

    <!-- *** MODIFIED Create Session Dialog *** -->
    <v-dialog v-model="createDialog.show" max-width="700px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white"> Nova Sessão </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="createForm" v-model="createDialog.valid">
            <v-row>
              <!-- Session Description -->
              <v-col cols="12">
                <v-text-field
                  v-model="createDialog.item.sessionDescription"
                  label="Descrição da Sessão"
                  :rules="[rules.required]"
                  required
                  variant="outlined"
                  density="comfortable"
                  autofocus
                ></v-text-field>
              </v-col>

              <!-- Master Driver -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.item.masterDriver"
                  label="Mestre Dirigente"
                  :rules="[rules.required]"
                  required
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <!-- Master Support -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.item.masterSupport"
                  label="Mestre Assistente"
                  :rules="[rules.required]"
                  required
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <!-- Document Reader -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="createDialog.item.documentReader"
                  label="Leitor de Documento"
                  :rules="[rules.required]"
                  required
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <!-- Session Date -->
              <v-col cols="12" sm="6">
                <v-menu
                  ref="createDateMenu"
                  v-model="createDialog.dateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  min-width="auto"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="createDialog.formattedDate"
                      label="Data da Sessão"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      density="comfortable"
                      variant="outlined"
                      :rules="[rules.required]"
                      required
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="createDialog.dateValue"
                    @update:model-value="updateCreateDate"
                    show-adjacent-months
                    hide-header
                  ></v-date-picker>
                </v-menu>
              </v-col>

              <!-- Cups Quantity -->
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="createDialog.item.cupsQuantity"
                  label="Quantidade de Copos"
                  type="number"
                  min="0"
                  :rules="[rules.required, rules.nonNegative]"
                  required
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="createDialog.item.quantityLeft"
                  label="Litros Restantes"
                  type="number"
                  min="0"
                  :rules="[rules.required, rules.nonNegative]"
                  required
                  variant="outlined"
                  density="comfortable"
                  hint="Informe a quantidade total restante após esta sessão"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <!-- Explanation -->
              <v-col cols="12">
                <v-textarea
                  v-model="createDialog.item.explanation"
                  label="Explicação / Observações"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                ></v-textarea>
              </v-col>

              <!-- *** Inventory Used Section *** -->
              <v-col cols="12">
                <h4 class="mb-2">Inventário Utilizado</h4>
                <v-divider class="mb-3"></v-divider>

                <!-- Loading indicator for inventory -->
                <div v-if="createDialog.inventoryLoading" class="text-center">
                  <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  <p>Carregando itens de inventário...</p>
                </div>
                <!-- Error message for inventory -->
                <v-alert
                  type="error"
                  v-else-if="createDialog.inventoryError"
                  density="compact"
                  class="mb-3"
                >
                  {{ createDialog.inventoryError }}
                </v-alert>

                <!-- Dynamic Inventory Item Rows -->
                <div v-if="!createDialog.inventoryLoading && !createDialog.inventoryError">
                  <v-row
                    v-for="(invItem, index) in createDialog.inventoryUsedItems"
                    :key="index"
                    align="center"
                    dense
                  >
                    <v-col cols="12" sm="6" md="5">
                      <v-autocomplete
                        v-model="invItem.id"
                        :items="availableInventoryItems"
                        item-title="description"
                        item-value="id"
                        label="Item do Estoque"
                        placeholder="Selecione um item"
                        :rules="[rules.required]"
                        required
                        variant="outlined"
                        density="comfortable"
                        clearable
                        no-data-text="Nenhum item encontrado"
                      >
                        <!-- Optional: Customize display -->
                        <!-- <template v-slot:item="{ props, item }">
                                <v-list-item v-bind="props" :title="item.raw.description" :subtitle="`ID: ${item.raw.id}`"></v-list-item>
                              </template> -->
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="8" sm="4" md="4">
                      <v-text-field
                        v-model.number="invItem.quantity"
                        label="Litros Usados"
                        type="number"
                        min="1"
                        :rules="[rules.required, rules.positive]"
                        required
                        variant="outlined"
                        density="comfortable"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="4" sm="2" class="text-right">
                      <v-btn
                        icon="mdi-delete"
                        color="error"
                        variant="text"
                        size="small"
                        @click="removeInventoryItem(index)"
                        :disabled="createDialog.inventoryUsedItems.length <= 1"
                        title="Remover Item"
                      ></v-btn>
                    </v-col>
                  </v-row>

                  <!-- Add Inventory Item Button -->
                  <v-btn
                    color="secondary"
                    prepend-icon="mdi-plus"
                    @click="addInventoryItem"
                    class="mt-2"
                    size="small"
                    variant="tonal"
                  >
                    Adicionar Item
                  </v-btn>
                </div>
              </v-col>
              <!-- *** End Inventory Used Section *** -->
            </v-row>
          </v-form>
        </v-card-text>

        <!-- Dialog Actions (No changes here) -->
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeCreateDialog"> Cancelar </v-btn>
          <v-btn
            color="primary"
            :loading="createDialog.loading"
            :disabled="
              !createDialog.valid || createDialog.inventoryLoading || !!createDialog.inventoryError
            "
            @click="submitCreate"
          >
            Criar Sessão
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- *** Delete Confirmation Dialog *** -->
    <v-dialog v-model="deleteDialog.show" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5 error--text">Confirmar Exclusão</v-card-title>
        <v-card-text>
          Tem certeza que deseja excluir a sessão
          <strong
            >"{{ deleteDialog.item?.description || deleteDialog.item?.sessionDescription }}"</strong
          >?
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

    <!-- Snackbar for Notifications (No changes here) -->
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
const loading = ref(false)
const search = ref('')
const page = ref(1)
const limit = ref(10)
const totalItems = ref(0)
const sessions = ref([])
const createForm = ref(null)
const availableInventoryItems = ref([]) // To store fetched inventory items

const deleteDialog = reactive({
  show: false,
  loading: false,
  item: null, // Store the item to be deleted
})

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
})

// --- *** MODIFIED defaultCreateItem and createDialog *** ---
const defaultCreateItem = () => ({
  sessionDescription: '', // Renamed from description
  masterDriver: '',
  masterSupport: '',
  explanation: '', // New field
  documentReader: '', // New field
  sessionDate: null,
  cupsQuantity: 0, // New field
})

const defaultInventoryUsedItem = () => ({
  id: null, // Will hold the selected inventory item ID
  quantity: null, // Will hold the quantity used for that item
})

const createDialog = reactive({
  show: false,
  valid: false,
  loading: false,
  inventoryLoading: false, // Loading state for inventory fetch
  inventoryError: null, // Error state for inventory fetch
  item: defaultCreateItem(),
  inventoryUsedItems: [defaultInventoryUsedItem()], // Array to hold selected inventory items
  dateValue: null,
  dateMenu: false,
  formattedDate: '',
})

// --- Validation Rules ---
const rules = {
  required: (v) => !!v || 'Campo obrigatório',
  nonNegative: (v) => v === null || v === undefined || v >= 0 || 'Valor não pode ser negativo',
  positive: (v) => v > 0 || 'Valor deve ser maior que zero',
}

// --- Computed Properties (No changes here) ---
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / limit.value)
})

// --- Headers for v-data-table (No changes here) ---
const headers = [
  { title: 'Descrição', key: 'description', sortable: true, align: 'start' }, // Key matches GET response
  { title: 'Data', key: 'sessionDate', sortable: true },
  { title: 'Mestre Dirigente', key: 'masterDriver', sortable: true },
  { title: 'Mestre Assistente', key: 'masterSupport', sortable: true },
  { title: 'Litros Usados', key: 'quantityUsed', sortable: false, align: 'end' },
  { title: 'Litros Restantes', key: 'quantityLeft', sortable: false, align: 'end' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' },
]

// --- Methods ---

// formatDate, formatDateForDisplay, formatDateForApi (No changes needed)
function formatDate(dateInput) {
  if (!dateInput) return ''
  try {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return 'Data inválida'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return 'Erro data'
  }
}
function formatDateForDisplay(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}
function formatDateForApi(date) {
  if (!date) return null
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return null
    return dateObj.toISOString()
  } catch (error) {
    console.log('Erro ao formatar data para API:', error)
    return null
  }
}

const fetchSessions = async () => {
  loading.value = true
  try {
    // 2. Use o serviço de API
    const params = {
      page: page.value,
      limit: limit.value,
      search: search.value || undefined, // Envia 'search' apenas se tiver valor
    }
    const result = await apiService.getSessions(params)

    sessions.value = result.data || []
    totalItems.value = result.pagination?.total ? Number(result.pagination.total) : 0
    page.value = result.pagination?.page ? Number(result.pagination.page) : 1
    limit.value = result.pagination?.limit ? Number(result.pagination.limit) : 10
  } catch (error) {
    console.error('Erro ao buscar sessões:', error)
    snackbar.text = error.message || 'Erro ao carregar sessões.'
    snackbar.color = 'error'
    snackbar.show = true
    sessions.value = []
    totalItems.value = 0
  } finally {
    loading.value = false
  }
}
const handleOptionsUpdate = ({ page: newPage, itemsPerPage: newLimit }) => {
  if (newPage !== page.value) page.value = newPage
  if (newLimit !== limit.value) {
    limit.value = newLimit
    page.value = 1
    fetchSessions()
  }
}

const fetchAvailableInventory = async () => {
  createDialog.inventoryLoading = true
  createDialog.inventoryError = null
  availableInventoryItems.value = []

  try {
    // 3. Use o serviço de API
    const data = await apiService.getInventoryItems({ page: 1, limit: 100 })
    const items = data.items || []
    availableInventoryItems.value = items.map((item) => ({
      id: item.id,
      description: `${item.description} (${item.quantity}L)`,
    }))
    if (availableInventoryItems.value.length === 0) {
      createDialog.inventoryError = 'Nenhum item de inventário encontrado para seleção.'
    }
  } catch (error) {
    console.error('Erro ao buscar inventário:', error)
    createDialog.inventoryError =
      error.message || 'Não foi possível carregar os itens de inventário.'
    snackbar.text = createDialog.inventoryError
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    createDialog.inventoryLoading = false
  }
}

// --- *** MODIFIED Dialog Methods *** ---
/**
 * Opens the dialog to create a new session.
 */
const openCreateDialog = () => {
  // Reset dialog state
  createDialog.item = defaultCreateItem()
  createDialog.inventoryUsedItems = [defaultInventoryUsedItem()] // Reset inventory items
  createDialog.dateValue = new Date()
  createDialog.formattedDate = formatDateForDisplay(createDialog.dateValue)
  createDialog.valid = false
  createDialog.loading = false
  createDialog.inventoryError = null // Reset inventory error state
  createDialog.show = true

  // Reset form validation visuals
  if (createForm.value) createForm.value.resetValidation()

  // Fetch inventory items needed for the selection
  fetchAvailableInventory()
}

/**
 * Closes the create session dialog.
 */
const closeCreateDialog = () => {
  createDialog.show = false
}

/**
 * Updates the create dialog's date model and formatted display.
 */
const updateCreateDate = (date) => {
  createDialog.dateValue = date
  createDialog.formattedDate = formatDateForDisplay(date)
  // No need to set item.sessionDate here, we do it during submit
  createDialog.dateMenu = false
}

/**
 * Adds a new, empty row for selecting an inventory item.
 */
const addInventoryItem = () => {
  createDialog.inventoryUsedItems.push(defaultInventoryUsedItem())
}

/**
 * Removes an inventory item row at the specified index.
 * @param {number} index - The index of the row to remove.
 */
const removeInventoryItem = (index) => {
  if (createDialog.inventoryUsedItems.length > 1) {
    // Prevent removing the last row
    createDialog.inventoryUsedItems.splice(index, 1)
  }
}

const submitCreate = async () => {
  const { valid } = await createForm.value.validate()
  if (!valid || createDialog.inventoryLoading || !!createDialog.inventoryError) return

  const validInventoryItems = createDialog.inventoryUsedItems.filter(
    (item) => item.id && item.quantity > 0,
  )
  if (validInventoryItems.length === 0) {
    snackbar.text =
      'Adicione pelo menos um item de inventário válido com quantidade maior que zero.'
    snackbar.color = 'warning'
    snackbar.show = true
    return
  }

  createDialog.loading = true

  const payload = {
    sessionDescription: createDialog.item.sessionDescription,
    masterDriver: createDialog.item.masterDriver,
    masterSupport: createDialog.item.masterSupport,
    explanation: createDialog.item.explanation,
    documentReader: createDialog.item.documentReader,
    sessionDate: formatDateForApi(createDialog.dateValue),
    cupsQuantity: createDialog.item.cupsQuantity,
    inventoryUsed: validInventoryItems.map((item) => ({
      id: item.id,
      quantity: Number(item.quantity),
    })),
    quantityLeft: Number(createDialog.item.quantityLeft),
  }

  try {
    // 4. Use o serviço de API
    await apiService.createSession(payload)

    snackbar.text = 'Sessão criada com sucesso!'
    snackbar.color = 'success'
    snackbar.show = true
    closeCreateDialog()
    fetchSessions()
  } catch (error) {
    console.error('Erro ao criar sessão:', error)
    snackbar.text = error.message || 'Erro ao salvar a sessão.'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    createDialog.loading = false
  }
}
// editItem, deleteItem (Placeholders - No changes needed)
const editItem = (item) => {
  /* ... implementation needed ... */
  snackbar.text = `Editar ${item.description} não implementado.`
  snackbar.color = 'info'
  snackbar.show = true
}
const deleteItem = (item) => {
  deleteDialog.item = item // Store the item
  deleteDialog.show = true // Show the confirmation dialog
  deleteDialog.loading = false // Ensure loading is reset
}
const closeDeleteDialog = () => {
  deleteDialog.show = false
  // It's good practice to clear the item after closing
  setTimeout(() => {
    deleteDialog.item = null
    deleteDialog.loading = false
  }, 300) // Delay clearing slightly for transition
}

const confirmDelete = async () => {
  if (!deleteDialog.item || !deleteDialog.item.id) return

  deleteDialog.loading = true
  const itemId = deleteDialog.item.id

  try {
    // 5. Use o serviço de API
    await apiService.deleteSession(itemId)

    snackbar.text = 'Sessão excluída com sucesso!'
    snackbar.color = 'success'
    snackbar.show = true
    closeDeleteDialog()

    if (sessions.value.length === 1 && page.value > 1) {
      page.value = Math.max(1, page.value - 1)
    }
    fetchSessions()
  } catch (error) {
    console.error('Erro ao excluir sessão:', error)
    snackbar.text = error.message || 'Erro ao excluir a sessão.'
    snackbar.color = 'error'
    snackbar.show = true
  } finally {
    deleteDialog.loading = false
  }
}
// --- Lifecycle Hooks ---
onMounted(() => {
  fetchSessions()
})
</script>

<style scoped>
.v-card-title {
  display: flex;
  align-items: center;
}
.v-text-field,
.v-textarea,
.v-autocomplete {
  max-width: 100%;
}
.v-data-table .v-icon {
  margin: 0 4px;
}
/* Ensure dense rows for inventory items */
.v-row[dense] > .v-col {
  padding-top: 4px;
  padding-bottom: 4px;
}
</style>
