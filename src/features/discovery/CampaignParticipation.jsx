/**
 * 로그인 상태·회원 정보·이메일 확인·캠페인 자격 응답을 함께 확인합니다.
 * 최신 서버 판정과 신청 폼 버전이 맞을 때 실제 폼을 열며 이메일 소유 확인을 실명 인증으로 취급하지 않습니다.
 */
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getMyInfo } from '../../api/authApi'
import {
  requestEmailCode,
  confirmEmailCode,
  readEmailStatus,
} from '../../api/emailVerificationApi'
import { CAMPAIGN_APPLIED_EVENT } from '../../api/campaignReadApi'
import EmailVerificationPanel from './EmailVerificationPanel'
import LiveApplicationForm from './LiveApplicationForm'
import VisitorCheckPanel from './VisitorCheckPanel'
import { readCampaignEligibility } from '../../api/campaignParticipationApi'
import {
  applicationAvailable,
  eligibilityReason,
  campaignRequirementSummary,
  isVisitorRequirement,
  metricEvaluationSummary,
} from './eligibilityModel'
import { participationError } from './participationError'

// 이메일 소유 상태는 매번 서버에서 확인하고 실명 인증과 분리해서 안내합니다.
export default function CampaignParticipation({ campaignId, form, onRefresh }) {
  const location = useLocation()
  const loggedIn = Boolean(sessionStorage.getItem('accessToken'))
  const [state, setState] = useState({
    loading: loggedIn,
    email: '',
    verified: false,
    error: '',
  })
  const [submitted, setSubmitted] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [visitorCheck, setVisitorCheck] = useState(null)
  useEffect(() => {
    if (!loggedIn) return
    const controller = new AbortController()
    Promise.allSettled([
      getMyInfo(),
      readEmailStatus(controller.signal),
      readCampaignEligibility(campaignId, controller.signal),
    ]).then(([member, status, eligibility]) => {
      if (controller.signal.aborted) return
      setState({
        loading: false,
        email: member.status === 'fulfilled' ? member.value.email : '',
        verified: status.status === 'fulfilled' && status.value.emailVerified,
        error:
          member.status === 'rejected' || status.status === 'rejected'
            ? '이메일 인증 상태를 불러오지 못했습니다.'
            : '',
        eligibility:
          eligibility.status === 'fulfilled' ? eligibility.value : null,
        eligibilityError:
          eligibility.status === 'rejected'
            ? participationError(
                eligibility.reason,
                '신청 가능 상태를 불러오지 못했습니다.',
              )
            : '',
      })
    })
    return () => controller.abort()
  }, [loggedIn, attempt, campaignId])
  const reload = () => {
    setState((old) => ({ ...old, loading: true }))
    setAttempt((value) => value + 1)
  }
  if (!loggedIn)
    return (
      <p className="discovery-info">
        <Link to="/login" state={{ returnTo: location.pathname }}>
          로그인
        </Link>{' '}
        후 이메일 인증과 신청 조건을 확인해 주세요.
      </p>
    )
  if (state.loading) return <p role="status">참여 조건을 확인하고 있습니다.</p>
  if (state.error)
    return (
      <div>
        <p role="alert">{state.error}</p>
        <button type="button" onClick={reload}>
          인증 상태 다시 확인
        </button>
      </div>
    )
  return (
    <>
      <EmailVerificationPanel
        key={state.email}
        email={state.email}
        verified={state.verified}
        requestCode={requestEmailCode}
        confirmCode={confirmEmailCode}
        onVerified={reload}
      />
      {submitted && (
        <p role="status">신청이 접수되었습니다. 신청 번호 {submitted.id}</p>
      )}
      {state.eligibilityError && <p role="alert">{state.eligibilityError}</p>}
      {state.eligibility && (
        <section aria-label="신청 가능 상태">
          <h3>참여 조건</h3>
          <p>
            {campaignRequirementSummary(state.eligibility.campaignRequirement)}
          </p>
          <p>{metricEvaluationSummary(state.eligibility.metricEvaluation)}</p>
          {isVisitorRequirement(state.eligibility.campaignRequirement) ? (
            <VisitorCheckPanel
              eligibility={state.eligibility}
              result={visitorCheck}
              onChecked={(checked) => {
                setVisitorCheck(checked)
                reload()
              }}
            />
          ) : (
            <Link to="/creator/profile">내 채널 지표 확인</Link>
          )}
          <p>
            로그인, 이메일 인증, 모집기간 및 신청서 확인은 별도로 필요합니다.
          </p>
          <ul>
            {state.eligibility.blockingReasons.map((reason) => (
              <li key={reason}>{eligibilityReason(reason)}</li>
            ))}
          </ul>
          {form && state.eligibility.formVersion !== form.version && (
            <p role="alert">
              신청 조건이 변경되었습니다. 최신 조건을 다시 확인해 주세요.
            </p>
          )}
        </section>
      )}
      {!submitted && applicationAvailable(state.eligibility, form) ? (
        <LiveApplicationForm
          key={`${form.version}:${state.eligibility.campaignRequirement?.id ?? 'none'}:${state.eligibility.campaignRequirement?.version ?? 'none'}`}
          campaignId={campaignId}
          form={form}
          requirement={state.eligibility.campaignRequirement}
          onRefresh={onRefresh}
          onSubmitted={(result) => {
            setSubmitted(result)
            reload()
            // 같은 화면의 모집 현황(신청 n / 모집 m명)이 바로 늘어나도록 알립니다.
            window.dispatchEvent(
              new CustomEvent(CAMPAIGN_APPLIED_EVENT, {
                detail: { campaignId },
              }),
            )
          }}
        />
      ) : (
        <button type="button" className="discovery-primary-button" disabled>
          {submitted || state.eligibility?.alreadyApplied
            ? '신청 완료'
            : '현재 신청할 수 없습니다'}
        </button>
      )}
      <button
        type="button"
        className="discovery-outline-button"
        onClick={onRefresh}
      >
        최신 참여 조건 확인
      </button>
    </>
  )
}
