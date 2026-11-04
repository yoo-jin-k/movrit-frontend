/**
 * 운영자 회원 관리 화면입니다(실제 데이터).
 *
 * - 목록(/admin/members): GET /api/admin/members — 이름·이메일·닉네임 검색, 상태 필터
 * - 상세(/admin/members/:id): GET /api/admin/members/{id} — 기본 정보, 운영 브랜드, 최근 캠페인 신청
 *   기간 연장 이력: GET /api/admin/members/{id}/extensions — 연장 횟수(최근 1년·전체)와 출처별 기록
 * - 계정 정지·해제: PATCH /api/members/admin/{id}/status?status=SUSPENDED|ACTIVE
 *   운영자 계정과 본인 계정은 바꿀 수 없습니다(서버도 본인 계정 변경을 막습니다).
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
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
  ROLE_LABELS,
  dateOnly,
  dateTime,
  filterRows,
  statusLabel,
} from '../../features/admin/adminConsoleModel'
import useAdminResource from '../../features/admin/useAdminResource'
import MemberExtensionHistory from '../../features/participation/MemberExtensionHistory'

const MEMBER_CHIPS = [
  ['', '전체'],
  ['ACTIVE', '정상'],
  ['SUSPENDED', '정지'],
  ['INACTIVE', '휴면'],
]

// 로그인 방식(이메일 + 연결된 소셜)을 한 줄로 보여줍니다.
const loginMethods = (member) =>
  [
    '이메일',
    ...member.socialProviders.map((p) =>
      p === 'GOOGLE' ? 'Google' : p === 'KAKAO' ? '카카오' : p,
    ),
  ].join(' · ')

// 회원 구분(일반·운영자 + 업체·인플루언서 여부)을 한 줄로 보여줍니다.
const memberKinds = (member) =>
  [
    ROLE_LABELS[member.role] || member.role,
    member.sellerStatus && `업체(${statusLabel(member.sellerStatus)})`,
    member.creator && '인플루언서',
  ]
    .filter(Boolean)
    .join(' · ')

export function AdminMembersPage() {
  const state = useAdminResource('/admin/members', [])
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState('')
  const rows = filterRows(state.data || [], {
    search,
    searchKeys: ['name', 'nickname', 'email'],
    chip,
    chipKey: 'status',
  })
  return (
    <AdminLayout title="회원 관리">
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="이름, 닉네임, 이메일 검색"
        chips={MEMBER_CHIPS}
        chip={chip}
        onChip={setChip}
        onReload={state.reload}
      />
      <ResourceGate state={state}>
        <AdminDataTable
          title="회원 목록"
          rows={rows}
          rowLink={(row) => `/admin/members/${row.id}`}
          columns={[
            {
              key: 'name',
              label: '이름',
              render: (r) => `${r.name} (${r.nickname})`,
            },
            { key: 'email', label: '이메일' },
            { key: 'kind', label: '구분', render: memberKinds },
            { key: 'login', label: '로그인 방식', render: loginMethods },
            {
              key: 'applicationCount',
              label: '캠페인 신청',
              render: (r) => `${r.applicationCount}건`,
            },
            {
              key: 'createdAt',
              label: '가입일',
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

export function AdminMemberDetailPage() {
  const { id } = useParams()
  const state = useAdminResource(`/admin/members/${id}`)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const member = state.data?.member
  const suspended = member?.status === 'SUSPENDED'
  // 정지 ↔ 해제를 서버에 요청하고, 성공하면 상세를 다시 불러옵니다.
  const changeStatus = async () => {
    setBusy(true)
    setMessage('')
    try {
      await api.patch(`/members/admin/${member.id}/status`, undefined, {
        params: { status: suspended ? 'ACTIVE' : 'SUSPENDED' },
      })
      setMessage(suspended ? '정지를 해제했습니다.' : '계정을 정지했습니다.')
      setConfirm(false)
      state.reload()
    } catch (error) {
      setMessage(
        error.response?.data?.detail ||
          '상태를 바꾸지 못했습니다. 다시 시도해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <AdminLayout title="회원 상세">
      <ResourceGate state={state}>
        {member && (
          <>
            <DetailHeader
              name={member.name}
              sub={`${member.nickname} · ${member.email}`}
              status={member.status}
            >
              {member.role !== 'ADMIN' &&
                (confirm ? (
                  <>
                    <span>
                      {suspended
                        ? '정지를 해제할까요?'
                        : '이 계정을 정지할까요?'}
                    </span>
                    <AdminButton
                      tone={suspended ? 'primary' : 'danger'}
                      disabled={busy}
                      onClick={changeStatus}
                    >
                      {busy ? '처리 중...' : '확인'}
                    </AdminButton>
                    <AdminButton
                      disabled={busy}
                      onClick={() => setConfirm(false)}
                    >
                      취소
                    </AdminButton>
                  </>
                ) : (
                  <AdminButton
                    tone={suspended ? 'primary' : 'danger'}
                    onClick={() => setConfirm(true)}
                  >
                    {suspended ? '정지 해제' : '계정 정지'}
                  </AdminButton>
                ))}
            </DetailHeader>
            {message && <p role="status">{message}</p>}
            <div className="admin-detail-grid">
              <DefinitionList
                title="기본 정보"
                items={[
                  ['회원 번호', `#${member.id}`],
                  ['구분', memberKinds(member)],
                  ['로그인 방식', loginMethods(member)],
                  ['이메일 인증', member.emailVerified ? '완료' : '미완료'],
                  ['연락처', state.data.phoneMasked],
                  [
                    '휴대폰 인증',
                    state.data.phoneVerifiedAt
                      ? `완료 (${dateTime(state.data.phoneVerifiedAt)})`
                      : '미완료',
                  ],
                  ['가입일', dateTime(member.createdAt)],
                  ['최근 로그인', dateTime(member.lastLoginAt)],
                  ['운영 브랜드', state.data.brands.join(', ')],
                ]}
              />
              <AdminCard
                title="최근 캠페인 신청"
                subtitle={`전체 ${member.applicationCount}건 중 최근 10건`}
              >
                {state.data.recentApplications.length ? (
                  <ul className="admin-activity">
                    {state.data.recentApplications.map((a) => (
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
              {/* 참여자 요청 승인 + 업체·운영자 직접 연장을 모두 센 연장 횟수입니다. */}
              <MemberExtensionHistory memberId={member.id} />
            </div>
          </>
        )}
      </ResourceGate>
      <BackLink to="/admin/members" />
    </AdminLayout>
  )
}
