import { useEffect, useState } from 'react'
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
            <aside className="discovery-detail__summary">
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
              <p>
                모집 인원 {detail.recruitmentCount ?? '미구성'}명 ·{' '}
                {detail.open ? '모집 중' : '모집 종료'}
              </p>
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
      </main>
    </DiscoveryLayout>
  )
}
