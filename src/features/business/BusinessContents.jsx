/**
 * 업체 소유 콘텐츠의 승인·수정 요청을 서버 버전과 함께 처리합니다.
 * 처리 결과가 불명확하거나 충돌하면 명령을 잠그고 최신 목록 확인을 요구하며 업체 승인을 운영자 최종 승인과 구분합니다.
 */
import ReportButton from '../participation/ReportButton'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { contentLinks, CONTENT_CHANNELS } from '../membership/myContentModel'
import useBusinessList from './useBusinessList'
import { reviewContent } from './businessApi'
import { DetailDialog, ListState, PageHeader, StatusBadge } from './BusinessUi'
import {
  dateLabel,
  reviewPayload,
  safeContentUrl,
  statusNames,
} from './businessModel'
export default function BusinessContents() {
  const state = useBusinessList('/campaign-contents/seller')
  const [params, setParams] = useSearchParams()
  const applicationId = params.get('applicationId')
  const contentId = params.get('contentId')
  const [filter, setFilter] = useState(''),
    [selected, setSelected] = useState(null),
    [comment, setComment] = useState(''),
    [action, setAction] = useState('approve'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [notice, setNotice] = useState('')
  const shown = state.data.filter(
    (item) =>
      (!filter || item.status === filter) &&
      (!applicationId || String(item.applicationId) === applicationId) &&
      (!contentId || String(item.id) === contentId),
  )
  const choose = (item) => {
    setSelected(item)
    setComment('')
    setError('')
    setAction('approve')
    setLocked(false)
  }
  // 수정 요청 의견과 현재 콘텐츠 버전을 검증한 뒤 선택한 검토 명령을 보냅니다.
  // 충돌이나 응답 실패 뒤에는 같은 화면에서 반복 저장하지 않도록 잠금 상태를 사용합니다.
  const submit = async (event) => {
    event.preventDefault()
    if (busy || locked) return
    let payload
    try {
      payload = reviewPayload(selected, comment, action)
    } catch (failure) {
      setError(failure.message)
      return
    }
    setBusy(true)
    setError('')
    try {
      await reviewContent(selected.id, action, payload)
      setSelected(null)
      setNotice(
        action === 'approve'
          ? '업체 검토를 완료했습니다. 운영자 최종 승인은 별도입니다.'
          : '수정 요청을 전달했습니다.',
      )
      state.reload()
    } catch (failure) {
      setLocked(true)
      setError(
        failure.response?.status === 409
          ? '새 콘텐츠 또는 다른 검토가 반영되었습니다. 최신 목록을 불러온 후 다시 검토해 주세요.'
          : '검토 결과를 확인하지 못했습니다. 최신 목록에서 처리 여부를 확인해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        title="콘텐츠"
        description="제출된 콘텐츠를 확인하고 검토 의견을 전달하세요."
      />
      {contentId && (
        <p className="business-info">
          콘텐츠 #{contentId} 확인{' '}
          <button onClick={() => setParams({})}>전체 콘텐츠 보기</button>
        </p>
      )}
      {applicationId && (
        <p className="business-info">
          신청 #{applicationId}의 제출 내역{' '}
          <button onClick={() => setParams({})}>전체 콘텐츠 보기</button>
        </p>
      )}
      <div className="business-filters">
        <select
          aria-label="콘텐츠 상태 필터"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">전체 상태</option>
          {[
            'SUBMITTED',
            'REVISION_REQUESTED',
            'BRAND_APPROVED',
            'APPROVED',
          ].map((s) => (
            <option key={s} value={s}>
              {statusNames[s]}
            </option>
          ))}
        </select>
        <button onClick={state.reload}>새로고침</button>
      </div>
      <p className="business-info">
        업체 검토 완료와 운영자 최종 승인은 별도입니다. 제출한 링크를 열 수 없는
        경우에도 미제출로 변경하지 않습니다.
      </p>
      {notice && <p role="status">{notice}</p>}
      <section className="business-panel">
        <ListState state={state}>
          {shown.length ? (
            <div className="business-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>캠페인 / 참여자</th>
                    <th>상태</th>
                    <th>수정 횟수</th>
                    <th>제출일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.campaignTitle}</strong>
                        <small>{item.creatorNickname}</small>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{item.revisionCount ?? '미제공'}</td>
                      <td>{dateLabel(item.submittedAt)}</td>
                      <td>
                        <button onClick={() => choose(item)}>
                          콘텐츠 검토
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="business-empty">조건에 맞는 콘텐츠가 없습니다.</div>
          )}
        </ListState>
      </section>
      {selected && (
        <DetailDialog
          title="콘텐츠 검토"
          onClose={() => setSelected(null)}
          busy={busy}
        >
          <h3>{selected.campaignTitle}</h3>
          <p>
            {selected.creatorNickname} · 버전 {selected.version ?? '미확인'}
          </p>
          <StatusBadge status={selected.status} />
          {/* 부적절한 콘텐츠는 운영자에게 신고할 수 있습니다(경고·이용 정지 검토). */}
          <ReportButton targetType="CAMPAIGN_CONTENT" targetId={selected.id} />
          {contentLinks(selected).map((link, index) => (
            <p key={index}>
              {CONTENT_CHANNELS[link.channelType] || '기존 제출'} ·{' '}
              {safeContentUrl(link.contentUrl) ? (
                <a
                  className="business-link"
                  href={safeContentUrl(link.contentUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  제출 콘텐츠 새 창에서 열기 ↗
                </a>
              ) : (
                '열 수 있는 콘텐츠 주소가 아닙니다.'
              )}
            </p>
          ))}
          <p>{selected.note || '제출 메모가 없습니다.'}</p>
          <h3>최근 검토 의견</h3>
          <p>{selected.reviewComment || '아직 검토 의견이 없습니다.'}</p>
          {selected.status === 'SUBMITTED' && (
            <form onSubmit={submit}>
              <label>
                검토 결과
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  disabled={busy || locked}
                >
                  <option value="approve">업체 검토 완료</option>
                  <option value="request-revision">수정 요청</option>
                </select>
              </label>
              <label>
                검토 의견 {action === 'request-revision' ? '(필수)' : '(선택)'}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required={action === 'request-revision'}
                  maxLength={2000}
                  disabled={busy || locked}
                  rows={5}
                />
              </label>
              <button
                className="business-primary"
                disabled={
                  busy || locked || !Number.isSafeInteger(selected.version)
                }
              >
                {busy ? '처리 중...' : '검토 결과 저장'}
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="business-error">
              {error}
            </p>
          )}
          {locked && (
            <button
              onClick={() => {
                setSelected(null)
                state.reload()
              }}
            >
              최신 목록 확인
            </button>
          )}
        </DetailDialog>
      )}
    </>
  )
}
