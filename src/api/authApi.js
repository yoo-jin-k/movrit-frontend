import api from './axios'

export const login = async (data) => {
    const response = await api.post('/auth/login', data)
    return response.data
}

export const getMyInfo = async () => {
    const response = await api.get('/auth/me')
    return response.data
}

export const getKakaoLoginUrl = async () => {
    const response = await api.get('/auth/kakao')
    return response.data
}
