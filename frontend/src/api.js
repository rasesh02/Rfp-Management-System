import axios from 'axios'

const API_URL = 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// RFP APIs
export const rfpAPI = {
  create: (data) => apiClient.post('/v1/rfp', data),
  getAll: (page = 1, limit = 10) => apiClient.get('/v1/rfp', { params: { page, limit } }),
  getById: (id) => apiClient.get(`/v1/rfp/${id}`),
  update: (id, data) => apiClient.put(`/v1/rfp/${id}`, data),
  delete: (id) => apiClient.delete(`/v1/rfp/${id}`),
  send: (id, vendors) => apiClient.post(`/v1/rfp/send/${id}`, { vendors }),
}

// Vendor APIs
export const vendorAPI = {
  create: (data) => apiClient.post('/v1/vendor', data),
  getAll: (page = 1, limit = 10) => apiClient.get('/v1/vendor', { params: { page, limit } }),
  getById: (id) => apiClient.get(`/v1/vendor/${id}`),
  update: (id, data) => apiClient.put(`/v1/vendor/${id}`, data),
  delete: (id) => apiClient.delete(`/v1/vendor/${id}`),
  search: (query) => apiClient.get('/v1/vendor/search', { params: { q: query } }),
}

// Proposal APIs
export const proposalAPI = {
  getById: (id) => apiClient.get(`/v1/proposal/${id}`),
  getByRfp: (rfpId) => apiClient.get(`/v1/proposal/rfp/${rfpId}`),
  getParsed: (rfpId) => apiClient.get(`/v1/proposal/parsed/${rfpId}`),
  getStatus: (rfpId) => apiClient.get(`/v1/proposal/${rfpId}/status`),
  rescore: (id) => apiClient.post(`/v1/proposal/${id}/rescore`),
}

// Comparison APIs
export const comparisonAPI = {
  compare: (rfpId, proposalIds) => apiClient.post('/v1/comparison/compare', { rfpId, proposalIds }),
  evaluate: (rfpId) => apiClient.post('/v1/comparison/evaluate', { rfpId }),
  getById: (id) => apiClient.get(`/v1/comparison/${id}`),
  getByRfp: (rfpId) => apiClient.get(`/v1/comparison/rfp/${rfpId}`),
}

export default apiClient
