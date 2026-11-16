/**
 * 운영자 캠페인 관리 화면입니다(/admin/campaigns).
 * - 모든 브랜드의 캠페인을 상태(모집 예정·모집 중·모집 마감·숨김)와 신청·선정·완료 수로 봅니다.
 * - 부적절하거나 점검용인 캠페인은 사유와 함께 '숨기기'(마감)로 사용자 목록에서 내리고, 필요하면 '다시 공개'합니다.
 * - 숨김은 데이터를 지우지 않습니다. 이미 진행 중인 참여자·콘텐츠 흐름은 그대로 이어집니다.
 * - 캠페인마다 신청 조건(인스타그램 팔로워 수·네이버 블로그 일평균 방문자)을 정하거나 해제합니다.
 * - 서버 API: GET /api/admin/campaigns, PATCH …/{id}/close, PATCH …/{id}/reopen, PUT·DELETE …/{id}/eligibility-requirement
 * - 변경 이력: '조건 설정'·'숨기기'를 누르면 목록 맨 아래에 입력 영역이 붙던 것 → 목록 위 모달 창으로 띄웁니다
 *   (Esc로 닫기, 닫으면 누른 버튼으로 초점 복귀, 열린 동안 바깥 스크롤 잠금).
 */
import { useState } from 'react'
import { changeAdminCampaignVisibility } from '../api/adminApi'
import AdminLayout, { AdminCard } from '../components/admin/AdminLayout'
import useBusinessList from '../features/business/useBusinessList'
import { dateLabel } from '../features/business/businessModel'
import {
  CAMPAIGN_STATES,
  CAMPAIGN_STATE_FILTERS,
  CAMPAIGN_TYPE_LABELS,
  closeReasonError,
  filterAdminCampaigns,
  isQaCampaign,
} from '../features/admin/adminCampaignModel'
import AdminRequirementEditor from '../features/admin/AdminRequirementEditor'
import AdminDialog from '../features/admin/AdminDialog'
import { campaignRequirementSummary } from '../features/discovery/eligibilityModel'

export default function AdminCampaignsPage() {
  const state = useBusinessList('/admin/campaigns')
  const [filter, setFilter] = useState({ state: '', search: '', showQa: true })
  const [closing, setClosing] = useState(null)
  const [editingRequirement, setEditingRequirement] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const shown = filterAdminCampaigns(state.data, filter)
  const qaOpen = (state.data || []).filter(
    (item) => isQaCampaign(item) && item.open,
  ).length

  // 숨기기(사유 필수) 또는 다시 공개를 보냅니다. 처리 후 목록을 다시 불러옵니다.
  const act = async (item, action) => {
    if (busy) return
    if (action === 'close') {
      const problem = closeReasonError(reason)
      if (problem) {
        setError(problem)
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      await changeAdminCampaignVisibility(item.id, action, reason)
      setNotice(
        `캠페인 #${item.id} '${item.title}' ${
          action === 'close' ? '숨김을' : '다시 공개를'
        } 마쳤습니다. 업체에 알림을 보냈습니다.`,
      )
      setClosing(null)
      setReason('')
      state.reload()
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '처리 결과를 확인하지 못했습니다. 최신 목록을 확인해 주세요.',
      )
      if (failure.response?.status === 409) state.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="캠페인 관리">
      <p>
        모든 캠페인의 모집 상태와 신청 현황을 확인합니다. 숨긴 캠페인은 사용자
        목록·검색에서 빠지며, 데이터와 진행 중인 참여는 그대로 유지됩니다.
        {qaOpen > 0 && ` 현재 공개 중인 점검용 캠페인이 ${qaOpen}개 있습니다.`}
      </p>
      <div className="admin-filters">
        <input
          aria-label="캠페인 검색"
          value={filter.search}
          onChange={(event) =>
            setFilter({ ...filter, search: event.target.value })
          }
          placeholder="제목·브랜드·번호"
        />
        <select
          aria-label="캠페인 상태"
          value={filter.state}
          onChange={(event) =>
            setFilter({ ...filter, state: event.target.value })
          }
        >
          {CAMPAIGN_STATE_FILTERS.map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={filter.showQa}
            onChange={(event) =>
              setFilter({ ...filter, showQa: event.target.checked })
            }
          />
          점검용 캠페인 함께 보기
        </label>
        <button
          className="admin-button admin-button--secondary"
          disabled={busy || state.loading}
          onClick={state.reload}
        >
          새로고침
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && !closing && <p role="alert">{error}</p>}
      {state.loading ? (
        <p role="status">캠페인 목록을 확인하고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : !shown.length ? (
        <p>조건에 맞는 캠페인이 없습니다.</p>
      ) : (
        <AdminCard title={`캠페인 ${shown.length}개`}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>캠페인</th>
                  <th>브랜드</th>
                  <th>상태</th>
                  <th>모집 기간</th>
                  <th>신청·선정·완료 / 모집</th>
                  <th>신청 조건</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id}>
                    <td data-label="번호">#{item.id}</td>
                    <td data-label="캠페인">
                      <a
                        href={`/campaign/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.title}
                      </a>
                      <br />
                      <small>
                        {CAMPAIGN_TYPE_LABELS[item.campaignType] ||
                          item.campaignType}{' '}
                        ·{' '}
                        {item.selectionMode === 'OPERATOR'
                          ? '운영자 선정'
                          : '브랜드 직접 선정'}
                      </small>
                    </td>
                    <td data-label="브랜드">{item.brandName || '-'}</td>
                    <td data-label="상태">
                      {CAMPAIGN_STATES[item.state] || item.state}
                    </td>
                    <td data-label="모집 기간">
                      {dateLabel(item.startAt)} ~ {dateLabel(item.endAt)}
                    </td>
                    <td data-label="신청·선정·완료 / 모집">
                      {item.applied} · {item.selected} · {item.completed} /{' '}
                      {item.recruitmentCount ?? '-'}명
                    </td>
                    <td data-label="신청 조건">
                      {item.requirement
                        ? campaignRequirementSummary(item.requirement)
                        : '없음'}
                      <br />
                      <button
                        className="admin-button admin-button--secondary"
                        disabled={busy}
                        onClick={() => {
                          setClosing(null)
                          setEditingRequirement(item)
                          setError('')
                        }}
                      >
                        조건 설정
                      </button>
                    </td>
                    <td data-label="관리">
                      {item.open ? (
                        <button
                          className="admin-button admin-button--secondary"
                          disabled={busy}
                          onClick={() => {
                            setEditingRequirement(null)
                            setClosing(item)
                            setReason(
                              isQaCampaign(item) ? '점검용 캠페인 정리' : '',
                            )
                            setError('')
                          }}
                        >
                          숨기기
                        </button>
                      ) : (
                        <button
                          className="admin-button admin-button--secondary"
                          disabled={busy}
                          onClick={() => act(item, 'reopen')}
                        >
                          다시 공개
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
      {editingRequirement && (
        <AdminRequirementEditor
          key={editingRequirement.id}
          item={editingRequirement}
          onCancel={() => setEditingRequirement(null)}
          onDone={(message) => {
            setNotice(message)
            setEditingRequirement(null)
            state.reload()
          }}
        />
      )}
      {closing && (
        <AdminDialog
          title={`#${closing.id} 캠페인 숨기기`}
          onClose={() => setClosing(null)}
          busy={busy}
        >
          <p>
            &lsquo;{closing.title}&rsquo; 캠페인을 사용자 목록에서 숨깁니다.
            신청을 더 받지 않고 상세 주소로도 일반 회원에게 보이지 않으며, 이미
            신청·선정된 참여자의 진행은 그대로 이어집니다.
          </p>
          <div className="admin-review-form">
            <label>
              숨김 사유 (필수, 업체에 전달됩니다)
              <textarea
                rows={3}
                maxLength={300}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
              />
            </label>
            <div className="admin-actions-row">
              <button
                className="admin-button admin-button--danger"
                disabled={busy}
                onClick={() => act(closing, 'close')}
              >
                {busy ? '처리 중...' : '숨기기 확정'}
              </button>
              <button
                className="admin-button admin-button--secondary"
                disabled={busy}
                onClick={() => setClosing(null)}
              >
                취소
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </div>
        </AdminDialog>
      )}
    </AdminLayout>
  )
}
