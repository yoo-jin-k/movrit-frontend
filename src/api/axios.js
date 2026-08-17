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

    (error) => {
        if (error.response?.status === 401) {
            sessionStorage.removeItem('accessToken')

            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)
