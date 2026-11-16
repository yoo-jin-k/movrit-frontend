/**
 * 운영자 업체·인플루언서 화면입니다(실제 데이터).
 *
 * - 업체 상세(/admin/sellers/:id): GET /api/admin/sellers/{id} — 사업자 정보, 브랜드별 캠페인 수, 받은 신청 수
 *   심사 대기 업체는 승인·반려할 수 있습니다(PATCH /api/admin/sellers/{id}/approve·reject).
 *   업체 목록은 기존 '업체' 화면(AdminSellerPage)이 실제 데이터를 씁니다.
 * - 인플루언서 목록·상세(/admin/creators): GET /api/admin/creators(/{id}) — 신청·완료 수, 채널 지표, 최근 신청
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { approveSeller, rejectSeller } from '../../api/adminSellerApi'
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
  APPLICATION_STATUS_LABELS,
  dateOnly,
  dateTime,
  filterRows,
  statusLabel,
} from '../../features/admin/adminConsoleModel'
import useAdminResource from '../../features/admin/useAdminResource'
import { notifyPendingSellersChanged } from '../../features/admin/usePendingSellerCount'

export function AdminSellerDetailPage() {
  const { id } = useParams()
  const state = useAdminResource(`/admin/sellers/${id}`)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const seller = state.data
  // 심사 대기 업체를 승인 또는 반려합니다.
  const review = async (action) => {
    setBusy(true)
    setMessage('')
    try {
      await (action === 'approve' ? approveSeller : rejectSeller)(seller.id)
      setMessage(
        action === 'approve'
          ? '업체를 승인했습니다.'
          : '업체 신청을 반려했습니다.',
      )
      // 왼쪽 메뉴의 심사 대기 배지를 바로 다시 셉니다.
      notifyPendingSellersChanged()
      state.reload()
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          '처리하지 못했습니다. 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <AdminLayout title="업체 상세">
      <ResourceGate state={state}>
        {seller && (
          <>
            <DetailHeader
              name={seller.businessName}
              sub={`${seller.memberName} · ${seller.memberEmail}`}
              status={seller.status}
            >
              {seller.status === 'PENDING' && (
                <>
                  <AdminButton
                    tone="danger"
                    disabled={busy}
                    onClick={() => review('reject')}
                  >
                    반려
                  </AdminButton>
                  <AdminButton
                    tone="primary"
                    disabled={busy}
                    onClick={() => review('approve')}
                  >
                    승인
                  </AdminButton>
                </>
              )}
            </DetailHeader>
            {message && <p role="status">{message}</p>}
            <div className="admin-detail-grid">
              <DefinitionList
                title="사업자 정보"
                items={[
                  ['업체 번호', `#${seller.id}`],
                  ['사업자 번호', seller.businessNumber],
                  ['대표자', seller.representativeName],
                  [
                    '정산 계좌',
                    [seller.settlementBankCode, seller.settlementAccountMasked]
                      .filter(Boolean)
                      .join(' '),
                  ],
                  ['신청일', dateTime(seller.createdAt)],
                  ['운영 캠페인', `${seller.campaignCount}개`],
                  ['받은 신청', `${seller.applicationCount}건`],
                ]}
              />
              <AdminCard
                title="운영 브랜드"
                subtitle={`${seller.brands.length}개`}
              >
                {seller.brands.length ? (
                  <ul className="admin-activity">
                    {seller.brands.map((brand) => (
                      <li key={brand.id}>
                        <strong>{brand.name}</strong> ·{' '}
                        {statusLabel(brand.status)} · 캠페인{' '}
                        {brand.campaignCount}개
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-muted">등록한 브랜드가 없습니다.</p>
                )}
              </AdminCard>
            </div>
          </>
        )}
      </ResourceGate>
      <BackLink to="/admin/sellers" />
    </AdminLayout>
  )
}

const CREATOR_CHIPS = [
  ['', '전체'],
  ['ACTIVE', '정상'],
  ['SUSPENDED', '정지'],
]

export function AdminCreatorsPage() {
  const state = useAdminResource('/admin/creators', [])
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState('')
  const rows = filterRows(state.data || [], {
    search,
    searchKeys: ['nickname', 'primaryCategory', 'snsUrl'],
    chip,
    chipKey: 'status',
  })
  return (
    <AdminLayout title="인플루언서 관리">
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="닉네임, 분야, 채널 주소 검색"
        chips={CREATOR_CHIPS}
        chip={chip}
        onChip={setChip}
        onReload={state.reload}
      />
      <ResourceGate state={state}>
        <AdminDataTable
          title="인플루언서 목록"
          rows={rows}
          rowLink={(row) => `/admin/creators/${row.id}`}
          columns={[
            { key: 'nickname', label: '닉네임' },
            { key: 'primaryCategory', label: '주 분야' },
            {
              key: 'followerCount',
              label: '팔로워',
              render: (r) => (r.followerCount ?? 0).toLocaleString(),
            },
            {
              key: 'applicationCount',
              label: '신청',
              render: (r) => `${r.applicationCount}건`,
            },
            {
              key: 'completedCount',
              label: '완료',
              render: (r) => `${r.completedCount}건`,
            },
            {
              key: 'createdAt',
              label: '등록일',
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

export function AdminCreatorDetailPage() {
  const { id } = useParams()
  const state = useAdminResource(`/admin/creators/${id}`)
  const detail = state.data
  return (
    <AdminLayout title="인플루언서 상세">
      <ResourceGate state={state}>
        {detail && (
          <>
            <DetailHeader
              name={detail.creator.nickname}
              sub={detail.memberEmail}
              status={detail.creator.status}
            />
            <div className="admin-detail-grid">
              <DefinitionList
                title="활동 정보"
                items={[
                  ['소개', detail.bio],
                  ['주 분야', detail.creator.primaryCategory],
                  ['채널 주소', detail.creator.snsUrl],
                  [
                    '팔로워',
                    (detail.creator.followerCount ?? 0).toLocaleString(),
                  ],
                  ['캠페인 신청', `${detail.creator.applicationCount}건`],
                  ['캠페인 완료', `${detail.creator.completedCount}건`],
                  ['등록일', dateTime(detail.creator.createdAt)],
                ]}
              />
              <AdminCard
                title="채널 지표"
                subtitle={`${detail.metrics.length}건`}
              >
                {detail.metrics.length ? (
                  <ul className="admin-activity">
                    {detail.metrics.map((m, index) => (
                      <li key={`${m.channelType}-${m.metricType}-${index}`}>
                        <strong>{m.channelType}</strong> · {m.metricType}{' '}
                        {(m.value ?? 0).toLocaleString()} ·{' '}
                        {statusLabel(m.verificationStatus)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-muted">등록한 채널 지표가 없습니다.</p>
                )}
              </AdminCard>
            </div>
            <AdminCard title="최근 캠페인 신청">
              {detail.recentApplications.length ? (
                <ul className="admin-activity">
                  {detail.recentApplications.map((a) => (
                    <li key={a.id}>
                      <strong>{a.campaignTitle}</strong> ·{' '}
                      {APPLICATION_STATUS_LABELS[a.status] || a.status} ·{' '}
                      {dateOnly(a.submittedAt)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-muted">캠페인 신청 내역이 없습니다.</p>
              )}
            </AdminCard>
          </>
        )}
      </ResourceGate>
      <BackLink to="/admin/creators" />
    </AdminLayout>
  )
}
