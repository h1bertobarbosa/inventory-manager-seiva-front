// src/services/apiService.js

import { useAuthStore } from '@/stores/auth'

// 1. Pega a URL base das variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('A variável de ambiente VITE_API_BASE_URL não está definida.')
}

/**
 * Função principal e centralizada para fazer requisições à API.
 * Ela cuida da montagem da URL, dos headers de autenticação e do tratamento de erros.
 * @param {string} endpoint - O endpoint da API (ex: '/session').
 * @param {object} options - Opções da requisição (method, body, etc.), como no 'fetch'.
 * @returns {Promise<any>} - O JSON da resposta.
 * @throws {Error} - Lança um erro formatado em caso de falha na requisição.
 */
async function _request(endpoint, options = {}) {
  const authStore = useAuthStore()
  const token = authStore.token

  // 2. Configura os headers padrões
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Adiciona o header de autorização se o token existir
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // 3. Monta a requisição
  const config = {
    ...options,
    headers,
  }

  // 4. Executa o fetch e trata a resposta
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    // Tenta extrair uma mensagem de erro do corpo da resposta da API
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.message || `Erro ${response.status}: A requisição falhou.`
    throw new Error(errorMessage)
  }

  // Se a resposta for 204 No Content (comum em DELETE), não há corpo para parsear
  if (response.status === 204) {
    return null
  }

  return response.json()
}

// 5. Exporta um objeto com métodos específicos para cada endpoint
export const apiService = {
  /**
   * Busca a lista de sessões com paginação e filtro.
   * @param {{ page: number, limit: number, search?: string }} params - Parâmetros de busca.
   */
  getSessions: (params) => {
    const query = new URLSearchParams(params).toString()
    return _request(`/session?${query}`, { method: 'GET' })
  },

  /**
   * Cria uma nova sessão.
   * @param {object} payload - Os dados da nova sessão.
   */
  createSession: (payload) => {
    return _request('/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Exclui uma sessão pelo seu ID.
   * @param {string} sessionId - O ID da sessão a ser excluída.
   */
  deleteSession: (sessionId) => {
    return _request(`/session/${sessionId}`, { method: 'DELETE' })
  },

  /**
   * Busca a lista de itens do inventário.
   * @param {{ page: number, limit: number }} params - Parâmetros de busca.
   */
  getInventoryItems: (params) => {
    const query = new URLSearchParams(params).toString()
    return _request(`/inventory?${query}`, { method: 'GET' })
  },

  /**
   * Busca a lista de itens do inventário com paginação e filtros.
   * @param {object} params - Parâmetros como page, limit, filter.
   */
  getInventory: (params) => {
    // Limpa parâmetros vazios para não poluir a URL
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v != null && v !== ''),
    )
    const query = new URLSearchParams(cleanParams).toString()
    return _request(`/inventory?${query}`, { method: 'GET' })
  },

  /**
   * Cria um novo item de inventário.
   * @param {object} payload - Os dados do novo item.
   */
  createInventoryItem: (payload) => {
    return _request('/inventory', { method: 'POST', body: JSON.stringify(payload) })
  },

  /**
   * Deleta um item de inventário.
   * @param {string} itemId - O ID do item.
   */
  deleteInventoryItem: (itemId) => {
    return _request(`/inventory/${itemId}`, { method: 'DELETE' })
  },

  /**
   * Adiciona estoque a um item (entrada).
   * @param {string} itemId - O ID do item.
   * @param {object} payload - Dados como quantity, obs, etc.
   */
  addStock: (itemId, payload) => {
    return _request(`/inventory/${itemId}/input`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Remove estoque de um item (saída).
   * @param {string} itemId - O ID do item.
   * @param {object} payload - Dados como quantity, obs, etc.
   */
  removeStock: (itemId, payload) => {
    return _request(`/inventory/${itemId}/output`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },
  /**
   * Realiza o login do usuário.
   * Como é uma rota pública, não usamos o helper _request que injeta o token.
   * @param {{ email, password }} credentials - As credenciais do usuário.
   * @returns {Promise<any>} - A resposta da API com o token de acesso.
   */
  signin: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Credenciais inválidas')
    }

    return response.json()
  },

  /**
   * NOVO: Realiza o cadastro de um novo usuário e empresa.
   * @param {object} signupData - Os dados do formulário de cadastro.
   * @returns {Promise<any>} - A resposta da API.
   */
  signup: async (signupData) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro ao realizar cadastro')
    }

    return response.json()
  },

  /**
   * Busca a lista de usuários com paginação e filtro.
   * @param {object} params - Parâmetros como page, limit, search.
   */
  getUsers: (params) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== ''),
    )
    return _request(`/users?${new URLSearchParams(cleanParams)}`, { method: 'GET' })
  },

  /**
   * Cria um novo usuário.
   * @param {object} payload - Dados do usuário { name, email, password }.
   */
  createUser: (payload) => {
    return _request('/users', { method: 'POST', body: JSON.stringify(payload) })
  },

  /**
   * Atualiza um usuário existente.
   * @param {string} userId - O ID do usuário.
   * @param {object} payload - Dados a serem atualizados { name, email, password? }.
   */
  updateUser: (userId, payload) => {
    return _request(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) })
  },

  /**
   * Exclui um usuário.
   * @param {string} userId - O ID do usuário.
   */
  deleteUser: (userId) => {
    return _request(`/users/${userId}`, { method: 'DELETE' })
  },
}
