/**
 * 주문·프로필·배송지·결제수단·설정의 디자인 예시 화면을 제공합니다.
 * 미리보기 배열과 고정 내용을 사용하며 결제 화면의 이동 버튼은 주문 생성이나 결제 승인 요청이 아닙니다.
 */
import { Link, useNavigate, useParams } from 'react-router-dom'
import MemberProfilePage from '../features/membership/MemberProfilePage'
import BuyerLayout, {
  BuyerButton,
  BuyerCard,
  BuyerToggle,
} from '../components/buyer/BuyerLayout'
import {
  buyerAddresses,
  buyerOrders,
  paymentMethods,
} from '../preview/buyerV2Preview'

// 현재 버튼은 주문 완료 예시 경로로 이동합니다. 결제 API 호출이나 실제 주문 저장은 수행하지 않습니다.
export function BuyerCheckoutPage() {
  const navigate = useNavigate()
  return (
    <BuyerLayout title="주문/결제" className="buyer-checkout">
      <div className="buyer-checkout__grid">
        <BuyerCard className="buyer-checkout__form">
          <h2>배송 정보</h2>
          <div className="buyer-form-grid">
            <label>
              받는 사람
              <input defaultValue="김유진" />
            </label>
            <label>
              연락처
              <input defaultValue="010-0000-0000" />
            </label>
            <label className="is-wide">
              주소
              <input defaultValue="경기도 화성시 동탄대로 00" />
            </label>
          </div>
          <h2>결제수단</h2>
          <div className="buyer-chip-row">
            <button className="is-active">카드</button>
            <button>간편결제</button>
          </div>
          <h2>주문 상품</h2>
          <div className="buyer-product-row">
            <span className="buyer-product-row__image" />
            <div>
              <strong>Glow Serum 02</strong>
              <small>수량 1 · ₩29,000</small>
            </div>
          </div>
        </BuyerCard>
        <BuyerCard className="buyer-checkout__summary" title="결제 요약">
          <dl>
            <div>
              <dt>상품 금액</dt>
              <dd>₩29,000</dd>
            </div>
            <div>
              <dt>배송비</dt>
              <dd>무료</dd>
            </div>
            <div className="is-total">
              <dt>최종 결제 예정 금액</dt>
              <dd>₩29,000</dd>
            </div>
          </dl>
          <p>목표 달성 시 실제 결제가 진행됩니다.</p>
          <BuyerButton
            variant="primary"
            onClick={() => navigate('/orders/complete')}
          >
            프리오더 참여
          </BuyerButton>
        </BuyerCard>
      </div>
    </BuyerLayout>
  )
}

export function BuyerOrderCompletePage() {
  return (
    <BuyerLayout title="주문 완료">
      <BuyerCard className="buyer-complete">
        <span className="buyer-complete__check">✓</span>
        <h2>프리오더 참여가 완료됐어</h2>
        <p>목표 달성 여부와 결제 상태를 알림으로 알려줄게.</p>
        <small>주문번호 MR-20260816-00421</small>
        <div>
          <Link
            className="buyer-v2-button buyer-v2-button--primary"
            to="/orders/1"
          >
            주문 상세 보기
          </Link>
          <Link
            className="buyer-v2-button buyer-v2-button--secondary"
            to="/home"
          >
            계속 둘러보기
          </Link>
        </div>
      </BuyerCard>
    </BuyerLayout>
  )
}

export function BuyerOrderDetailPage() {
  const { orderId } = useParams()
  const order =
    buyerOrders.find((x) => String(x.id) === orderId) || buyerOrders[0]
  const steps = ['참여 완료', '목표 달성', '결제', '배송', '구매확정']
  return (
    <BuyerLayout title="주문 상세">
      <BuyerCard className="buyer-order-hero">
        <div>
          <strong>{order.status}</strong>
          <p>현재 달성률 78% · 마감까지 2일</p>
        </div>
        <BuyerButton>배송지 변경</BuyerButton>
      </BuyerCard>
      <BuyerCard title="진행 상태">
        <ol className="buyer-order-steps">
          {steps.map((s, i) => (
            <li key={s} className={i <= order.step ? 'is-active' : ''}>
              <i />
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </BuyerCard>
      <BuyerCard title="주문 정보">
        <dl className="buyer-detail-list">
          <div>
            <dt>주문번호</dt>
            <dd>{order.number}</dd>
          </div>
          <div>
            <dt>상품</dt>
            <dd>{order.title} × 1</dd>
          </div>
          <div>
            <dt>결제예정금액</dt>
            <dd>{order.amount}</dd>
          </div>
          <div>
            <dt>배송지</dt>
            <dd>{order.address}</dd>
          </div>
        </dl>
      </BuyerCard>
    </BuyerLayout>
  )
}

// 기존 프로필 경로를 서버 회원 닉네임 설정 화면으로 연결합니다.
export function BuyerProfileEditPage() {
  return <MemberProfilePage />
}

export function BuyerAddressesPage() {
  return (
    <BuyerLayout title="배송지 관리">
      <div className="buyer-stack">
        {buyerAddresses.map((a) => (
          <BuyerCard key={a.id} className="buyer-manage-row">
            <div>
              <strong>{a.name}</strong>
              {a.primary && <em>기본</em>}
              <p>
                {a.receiver} · {a.phone}
                <br />
                {a.address}
              </p>
            </div>
            <div>
              <BuyerButton>수정</BuyerButton>
              {!a.primary && (
                <button className="buyer-text-danger">삭제</button>
              )}
            </div>
          </BuyerCard>
        ))}
        <BuyerButton variant="primary">+ 배송지 추가</BuyerButton>
      </div>
    </BuyerLayout>
  )
}
export function BuyerPaymentsPage() {
  return (
    <BuyerLayout title="결제수단 관리">
      <div className="buyer-stack">
        {paymentMethods.map((p) => (
          <BuyerCard key={p.id} className="buyer-manage-row">
            <div>
              <strong>
                {p.name} {p.detail}
              </strong>
              <p>{p.primary ? '기본 결제수단' : p.detail}</p>
            </div>
            <BuyerButton>{p.primary ? '기본' : '기본으로'}</BuyerButton>
          </BuyerCard>
        ))}
        <BuyerButton variant="primary">+ 결제수단 추가</BuyerButton>
      </div>
    </BuyerLayout>
  )
}
export function BuyerNotificationSettingsPage() {
  return (
    <BuyerLayout title="알림 설정">
      <div className="buyer-settings-list">
        <BuyerToggle label="프리오더 마감 알림" note="필수/서비스 알림" />
        <BuyerToggle label="목표 달성/실패 알림" note="필수/서비스 알림" />
        <BuyerToggle label="결제 완료 알림" note="필수/서비스 알림" />
        <BuyerToggle label="배송 상태 알림" note="필수/서비스 알림" />
        <BuyerToggle label="신규 프리오더 알림" note="선택 동의" />
        <BuyerToggle
          label="마케팅/혜택 알림"
          note="선택 동의"
          defaultChecked={false}
        />
      </div>
    </BuyerLayout>
  )
}

export function BuyerPreorderStatePage() {
  const { state } = useParams()
  const config =
    {
      failed: {
        title: '프리오더 상세',
        status: '모집 실패',
        tone: 'danger',
        meta: '61% 달성 · 872명 참여 (목표 미달)',
        heading: '취소 안내',
        lines: [
          '목표 수량 미달로 프리오더가 취소됐어요',
          '결제 예정 금액은 청구되지 않아요',
          '비슷한 상품은 홈에서 다시 찾아볼 수 있어요',
        ],
        button: '비슷한 프리오더 보기',
      },
      shipping: {
        title: '주문 상세',
        status: '배송중',
        tone: 'primary',
        meta: '배송 조회 가능 · 9/14 도착 예정',
        heading: '배송 안내',
        lines: [
          '송장번호로 실시간 배송 조회가 가능해요',
          '배송 중에는 주소 변경이 어려워요',
          '문제가 있으면 고객센터로 문의해줘',
        ],
        button: '배송 조회하기',
      },
      completed: {
        title: '주문 상세',
        status: '구매 완료',
        tone: 'success',
        meta: '구매 확정 · 리뷰 작성 시 500P 적립',
        heading: '완료 안내',
        lines: [
          '배송이 완료되어 구매가 확정됐어요',
          '리뷰를 남기면 적립금을 드려요',
          '교환/환불은 마이페이지에서 신청해줘',
        ],
        button: '리뷰 작성하기',
      },
    }[state] || null
  if (!config)
    return (
      <BuyerLayout title="상태를 찾을 수 없어">
        <Link to="/home">홈으로</Link>
      </BuyerLayout>
    )
  return (
    <BuyerLayout title={config.title}>
      <div className="buyer-state">
        <div className="buyer-state__image" />
        <section>
          <h2>Glow Serum 02</h2>
          <p>LUMENA × @muse.j</p>
          <b>₩29,000</b>
          <div className="buyer-state__status">
            <span className={`is-${config.tone}`}>{config.status}</span>
            <small>{config.meta}</small>
          </div>
          <div className="buyer-state__progress">
            <i />
          </div>
          <BuyerCard title={config.heading}>
            <ul>
              {config.lines.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </BuyerCard>
          <BuyerButton variant="primary">{config.button}</BuyerButton>
        </section>
      </div>
    </BuyerLayout>
  )
}
