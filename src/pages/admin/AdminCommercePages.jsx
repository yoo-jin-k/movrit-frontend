/**
 * 운영자 프리오더·주문/환불·협업·정산 화면입니다(실제 데이터).
 *
 * - 프리오더(/admin/preorders): GET /api/admin/preorders(/{id}) — 판매 조건, 주문 수, 결제·환불 금액, 정산 상태
 * - 주문/환불(/admin/refunds): GET /api/admin/orders(/{id}) — 결제·배송 상태, 상품, 받는 사람(연락처 가림)
 * - 협업(/admin/collaborations): GET /api/admin/collaborations — 추천 링크 클릭·주문 수
 * - 정산(/admin/settlements): GET /api/settlements — 정산 생성·확정·지급 완료·취소(기존 정산 API)
 *
 * 프리오더·주문은 조회만 합니다. 프리오더 신규 기능 확장은 보류 상태라 운영자 승인·환불 처리 버튼은 두지 않습니다.
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { actOnAdminSettlement, createAdminSettlement } from '../../api/adminApi'
import AdminLayout, {
  AdminButton,
  AdminCard,
} from '../../components/admin/AdminLayout'
import {
  AdminDataTable,
  BackLink,
  DefinitionList,
  DetailHeader,
  ResourceGate,
  SearchFilters,
  StatusBadge,
} from '../../features/admin/AdminConsoleViews'
import {
  dateOnly,
  dateTime,
  filterRows,
  money,
  statusLabel,
} from '../../features/admin/adminConsoleModel'
import useAdminResource from '../../features/admin/useAdminResource'

// ───────── 프리오더 ─────────

const PREORDER_CHIPS = [
  ['', '전체'],
  ['OPEN', '판매 중'],
  ['SCHEDULED', '판매 예약'],
  ['SUCCESS', '성공'],
  ['FAILED', '실패'],
  ['COMPLETED', '완료'],
]

export function AdminPreordersPage() {
  const state = useAdminResource('/admin/preorders', [])
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState('')
  const rows = filterRows(state.data || [], {
    search,
    searchKeys: ['title', 'brandName', 'productName'],
    chip,
    chipKey: 'status',
  })
  return (
    <AdminLayout title="프리오더 현황">
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="프리오더, 브랜드, 상품 검색"
        chips={PREORDER_CHIPS}
        chip={chip}
        onChip={setChip}
        onReload={state.reload}
      />
      <ResourceGate state={state}>
        <AdminDataTable
          title="프리오더 목록"
          rows={rows}
          rowLink={(row) => `/admin/preorders/${row.id}`}
          columns={[
            { key: 'title', label: '프리오더' },
            { key: 'brandName', label: '브랜드' },
            {
              key: 'price',
              label: '가격',
              render: (r) => money(r.preorderPrice, r.currency),
            },
            {
              key: 'progress',
              label: '주문/목표',
              render: (r) => `${r.orderedQuantity} / ${r.targetQuantity}`,
            },
            {
              key: 'period',
              label: '판매 기간',
              render: (r) => `${dateOnly(r.startAt)} ~ ${dateOnly(r.endAt)}`,
            },
            {
              key: 'status',
              label: '상태',
              render: (r) => <StatusBadge code={r.status} />,
            },
          ]}
        />
      </ResourceGate>
    </AdminLayout>
  )
}

export function AdminPreorderDetailPage() {
  const { id } = useParams()
  const state = useAdminResource(`/admin/preorders/${id}`)
  const d = state.data
  return (
    <AdminLayout title="프리오더 상세">
      <ResourceGate state={state}>
        {d && (
          <>
            <DetailHeader
              name={d.preorder.title}
              sub={`${d.preorder.brandName} · ${d.preorder.productName}`}
              status={d.preorder.status}
            />
            <div className="admin-detail-grid">
              <DefinitionList
                title="판매 조건"
                items={[
                  [
                    '프리오더 가격',
                    money(d.preorder.preorderPrice, d.preorder.currency),
                  ],
                  [
                    '목표 / 최대 수량',
                    `${d.preorder.targetQuantity} / ${d.maxQuantity ?? '제한 없음'}`,
                  ],
                  ['주문 수량', `${d.preorder.orderedQuantity}개`],
                  [
                    '1회 최소 / 회원별 최대',
                    `${d.minOrderQuantity} / ${d.maxOrderQuantityPerMember ?? '제한 없음'}`,
                  ],
                  [
                    '판매 기간',
                    `${dateTime(d.preorder.startAt)} ~ ${dateTime(d.preorder.endAt)}`,
                  ],
                  [
                    '생산 / 배송 예정',
                    `${dateOnly(d.productionExpectedAt)} / ${dateOnly(d.shippingExpectedAt)}`,
                  ],
                  ['취소 사유', d.cancellationReason],
                ]}
              />
              <DefinitionList
                title="주문·결제"
                items={[
                  ['주문', `${d.orderCount}건`],
                  ['결제 완료 금액', money(d.paidAmount, d.preorder.currency)],
                  ['환불 금액', money(d.refundedAmount, d.preorder.currency)],
                  [
                    '정산',
                    d.settlementStatus
                      ? statusLabel(d.settlementStatus)
                      : '정산 전',
                  ],
                  ['설명', d.description],
                ]}
              />
            </div>
          </>
        )}
      </ResourceGate>
      <BackLink to="/admin/preorders" />
    </AdminLayout>
  )
}

// ───────── 주문/환불 ─────────

const ORDER_CHIPS = [
  ['', '전체'],
  ['PENDING_PAYMENT', '결제 대기'],
  ['PAID', '결제 완료'],
  ['SHIPPED', '발송'],
  ['REFUNDED', '환불'],
  ['CANCELLED', '취소'],
]

export function AdminRefundsPage() {
  const state = useAdminResource('/admin/orders', [])
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState('')
  const rows = filterRows(state.data || [], {
    search,
    searchKeys: ['orderNumber', 'buyerName', 'preorderTitle'],
    chip,
    chipKey: 'status',
  })
  return (
    <AdminLayout title="주문 / 환불">
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="주문번호, 구매자, 프리오더 검색"
        chips={ORDER_CHIPS}
        chip={chip}
        onChip={setChip}
        onReload={state.reload}
      />
      <ResourceGate state={state}>
        <AdminDataTable
          title="주문 목록"
          rows={rows}
          rowLink={(row) => `/admin/refunds/${row.id}`}
          columns={[
            { key: 'orderNumber', label: '주문번호' },
            { key: 'buyerName', label: '구매자' },
            { key: 'preorderTitle', label: '프리오더' },
            {
              key: 'amount',
              label: '결제 금액',
              render: (r) => money(r.totalPaymentAmount, r.currency),
            },
            {
              key: 'paymentStatus',
              label: '결제',
              render: (r) => statusLabel(r.paymentStatus),
            },
            {
              key: 'createdAt',
              label: '주문일',
              render: (r) => dateOnly(r.createdAt),
            },
            {
              key: 'status',
              label: '주문 상태',
              render: (r) => <StatusBadge code={r.status} />,
            },
          ]}
        />
      </ResourceGate>
    </AdminLayout>
  )
}

export function AdminRefundDetailPage() {
  const { id } = useParams()
  const state = useAdminResource(`/admin/orders/${id}`)
  const d = state.data
  return (
    <AdminLayout title="주문 상세">
      <ResourceGate state={state}>
        {d && (
          <>
            <DetailHeader
              name={d.order.orderNumber}
              sub={`${d.order.buyerName} · ${d.order.preorderTitle}`}
              status={d.order.status}
            />
            <div className="admin-detail-grid">
              <DefinitionList
                title="결제·환불"
                items={[
                  [
                    '결제 금액',
                    money(d.order.totalPaymentAmount, d.order.currency),
                  ],
                  ['결제 상태', statusLabel(d.order.paymentStatus)],
                  ['결제 수단', d.paymentMethod],
                  ['결제 시각', dateTime(d.paidAt)],
                  ['취소·환불 시각', dateTime(d.cancelledAt)],
                  ['결제 실패 사유', d.failureMessage],
                ]}
              />
              <DefinitionList
                title="받는 사람·배송"
                items={[
                  ['받는 사람', d.receiverName],
                  ['연락처', d.receiverPhoneMasked],
                  ['주소', d.address],
                  ['배송 상태', statusLabel(d.order.shippingStatus)],
                  [
                    '택배사 / 운송장',
                    [d.courierCode, d.trackingNumber].filter(Boolean).join(' '),
                  ],
                  [
                    '발송 / 도착',
                    `${dateTime(d.shippedAt)} / ${dateTime(d.deliveredAt)}`,
                  ],
                ]}
              />
            </div>
            <AdminCard title="주문 상품">
              <ul className="admin-activity">
                {d.items.map((item, index) => (
                  <li key={index}>
                    <strong>{item.productName}</strong> ({item.optionName}) ·{' '}
                    {money(item.unitPrice, d.order.currency)} × {item.quantity}{' '}
                    = {money(item.totalPrice, d.order.currency)}
                  </li>
                ))}
              </ul>
            </AdminCard>
          </>
        )}
      </ResourceGate>
      <BackLink to="/admin/refunds" />
    </AdminLayout>
  )
}

// ───────── 협업 ─────────

export function AdminCollaborationsPage() {
  const state = useAdminResource('/admin/collaborations', [])
  const [search, setSearch] = useState('')
  const rows = filterRows(state.data || [], {
    search,
    searchKeys: [
      'preorderTitle',
      'brandName',
      'creatorNickname',
      'referralCode',
    ],
  })
  return (
    <AdminLayout title="협업 / 추천 링크">
      <p className="admin-muted">
        크리에이터가 프리오더를 소개하는 협업과 추천 링크 성과입니다. 캠페인
        체험단 신청은 '캠페인 참여자' 화면에서 관리합니다.
      </p>
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="프리오더, 브랜드, 크리에이터, 추천 코드 검색"
        onReload={state.reload}
      />
      <ResourceGate state={state}>
        <AdminDataTable
          title="협업 목록"
          rows={rows}
          columns={[
            { key: 'preorderTitle', label: '프리오더' },
            { key: 'brandName', label: '브랜드' },
            { key: 'creatorNickname', label: '크리에이터' },
            { key: 'referralCode', label: '추천 코드' },
            {
              key: 'clickCount',
              label: '클릭',
              render: (r) => `${r.clickCount}회`,
            },
            {
              key: 'orderCount',
              label: '주문',
              render: (r) => `${r.orderCount}건`,
            },
            {
              key: 'createdAt',
              label: '시작일',
              render: (r) => dateOnly(r.createdAt),
            },
            {
              key: 'status',
              label: '상태',
              render: (r) => <StatusBadge code={r.status} />,
            },
          ]}
        />
      </ResourceGate>
    </AdminLayout>
  )
}

// ───────── 정산 ─────────

// 정산 상태별로 다음에 할 수 있는 처리입니다.
const SETTLEMENT_ACTIONS = {
  PENDING: [
    ['confirm', '확정', 'primary'],
    ['cancel', '취소', 'danger'],
  ],
  CONFIRMED: [
    ['pay', '지급 완료', 'primary'],
    ['cancel', '취소', 'danger'],
  ],
}

export function AdminSettlementsPage() {
  const state = useAdminResource('/settlements', [])
  const preorders = useAdminResource('/admin/preorders', [])
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ preorderId: '', platformFeeRate: '10' })
  const titleOf = (preorderId) =>
    (preorders.data || []).find((p) => p.id === preorderId)?.title ||
    `프리오더 #${preorderId}`
  // 정산 대상: 완료된 프리오더 중 아직 정산이 없는 것
  const settledIds = new Set((state.data || []).map((s) => s.preorderId))
  const candidates = (preorders.data || []).filter(
    (p) => p.status === 'COMPLETED' && !settledIds.has(p.id),
  )
  // 확정·지급·취소를 요청하고 목록을 새로 불러옵니다.
  const act = async (settlement, action, label) => {
    setBusyId(settlement.id)
    setMessage('')
    try {
      await actOnAdminSettlement(settlement.id, action)
      setMessage(`${settlement.settlementNumber}: ${label} 처리했습니다.`)
      state.reload()
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          '처리하지 못했습니다. 다시 시도해 주세요.',
      )
    } finally {
      setBusyId(null)
    }
  }
  // 완료된 프리오더의 정산을 만듭니다(수수료율 0~100%).
  const create = async (event) => {
    event.preventDefault()
    const rate = Number(form.platformFeeRate)
    if (!form.preorderId || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      setMessage('정산할 프리오더와 0~100 사이의 수수료율을 입력해 주세요.')
      return
    }
    setBusyId('create')
    setMessage('')
    try {
      await createAdminSettlement(Number(form.preorderId), rate)
      setMessage('정산을 만들었습니다.')
      setForm({ preorderId: '', platformFeeRate: form.platformFeeRate })
      state.reload()
    } catch (error) {
      setMessage(error.response?.data?.detail || '정산을 만들지 못했습니다.')
    } finally {
      setBusyId(null)
    }
  }
  return (
    <AdminLayout title="정산 관리">
      {message && <p role="status">{message}</p>}
      <AdminCard
        title="정산 만들기"
        subtitle="구매 확정까지 끝난(완료) 프리오더만 정산할 수 있습니다."
      >
        {candidates.length ? (
          <form className="admin-review-form" onSubmit={create}>
            <label>
              프리오더
              <select
                value={form.preorderId}
                onChange={(e) =>
                  setForm({ ...form, preorderId: e.target.value })
                }
              >
                <option value="">선택해 주세요</option>
                {candidates.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.brandName})
                  </option>
                ))}
              </select>
            </label>
            <label>
              플랫폼 수수료율(%)
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.platformFeeRate}
                onChange={(e) =>
                  setForm({ ...form, platformFeeRate: e.target.value })
                }
              />
            </label>
            <button
              className="admin-button"
              type="submit"
              disabled={busyId === 'create'}
            >
              정산 만들기
            </button>
          </form>
        ) : (
          <p className="admin-muted">
            지금 정산할 수 있는 완료 프리오더가 없습니다.
          </p>
        )}
      </AdminCard>
      <ResourceGate state={state}>
        <AdminDataTable
          title="정산 목록"
          rows={state.data || []}
          empty="아직 만든 정산이 없습니다."
          columns={[
            { key: 'settlementNumber', label: '정산 번호' },
            {
              key: 'preorder',
              label: '프리오더',
              render: (r) => titleOf(r.preorderId),
            },
            {
              key: 'grossAmount',
              label: '총 결제',
              render: (r) => money(r.grossAmount, r.currency),
            },
            {
              key: 'refundAmount',
              label: '환불',
              render: (r) => money(r.refundAmount, r.currency),
            },
            {
              key: 'fee',
              label: '수수료',
              render: (r) => money(r.platformFeeAmount, r.currency),
            },
            {
              key: 'netAmount',
              label: '지급액',
              render: (r) => money(r.netAmount, r.currency),
            },
            {
              key: 'status',
              label: '상태',
              render: (r) => <StatusBadge code={r.status} />,
            },
            {
              key: 'actions',
              label: '처리',
              render: (r) =>
                (SETTLEMENT_ACTIONS[r.status] || []).map(
                  ([action, label, tone]) => (
                    <AdminButton
                      key={action}
                      tone={tone}
                      disabled={busyId === r.id}
                      onClick={() => act(r, action, label)}
                    >
                      {label}
                    </AdminButton>
                  ),
                ),
            },
          ]}
        />
      </ResourceGate>
    </AdminLayout>
  )
}
