/**
 * 운영자 회원 상세의 '기간 연장 이력' 카드입니다.
 * - 참여자 요청 승인과 업체·운영자 직접 연장을 모두 세어 최근 1년·전체 횟수와 출처별 횟수, 반려된 요청 수를 보여 줍니다.
 * - 잦은 연장은 여기서 확인하고, 필요하면 같은 화면의 계정 정지 등으로 제재를 판단합니다.
 */
import { useEffect, useState } from 'react'
import { AdminCard } from '../../components/admin/AdminLayout'
import { readMemberExtensions } from '../../api/participationChangeApi'
import { workspaceTime } from '../membership/campaignWorkspaceModel'
import {
  EXTENSION_SOURCE,
  extensionCountText,
} from './participationChangeModel'

export default function MemberExtensionHistory({ memberId }) {
  const [state, setState] = useState({ loading: true, data: null })
  // 기록이 많으면 최근 10건만 먼저 보여 주고, 버튼으로 나머지(최대 50건)를 펼칩니다.
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    readMemberExtensions(memberId, controller.signal)
      .then((data) => setState({ loading: false, data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ loading: false, data: null })
      })
    return () => controller.abort()
  }, [memberId])

  const data = state.data
  return (
    <AdminCard
      title="기간 연장 이력"
      subtitle="참여자 요청 승인과 업체·운영자 직접 연장을 모두 셉니다"
    >
      {state.loading ? (
        <p role="status">연장 이력을 불러오고 있습니다.</p>
      ) : !data ? (
        <p role="alert">연장 이력을 불러오지 못했습니다.</p>
      ) : (
        <>
          <p>
            <strong>
              {extensionCountText(data.yearCount, data.totalCount)}
            </strong>
          </p>
          <p className="admin-muted">
            참여자 요청 승인 {data.requestCount}회 · 업체·운영자 직접 연장{' '}
            {data.directCount}회 · 반려된 요청 {data.rejectedRequestCount}건
          </p>
          {data.logs.length ? (
            <ul className="admin-activity" aria-label="연장 기록">
              {(expanded ? data.logs : data.logs.slice(0, 10)).map((log) => (
                <li key={log.id}>
                  <strong>{log.campaignTitle}</strong> · {log.days}일 ·{' '}
                  {EXTENSION_SOURCE[log.source] || log.source}
                  {log.extendedByNickname &&
                    ` (${log.extendedByNickname})`} ·{' '}
                  {workspaceTime(log.createdAt)}
                  <br />
                  <small>
                    {log.brandName} · 마감 {workspaceTime(log.previousDeadline)}{' '}
                    → {workspaceTime(log.newDeadline)} · {log.reason}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-muted">기간 연장 기록이 없습니다.</p>
          )}
          {data.logs.length > 10 && (
            <button
              type="button"
              className="admin-button admin-button--secondary"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded
                ? '최근 10건만 보기'
                : `기록 ${data.logs.length}건 모두 보기`}
            </button>
          )}
        </>
      )}
    </AdminCard>
  )
}
