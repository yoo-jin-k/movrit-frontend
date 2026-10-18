import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('accessToken')

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

export default api

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config
    const refreshToken = localStorage.getItem('refreshToken')
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !original?._retry &&
      !original?.url?.includes('/auth/refresh')
    ) {
      original._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        sessionStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        localStorage.removeItem('refreshToken')
      }
    }
    if (error.response?.status === 401) {
      sessionStorage.removeItem('accessToken')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
