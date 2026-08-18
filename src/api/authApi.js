import api from './axios'

export const login = async (data) => {
    const response = await api.post('/auth/login', data)
    return response.data
}
export const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) await api.post('/auth/logout', { refreshToken })
}

export const getMyInfo = async () => {
    const response = await api.get('/auth/me')
    return response.data
}

export const getKakaoLoginUrl = async () => {
    const response = await api.get('/auth/kakao')
    return response.data
}

export const getGoogleLoginUrl = async () => {
    const response = await api.get('/auth/google/login-url')
    return response.data
}

export const getSocialAccounts = async () => {
    const response = await api.get('/auth/social/accounts')
    return response.data
}

export const getKakaoLinkUrl = async () => {
    const response = await api.get('/auth/social/kakao/link-url')
    return response.data
}

export const getGoogleLinkUrl = async () => {
    const response = await api.get('/auth/social/google/link-url')
    return response.data
}
