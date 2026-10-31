/**
 * 운영자 공지/콘텐츠·리포트·설정 화면입니다(실제 데이터).
 *
 * - 공지/콘텐츠(/admin/content): GET·POST /api/admin/notices, PUT·DELETE /api/admin/notices/{id}
 *   공지를 쓰고 고치고 게시·내리고 지웁니다. 게시한 공지는 사용자 '공지사항' 화면에 바로 나옵니다.
 * - 리포트(/admin/reports): GET /api/admin/reports + 최근 운영 기록 GET /api/admin/audit-logs
 * - 설정(/admin/settings): GET /api/admin/settings — 실행 환경 현황(읽기 전용, 비밀값 없음)
 */
import { useState } from 'react'
import api from '../../api/axios'
import AdminLayout, {
  AdminButton,
  AdminCard,
} from '../../components/admin/AdminLayout'
import {
  AdminDataTable,
  DefinitionList,
  ResourceGate,
  SearchFilters,
} from '../../features/admin/AdminConsoleViews'
import {
  APPLICATION_STATUS_LABELS,
  AUDIT_ACTION_LABELS,
  AUDIT_TARGET_LABELS,
  CAMPAIGN_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  NOTICE_CATEGORY_LABELS,
  countEntries,
  dateTime,
  filterRows,
  money,
} from '../../features/admin/adminConsoleModel'
import useAdminResource from '../../features/admin/useAdminResource'

// ───────── 공지/콘텐츠 ─────────

const EMPTY_NOTICE = {
  title: '',
  body: '',
  category: 'NOTICE',
  pinned: false,
  published: true,
}

const NOTICE_CHIPS = [
  ['', '전체'],
  ['published', '게시 중'],
  ['draft', '게시 전'],
]

export function AdminContentPage() {
  const state = useAdminResource('/admin/notices', [])
  const [search, setSearch] = useState('')
  const [chip, setChip] = useState('')
  const [editing, setEditing] = useState(null) // null: 닫힘, 'new': 새 공지, 숫자: 수정 중인 공지 ID
  const [form, setForm] = useState(EMPTY_NOTICE)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const rows = filterRows(state.data || [], {
    search,
    searchKeys: ['title', 'body'],
    chip,
    chipKey: (row) => (row.published ? 'published' : 'draft'),
  })
  const open = (notice) => {
    setEditing(notice ? notice.id : 'new')
    setForm(
      notice
        ? {
            title: notice.title,
            body: notice.body,
            category: notice.category,
            pinned: notice.pinned,
            published: notice.published,
          }
        : EMPTY_NOTICE,
    )
    setMessage('')
  }
  // 새 공지는 POST, 기존 공지는 PUT으로 저장합니다.
  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      setMessage('제목과 내용을 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      if (editing === 'new') await api.post('/admin/notices', form)
      else await api.put(`/admin/notices/${editing}`, form)
      setMessage(
        form.published
          ? '공지를 저장하고 게시했습니다.'
          : '공지를 게시 전 상태로 저장했습니다.',
      )
      setEditing(null)
      state.reload()
    } catch (error) {
      setMessage(error.response?.data?.detail || '공지를 저장하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }
  // 한 번 더 확인받은 뒤 공지를 지웁니다.
  const remove = async (notice) => {
    setBusy(true)
    try {
      await api.delete(`/admin/notices/${notice.id}`)
      setMessage(`'${notice.title}' 공지를 삭제했습니다.`)
      setDeleting(null)
      state.reload()
    } catch {
      setMessage('공지를 삭제하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <AdminLayout
      title="공지 / 콘텐츠 관리"
      actions={
        <AdminButton tone="primary" onClick={() => open(null)}>
          새 공지 쓰기
        </AdminButton>
      }
    >
      {message && <p role="status">{message}</p>}
      {editing !== null && (
        <AdminCard
          title={editing === 'new' ? '새 공지' : `공지 #${editing} 수정`}
        >
          <form className="admin-review-form admin-notice-form" onSubmit={save}>
            <label>
              구분
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(NOTICE_CATEGORY_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              제목
              <input
                maxLength={200}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              내용
              <textarea
                rows={8}
                maxLength={20000}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
              목록 맨 위에 고정
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />
              사용자에게 게시
            </label>
            <div className="admin-actions">
              <button className="admin-button" type="submit" disabled={busy}>
                {busy ? '저장 중...' : '저장'}
              </button>
              <AdminButton disabled={busy} onClick={() => setEditing(null)}>
                닫기
              </AdminButton>
            </div>
          </form>
        </AdminCard>
      )}
      <SearchFilters
        search={search}
        onSearch={setSearch}
        placeholder="공지 제목, 내용 검색"
        chips={NOTICE_CHIPS}
        chip={chip}
        onChip={setChip}
        onReload={state.reload}
      />
      <ResourceGate state={state}>
        <AdminDataTable
          title="공지 목록"
          rows={rows}
          empty="작성한 공지가 없습니다. '새 공지 쓰기'로 첫 공지를 올려 보세요."
          columns={[
            {
              key: 'category',
              label: '구분',
              render: (r) => NOTICE_CATEGORY_LABELS[r.category],
            },
            {
              key: 'title',
              label: '제목',
              render: (r) => `${r.pinned ? '[고정] ' : ''}${r.title}`,
            },
            {
              key: 'authorName',
              label: '작성자',
              render: (r) => r.authorName || '운영팀',
            },
            {
              key: 'publishedAt',
              label: '게시일',
              render: (r) => dateTime(r.publishedAt),
            },
            {
              key: 'published',
              label: '상태',
              render: (r) => (r.published ? '게시 중' : '게시 전'),
            },
            {
              key: 'actions',
              label: '관리',
              render: (r) =>
                deleting === r.id ? (
                  <>
                    <AdminButton
                      tone="danger"
                      disabled={busy}
                      onClick={() => remove(r)}
                    >
                      삭제 확인
                    </AdminButton>
                    <AdminButton
                      disabled={busy}
                      onClick={() => setDeleting(null)}
                    >
                      취소
                    </AdminButton>
                  </>
                ) : (
                  <>
                    <AdminButton onClick={() => open(r)}>수정</AdminButton>
                    <AdminButton
                      tone="danger"
                      onClick={() => setDeleting(r.id)}
                    >
                      삭제
                    </AdminButton>
                  </>
                ),
            },
          ]}
        />
      </ResourceGate>
    </AdminLayout>
  )
}

// ───────── 리포트 ─────────

// 상태별 건수를 막대와 숫자로 보여줍니다.
function CountBars({ title, counts, labels }) {
  const entries = countEntries(counts, labels)
  const max = Math.max(1, ...entries.map((e) => e.count))
  return (
    <AdminCard
      title={title}
      subtitle={`합계 ${entries.reduce((sum, e) => sum + e.count, 0)}건`}
    >
      {entries.length ? (
        <ul className="admin-bars">
          {entries.map((e) => (
            <li key={e.code}>
              <span>{e.label}</span>
              <span className="admin-bars__track" aria-hidden="true">
                <span style={{ width: `${(e.count / max) * 100}%` }} />
              </span>
              <strong>{e.count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-muted">데이터가 없습니다.</p>
      )}
    </AdminCard>
  )
}

export function AdminReportsPage() {
  const state = useAdminResource('/admin/reports')
  const logs = useAdminResource('/admin/audit-logs', [])
  const r = state.data
  return (
    <AdminLayout
      title="운영 리포트"
      actions={<AdminButton onClick={state.reload}>새로고침</AdminButton>}
    >
      <ResourceGate state={state}>
        {r && (
          <>
            <p className="admin-muted">
              기준 시각 {dateTime(r.generatedAt)} · 실제 DB 집계입니다.
            </p>
            <div className="admin-kpis">
              <article>
                <span>모집 중 캠페인</span>
                <strong>{r.openCampaigns}</strong>
              </article>
              <article>
                <span>선정 후 완료율</span>
                <strong>{r.completionRate}%</strong>
              </article>
              <article>
                <span>결제 완료 금액</span>
                <strong>{money(r.paidAmount)}</strong>
              </article>
              <article>
                <span>환불 금액</span>
                <strong>{money(r.refundedAmount)}</strong>
              </article>
            </div>
            <div className="admin-detail-grid">
              <CountBars
                title="캠페인 신청 상태"
                counts={r.applicationsByStatus}
                labels={APPLICATION_STATUS_LABELS}
              />
              <CountBars
                title="콘텐츠 검토 상태"
                counts={r.contentsByStatus}
                labels={CONTENT_STATUS_LABELS}
              />
              <CountBars
                title="캠페인 종류"
                counts={r.campaignsByType}
                labels={CAMPAIGN_TYPE_LABELS}
              />
              <CountBars title="회원 상태" counts={r.membersByStatus} />
              <CountBars title="주문 상태" counts={r.ordersByStatus} />
              <CountBars title="정산 상태" counts={r.settlementsByStatus} />
            </div>
          </>
        )}
      </ResourceGate>
      <ResourceGate state={logs}>
        <AdminDataTable
          title="최근 운영 기록"
          rows={(logs.data || []).slice(0, 20)}
          empty="운영 기록이 없습니다."
          columns={[
            {
              key: 'createdAt',
              label: '시각',
              render: (x) => dateTime(x.createdAt),
            },
            {
              key: 'action',
              label: '작업',
              render: (x) => AUDIT_ACTION_LABELS[x.action] || x.action,
            },
            {
              key: 'targetType',
              label: '대상',
              render: (x) =>
                `${AUDIT_TARGET_LABELS[x.targetType] || x.targetType || '-'} #${x.targetId ?? '-'}`,
            },
            {
              key: 'actorMemberId',
              label: '처리자',
              render: (x) =>
                x.actorMemberId ? `회원 #${x.actorMemberId}` : '시스템',
            },
          ]}
        />
      </ResourceGate>
    </AdminLayout>
  )
}

// ───────── 설정 ─────────

const EMAIL_MODES = {
  'local-preview': '로컬 시연(인증번호를 화면에 표시)',
  smtp: '실제 메일 발송(SMTP)',
  unconfigured: '미설정(발송하지 않음)',
}

export function AdminSettingsPage() {
  const state = useAdminResource('/admin/settings')
  const s = state.data
  const yes = (value) => (value ? '설정됨' : '미설정')
  return (
    <AdminLayout title="운영 설정">
      <p className="admin-muted">
        서버 실행 환경 현황입니다. 값은 서버 설정 파일과 환경 변수로 바꾸며,
        보안을 위해 비밀값은 표시하지 않고 설정 여부만 보여줍니다.
      </p>
      <ResourceGate state={state}>
        {s && (
          <div className="admin-detail-grid">
            <DefinitionList
              title="로그인·인증"
              items={[
                ['Google 로그인', yes(s.googleLoginConfigured)],
                ['카카오 로그인', yes(s.kakaoLoginConfigured)],
                [
                  '이메일 인증 발송',
                  EMAIL_MODES[s.emailDelivery] || s.emailDelivery,
                ],
                ['인증번호 유효 시간', `${s.verificationExpiresMinutes}분`],
                ['시간당 발송 한도', `${s.verificationHourlyLimit}회`],
              ]}
            />
            <DefinitionList
              title="서버·데이터"
              items={[
                ['실행 프로필', s.activeProfiles.join(', ') || 'default'],
                [
                  'DB 스키마 버전',
                  s.schemaVersion ? `V${s.schemaVersion}` : '-',
                ],
                [
                  '프리오더 자동 진행 주기',
                  `${Math.round(s.preorderLifecycleDelayMs / 1000)}초`,
                ],
                ['업로드 저장 위치', s.uploadDirectory],
              ]}
            />
          </div>
        )}
      </ResourceGate>
    </AdminLayout>
  )
}
