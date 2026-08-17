import { useEffect, useState } from 'react'
import { approveSeller, getPendingSellers, rejectSeller } from '../api/adminSellerApi'

function AdminSellerPage() {
    const [sellers, setSellers] = useState([])
    const [loading, setLoading] = useState(true)

    const loadPending = async () => {
        try {
            setLoading(true)
            const result = await getPendingSellers()
            setSellers(result)
        } catch (error) {
            console.error(error)

            if (error.response?.status === 403) {
                alert('관리자만 접근할 수 있어.')
            } else {
                alert('판매자 신청 목록을 불러오지 못했어.')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPending()
    }, [])

    const handleApprove = async (sellerId) => {
        try {
            await approveSeller(sellerId)
            // 처리된 신청은 PENDING 목록에서 제외되므로 목록을 다시 조회한다.
            await loadPending()
        } catch (error) {
            console.error(error)
            alert('승인 처리에 실패했어.')
        }
    }

    const handleReject = async (sellerId) => {
        try {
            await rejectSeller(sellerId)
            await loadPending()
        } catch (error) {
            console.error(error)
            alert('반려 처리에 실패했어.')
        }
    }

    if (loading) {
        return <p>판매자 신청 목록을 불러오는 중...</p>
    }

    return (
        <div>
            <h1>판매자 등록 심사</h1>

            {sellers.length === 0 ? (
                <p>현재 심사 대기 중인 신청이 없어.</p>
            ) : (
                sellers.map((seller) => (
                    <div key={seller.id}>
                        <h2>{seller.brandName}</h2>
                        <p>사업자명: {seller.businessName}</p>
                        <p>사업자등록번호: {seller.businessNumber}</p>
                        <p>대표자명: {seller.representativeName}</p>
                        <p>상태: {seller.status}</p>

                        <button onClick={() => handleApprove(seller.id)}>
                            승인
                        </button>
                        <button onClick={() => handleReject(seller.id)}>
                            반려
                        </button>
                        <hr />
                    </div>
                ))
            )}
        </div>
    )
}

export default AdminSellerPage
