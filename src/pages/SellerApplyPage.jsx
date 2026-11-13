/**
 * 업체(브랜드 판매자) 신청 화면입니다(/seller/apply, 로그인 회원).
 * - 사용하는 API: GET /api/sellers/me(신청 이력·심사 상태, 404는 미신청), POST /api/sellers/apply(신청).
 * - 신청 이력이 있으면 폼 대신 심사 상태를 보여주고, 신청 결과를 받으면 같은 화면에서 상태 표시로 전환합니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - 여백·폭 없이 화면 왼쪽 끝에 제목·입력칸이 붙고, 상태가 APPROVED 같은 영문 코드로 표시됨
 *   → 가운데 카드 배치, 입력칸마다 레이블·도움말, 상태는 한글 문구와 다음 할 일(업체 화면 이동 등)로 표시.
 * - 404가 아닌 조회 실패도 신청 폼으로 보여 이미 신청한 회원이 중복 신청할 수 있었음 → 실패 안내와 다시 시도 버튼.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applySeller, getMySellerProfile } from '../api/sellerApi'
import {
  sellerStatusGuide,
  sellerStatusLabel,
} from '../features/business/sellerEntryModel'
import './sellerEntry.css'

const initialForm = {
  businessName: '',
  brandName: '',
  businessNumber: '',
  representativeName: '',
  settlementBankCode: '',
  settlementAccountMasked: '',
}

const fields = [
  [
    'businessName',
    '상호(사업자명)',
    true,
    '사업자등록증에 적힌 상호를 입력해 주세요.',
  ],
  [
    'brandName',
    '대표 브랜드명',
    true,
    '참여자에게 보이는 업체 이름입니다. 승인 후 브랜드를 더 등록할 수 있습니다.',
  ],
  ['businessNumber', '사업자등록번호', true, '예: 123-45-67890'],
  ['representativeName', '대표자명', true, ''],
  ['settlementBankCode', '정산 은행 (선택)', false, '예: 국민, 신한'],
  ['settlementAccountMasked', '정산 계좌 (선택)', false, ''],
]

function SellerApplyPage() {
  const [form, setForm] = useState(initialForm)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // 페이지 진입 시 이미 신청한 회원인지 먼저 확인합니다.
  // 신청 이력이 있으면 중복 신청 폼 대신 현재 심사 상태를 보여줍니다.
  useEffect(() => {
    let active = true
    getMySellerProfile()
      .then((result) => {
        if (active) setSeller(result)
      })
      .catch((error) => {
        // 404는 아직 신청하지 않은 정상 상태입니다.
        if (active && error.response?.status !== 404)
          setLoadError(
            '업체 신청 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [attempt])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await applySeller(form)
      setSeller(result)
    } catch (error) {
      console.error(error)
      setSubmitError(
        error.response?.data?.detail ||
          '업체 신청을 접수하지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해 주세요.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  let body
  if (loading) {
    body = <p role="status">업체 신청 상태를 확인하고 있습니다.</p>
  } else if (loadError) {
    body = (
      <div role="alert" className="seller-entry-status">
        <p>{loadError}</p>
        <button
          type="button"
          className="common-button"
          onClick={() => {
            setLoadError('')
            setLoading(true)
            setAttempt((value) => value + 1)
          }}
        >
          다시 확인
        </button>
      </div>
    )
  } else if (seller) {
    body = (
      <div className="seller-entry-status">
        <span
          className={`seller-entry-badge is-${String(seller.status).toLowerCase()}`}
        >
          {sellerStatusLabel(seller.status)}
        </span>
        <p>{sellerStatusGuide(seller.status)}</p>
        <dl>
          <div>
            <dt>상호</dt>
            <dd>{seller.businessName}</dd>
          </div>
          <div>
            <dt>대표 브랜드명</dt>
            <dd>{seller.brandName}</dd>
          </div>
          <div>
            <dt>대표자</dt>
            <dd>{seller.representativeName}</dd>
          </div>
        </dl>
        <div className="seller-entry-actions">
          {seller.status === 'APPROVED' ? (
            <>
              <Link
                className="seller-entry-button is-primary"
                to="/seller/dashboard"
              >
                업체 화면으로 이동
              </Link>
              <Link className="seller-entry-button" to="/seller/brands">
                브랜드 관리
              </Link>
            </>
          ) : (
            <Link className="seller-entry-button" to="/support">
              고객센터 문의
            </Link>
          )}
        </div>
      </div>
    )
  } else {
    body = (
      <form className="seller-entry-form" onSubmit={handleSubmit}>
        <p>
          업체로 승인되면 캠페인을 열고 참여자를 선정할 수 있습니다. 운영자가
          사업자 정보를 확인한 뒤 승인합니다.
        </p>
        {/* UI점검: 브랜드 판매자 등록 - 화면 이상함 (정산 계좌를 원문으로 받을지 마스킹 값으로 받을지 정책 확인 필요) */}
        {fields.map(([name, label, required, hint]) => (
          <label key={name} className="seller-entry-field">
            {label}
            <input
              name={name}
              value={form[name]}
              onChange={handleChange}
              required={required}
              maxLength={100}
              aria-describedby={hint ? `${name}-hint` : undefined}
            />
            {hint && <small id={`${name}-hint`}>{hint}</small>}
          </label>
        ))}
        {submitError && <p role="alert">{submitError}</p>}
        <button
          className="seller-entry-button is-primary"
          type="submit"
          disabled={submitting}
        >
          {submitting ? '신청하는 중...' : '업체 신청하기'}
        </button>
      </form>
    )
  }

  return (
    <main className="seller-entry-page">
      <section className="seller-entry-card">
        <h1>업체(브랜드 판매자) 신청</h1>
        {body}
      </section>
    </main>
  )
}

export default SellerApplyPage
