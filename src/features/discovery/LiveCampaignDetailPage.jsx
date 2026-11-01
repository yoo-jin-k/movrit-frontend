/**
 * 공개 본문과 신청 폼을 각각 조회하여 한쪽 실패가 다른쪽 결과를 숨기지 않게 합니다.
 * 실제 미디어 조회와 신청 영역을 연결하고 새로고침 시 최신 데이터로 다시 구성합니다.
 * 모바일에서는 본문을 먼저 보여주고 하단 고정 바로 신청 영역에 바로 이동할 수 있게 합니다.
 */
import { useEffect, useState } from 'react'
import RecruitmentProgress from './RecruitmentProgress'
import { Link } from 'react-router-dom'
import {
  readCampaign,
  readCampaignForm,
  campaignReadError,
} from '../../api/campaignReadApi'
import CampaignSchedule from './CampaignSchedule'
import { liveCampaignSchedule } from './scheduleModel'
import DiscoveryLayout from './DiscoveryLayout'
import CampaignParticipation from './CampaignParticipation'
import CampaignPublicMedia from './CampaignPublicMedia'
import { recruitmentDeadlineLabel } from './campaignDates'

// 신청 영역으로 부드럽게 이동합니다. 동작 줄이기 설정을 켠 사용자는 즉시 이동합니다.
function scrollToApply() {
  const target = document.getElementById('campaign-apply')
  if (!target) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  })
}

// 실제 상세와 신청 폼은 별도로 읽습니다. 폼 조회 실패가 공개 상세까지 숨기지 않도록 합니다.
export default function LiveCampaignDetailPage({ campaignId }) {
  const [state, setState] = useState({
    detail: null,
    form: null,
    loading: true,
    error: '',
    formError: '',
  })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    Promise.allSettled([
      readCampaign(campaignId, controller.signal),
      readCampaignForm(campaignId, controller.signal),
    ]).then(([detail, form]) => {
      if (controller.signal.aborted) return
      setState({
        loading: false,
        detail: detail.status === 'fulfilled' ? detail.value : null,
        error:
          detail.status === 'rejected' ? campaignReadError(detail.reason) : '',
        form: form.status === 'fulfilled' ? form.value : null,
        formError:
          form.status === 'rejected' ? campaignReadError(form.reason) : '',
      })
    })
    return () => controller.abort()
  }, [campaignId, attempt])
  const retry = () => {
    setState((current) => ({ ...current, loading: true }))
    setAttempt((value) => value + 1)
  }
  const { detail, form } = state
  return (
    <DiscoveryLayout>
      <main className="discovery-width discovery-detail">
        {state.loading ? (
          <div className="main-home__state" role="status">
            캠페인을 불러오는 중입니다.
          </div>
        ) : state.error || !detail ? (
          <div className="main-home__state" role="alert">
            <p>{state.error || '캠페인을 찾을 수 없습니다.'}</p>
            <button type="button" onClick={retry}>
              다시 시도
            </button>
            <Link to="/home">메인으로 돌아가기</Link>
          </div>
        ) : (
          <div className="discovery-detail__layout">
            <div className="discovery-detail__body">
              <h1>{detail.title}</h1>
              <p>{detail.brandName}</p>
              <CampaignPublicMedia
                key={`${campaignId}-${attempt}`}
                campaignId={campaignId}
              />
              <p>
                {detail.description || '캠페인 소개가 등록되지 않았습니다.'}
              </p>
              <dl className="discovery-detail__information">
                {[
                  ['제공 내역', detail.rewardDescription],
                  ['캠페인 미션', detail.mission],
                  ['참여 채널 안내', detail.channelGuide],
                  [
                    '참여 조건',
                    '아래 신청 영역에서 캠페인별 최신 참여 조건을 확인해 주세요.',
                  ],
                  ['일정 안내', detail.scheduleGuide],
                  ['배송 안내', detail.deliveryGuide],
                  ['방문 안내', detail.visitGuide],
                  ['제출 요건', detail.submissionRequirement],
                  ['추가 안내사항', detail.caution],
                ].map(([title, value]) => (
                  <div key={title}>
                    <dt>{title}</dt>
                    <dd>
                      <p style={{ whiteSpace: 'pre-wrap' }}>
                        {value || '안내가 등록되지 않았습니다.'}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <aside className="discovery-detail__summary" id="campaign-apply">
              <h2>{detail.title}</h2>
              <CampaignSchedule
                key={detail.scheduleVersion}
                schedule={liveCampaignSchedule(detail)}
              />
              <button
                type="button"
                className="discovery-outline-button"
                onClick={retry}
              >
                정보 새로고침
              </button>
              {/* 신청·선정 인원을 주기적으로 다시 불러와 '신청 1 / 모집 2명'처럼 보여줍니다. */}
              <RecruitmentProgress
                campaignId={campaignId}
                recruitmentCount={detail.recruitmentCount}
                open={detail.open}
              />
              <section aria-label="서버 신청 조건">
                <h3>신청 조건</h3>
                {state.formError ? (
                  <p role="alert">{state.formError}</p>
                ) : form ? (
                  <>
                    <p>조건 버전 {form.version}</p>
                    <p>
                      체험 유형:{' '}
                      {(form.allowedFulfillmentTypes || [])
                        .map((type) =>
                          type === 'DELIVERY'
                            ? '배송형'
                            : type === 'VISIT'
                              ? '방문형'
                              : '미지원 유형',
                        )
                        .join(', ')}
                    </p>
                    <ul>
                      {(form.questions || []).map((q) => (
                        <li key={q.id}>
                          {q.label} · {q.required ? '필수' : '선택'}
                          {q.type && (
                            <p>
                              답변 형식:{' '}
                              {q.type === 'SINGLE_CHOICE'
                                ? '단일 선택'
                                : q.type === 'TEXTAREA'
                                  ? '장문'
                                  : q.type === 'TEXT'
                                    ? '단답'
                                    : '미지원 유형'}
                            </p>
                          )}
                          {q.maxLength != null && <p>최대 {q.maxLength}자</p>}
                          {q.options?.length > 0 && (
                            <ul>
                              {q.options.map((option) => (
                                <li key={option}>{option}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                    <h4>확인 문서</h4>
                    <ul>
                      {(form.agreements || []).map((d) => (
                        <li key={d.id}>
                          {d.title} · 버전 {d.version} ·{' '}
                          {d.required ? '필수' : '선택'}
                          <details>
                            <summary>문서 내용 확인</summary>
                            <p style={{ whiteSpace: 'pre-wrap' }}>
                              {d.body || '문서 본문이 등록되지 않았습니다.'}
                            </p>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>신청 조건이 준비되지 않았습니다.</p>
                )}
                <CampaignParticipation
                  campaignId={campaignId}
                  form={form}
                  onRefresh={retry}
                />
                {state.formError && (
                  <button
                    className="discovery-outline-button"
                    type="button"
                    onClick={retry}
                  >
                    신청 조건 다시 조회
                  </button>
                )}
              </section>
            </aside>
          </div>
        )}
        {/* 모바일 전용 하단 고정 신청 바입니다. 데스크톱에서는 CSS로 숨깁니다. */}
        {detail && !state.loading && !state.error && (
          <div className="discovery-detail__mobile-cta">
            <span>
              <strong>{recruitmentDeadlineLabel(detail)}</strong>
              모집 {detail.recruitmentCount ?? '-'}명
            </span>
            <button
              type="button"
              onClick={scrollToApply}
              disabled={!detail.open}
            >
              {detail.open ? '신청하기' : '모집 종료'}
            </button>
          </div>
        )}
      </main>
    </DiscoveryLayout>
  )
}
