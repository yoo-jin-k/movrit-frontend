import { useEffect, useState } from 'react'
import { approveSeller, getAllSellers, rejectSeller } from '../api/adminSellerApi'

function AdminSellerPage() {
    const [sellers, setSellers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    const loadSellers = async () => {
        try {
            setLoading(true)
            const result = await getAllSellers()
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
        loadSellers()
    }, [])

    const handleApprove = async (sellerId) => {
        try {
            await approveSeller(sellerId)
            // 승인 후에도 처리 이력을 확인할 수 있도록 전체 목록을 다시 조회한다.
            await loadSellers()
        } catch (error) {
            console.error(error)
            alert('승인 처리에 실패했어.')
        }
    }

    const handleReject = async (sellerId) => {
        try {
            await rejectSeller(sellerId)
            await loadSellers()
        } catch (error) {
            console.error(error)
            alert('반려 처리에 실패했어.')
        }
    }

    const filteredSellers = filter === 'ALL'
        ? sellers
        : sellers.filter((seller) => seller.status === filter)

    if (loading) {
        return <p>판매자 신청 목록을 불러오는 중...</p>
    }

    return (
        <div>
            <h1>판매자 등록 심사</h1>

            <div>
                <button onClick={() => setFilter('ALL')}>전체</button>
                <button onClick={() => setFilter('PENDING')}>심사 중</button>
                <button onClick={() => setFilter('APPROVED')}>승인</button>
                <button onClick={() => setFilter('REJECTED')}>반려</button>
            </div>

            {filteredSellers.length === 0 ? (
                <p>해당 상태의 신청이 없어.</p>
            ) : (
                filteredSellers.map((seller) => (
                    <div key={seller.id}>
                        <h2>{seller.brandName}</h2>
                        <p>회원 ID: {seller.memberId}</p>
                        <p>사업자명: {seller.businessName}</p>
                        <p>사업자등록번호: {seller.businessNumber}</p>
                        <p>대표자명: {seller.representativeName}</p>
                        <p>상태: {seller.status}</p>

                        {seller.status === 'PENDING' && (
                            <div>
                                <button onClick={() => handleApprove(seller.id)}>
                                    승인
                                </button>
                                <button onClick={() => handleReject(seller.id)}>
                                    반려
                                </button>
                            </div>
                        )}

                        <hr />
                    </div>
                ))
            )}
        </div>
    )
}

export default AdminSellerPage
