import api from './axios'

// 로그인한 회원의 판매자 등록 신청을 서버에 전달한다.
// memberId는 JWT에서 서버가 직접 확인하므로 프론트에서 보내지 않는다.
export const applySeller = async (data) => {
    const response = await api.post('/sellers/apply', data)
    return response.data
}

// 현재 로그인한 회원의 판매자 등록/심사 상태를 조회한다.
export const getMySellerProfile = async () => {
    const response = await api.get('/sellers/me')
    return response.data
}

export const getSellerDashboard = async () => (await api.get('/sellers/dashboard')).data
