import api from './axios'

export const createInquiry = async (data) => {
    const response = await api.post('/inquiries', data)
    return response.data
}

export const getMyInquiries = async () => {
    const response = await api.get('/inquiries/mine')
    return response.data
}

export const closeInquiry = async (id) => {
    const response = await api.patch(`/inquiries/${id}/close`)
    return response.data
}

export const getAdminInquiries = async (status) => {
    const response = await api.get('/inquiries/admin', {
        params: status ? { status } : {},
    })
    return response.data
}

export const answerInquiry = async (id, answer) => {
    const response = await api.patch(`/inquiries/admin/${id}/answer`, { answer })
    return response.data
}
