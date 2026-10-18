import { useEffect, useState } from 'react'
import { applySeller, getMySellerProfile } from '../api/sellerApi'

const initialForm = {
  businessName: '',
  brandName: '',
  businessNumber: '',
  representativeName: '',
  settlementBankCode: '',
  settlementAccountMasked: '',
}

function SellerApplyPage() {
  const [form, setForm] = useState(initialForm)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)

  // 페이지 진입 시 이미 신청한 회원인지 먼저 확인한다.
  // 신청 이력이 있으면 중복 신청 폼 대신 현재 심사 상태를 보여준다.
  useEffect(() => {
    const loadSeller = async () => {
      try {
        const result = await getMySellerProfile()
        setSeller(result)
      } catch (error) {
        // 404는 아직 신청하지 않은 정상 상태다.
        if (error.response?.status !== 404) {
          console.error(error)
        }
      } finally {
        setLoading(false)
      }
    }

    loadSeller()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const result = await applySeller(form)
      setSeller(result)
      alert('판매자 등록 신청이 완료됐어.')
    } catch (error) {
      console.error(error)
      alert('판매자 등록 신청에 실패했어.')
    }
  }

  if (loading) {
    return <p>판매자 정보를 확인하고 있어...</p>
  }

  if (seller) {
    return (
      <div>
        <h1>브랜드 판매자 등록</h1>
        <p>브랜드명: {seller.brandName}</p>
        <p>사업자명: {seller.businessName}</p>
        <p>현재 상태: {seller.status}</p>
        {seller.status === 'PENDING' && <p>관리자 승인 심사 중이야.</p>}
        {seller.status === 'APPROVED' && <p>판매자 등록이 승인됐어.</p>}
        {seller.status === 'REJECTED' && <p>판매자 등록 신청이 반려됐어.</p>}
        {seller.status === 'SUSPENDED' && (
          <p>현재 판매자 활동이 정지된 상태야.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <h1>브랜드 판매자 등록</h1>
      <p>상품을 판매하려면 먼저 판매자 등록 신청이 필요해.</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>사업자명</label>
          <input
            name="businessName"
            value={form.businessName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>브랜드명</label>
          <input
            name="brandName"
            value={form.brandName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>사업자등록번호</label>
          <input
            name="businessNumber"
            value={form.businessNumber}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>대표자명</label>
          <input
            name="representativeName"
            value={form.representativeName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>정산 은행 코드</label>
          <input
            name="settlementBankCode"
            value={form.settlementBankCode}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>정산 계좌</label>
          <input
            name="settlementAccountMasked"
            value={form.settlementAccountMasked}
            onChange={handleChange}
          />
        </div>

        <button type="submit">판매자 등록 신청</button>
      </form>
    </div>
  )
}

export default SellerApplyPage
