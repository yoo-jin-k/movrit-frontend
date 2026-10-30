/**
 * 업체 승인과 소유 목록을 확인한 뒤 본문·조건·신청 폼·미디어를 한 편집 흐름으로 구성합니다.
 * 파일 업로드와 configured 저장을 구분하고 최신 버전으로 저장한 뒤 관련 데이터를 다시 조회합니다.
 * 충돌·응답 불명확 시 자동 재전송하지 않고 최신 정보 확인 전까지 편집 명령을 잠급니다.
 */
import VisitEvidence from './VisitEvidence'
import { liveCampaignVisitEvidenceApi } from '../../api/liveCampaignVisitEvidenceApi'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSellerCampaigns } from '../../api/collaborationApi'
import { getMyPreorders } from '../../api/preorderApi'
import { getMyBrands } from '../../api/brandApi'
import { getMySellerProfile } from '../../api/sellerApi'
import { readCampaign, readCampaignForm } from '../../api/campaignReadApi'
import { readCampaignRequirement } from '../../api/campaignRequirementApi'
import { saveConfiguredCampaign } from '../../api/configuredCampaignApi'
import { campaignRequirementSummary } from '../discovery/eligibilityModel'
import ApplicationFormFields from './ApplicationFormFields'
import {
  emptyApplicationForm,
  applicationFormRequest,
} from './applicationFormModel'
import CampaignFields from './CampaignFields'
import RequirementFields from './RequirementFields'
import { emptyRequirement, requirementForm } from './requirementModel'
import { emptyCampaign, configuredCampaignPayload } from './campaignEditorModel'
import './sellerCampaigns.css'
import CampaignFormPreview from './CampaignFormPreview'
import CampaignMediaFields from './CampaignMediaFields'
import { emptyCampaignMediaDraft } from './campaignMediaDraft'
import {
  changeMediaFulfillment,
  validateManagedPresentation,
  validatePendingMedia,
} from './campaignMediaContract'
import { readMediaSession, prepareMediaSave } from './campaignMediaWorkflow'

// 신청 폼 조회의 404만 미구성으로 취급합니다. 권한 오류나 통신 장애는 정상 빈 폼으로 바꾸지 않습니다.
async function readOptionalForm(id) {
  try {
    return await readCampaignForm(id)
  } catch (error) {
    if (error.response?.status === 404) return null
    throw error
  }
}
export default function SellerCampaignManager({
  initialCampaignId,
  dashboard = false,
  mediaApi = null,
}) {
  // 서버 반영 확인 뒤에만 mediaApi를 주입합니다. 기본 경로는 요청하지 않습니다.
  const [mediaSession, setMediaSession] = useState(() => ({
    managed: null,
    draft: emptyCampaignMediaDraft(),
  }))
  const mediaRead = useCallback(
    (id) => readMediaSession(mediaApi, id),
    [mediaApi],
  )
  const submitting = useRef(false)
  const [preview, setPreview] = useState(false)
  const [state, setState] = useState({
    loading: true,
    campaigns: [],
    brands: [],
    preorders: [],
    error: '',
  })
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm)
  const [savedForm, setSavedForm] = useState(null)
  const [formDirty, setFormDirty] = useState(true)
  const [formConfigured, setFormConfigured] = useState(false)
  const [form, setForm] = useState(emptyCampaign)
  const [condition, setCondition] = useState(emptyRequirement)
  const [original, setOriginal] = useState(null)
  const [activeRequirement, setActiveRequirement] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [mustReload, setMustReload] = useState(false)
  useEffect(() => {
    let active = true
    getMySellerProfile()
      .then((profile) => {
        if (profile.status !== 'APPROVED')
          throw new Error('승인된 업체만 캠페인을 관리할 수 있습니다.')
        return Promise.all([
          getSellerCampaigns(),
          getMyPreorders(),
          getMyBrands(),
        ])
      })
      .then(async ([campaigns, preorders, brands]) => {
        // 운영 중인 브랜드가 하나뿐이면 새 캠페인의 운영 브랜드로 미리 선택해 둡니다.
        if (!initialCampaignId && brands.length === 1 && active)
          setForm((current) =>
            current.brandId ? current : { ...current, brandId: brands[0].id },
          )
        // URL의 ID만으로 편집하지 않고 판매자 소유 목록과 먼저 대조합니다.
        if (initialCampaignId) {
          if (
            !campaigns.some(
              (item) => String(item.id) === String(initialCampaignId),
            )
          )
            throw new Error('이 캠페인을 수정할 권한이 없습니다.')
          const [detail, requirement, existingForm, media] = await Promise.all([
            readCampaign(initialCampaignId),
            readCampaignRequirement(initialCampaignId),
            readOptionalForm(initialCampaignId),
            mediaRead(initialCampaignId),
          ])
          if (!active) return
          if (media) setMediaSession(media)
          setOriginal(detail)
          setForm(detail)
          setSavedForm(existingForm)
          setApplicationForm(existingForm || emptyApplicationForm())
          setFormConfigured(Boolean(existingForm))
          setFormDirty(!existingForm)
          setCondition(requirementForm(requirement))
          setActiveRequirement(requirement)
        }
        if (active)
          setState({ loading: false, campaigns, preorders, brands, error: '' })
      })
      .catch(() => {
        if (active)
          setState({
            loading: false,
            campaigns: [],
            brands: [],
            preorders: [],
            error:
              '캠페인 관리 정보를 불러오지 못했습니다. 업체 승인 상태와 접근 권한을 확인해 주세요.',
          })
      })
    return () => {
      active = false
    }
  }, [attempt, initialCampaignId, mediaRead])
  // 본문·조건·신청 폼·미디어를 모두 읽은 뒤 편집 상태를 교체합니다.
  // 어느 조회든 실패하면 최신 상태를 확보한 것으로 간주하지 않습니다.
  const edit = async (campaignId) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const [detail, requirement, existingForm, media] = await Promise.all([
        readCampaign(campaignId),
        readCampaignRequirement(campaignId),
        readOptionalForm(campaignId),
        mediaRead(campaignId),
      ])
      if (media) setMediaSession(media)
      setOriginal(detail)
      setForm(detail)
      setSavedForm(existingForm)
      setApplicationForm(existingForm || emptyApplicationForm())
      setFormConfigured(Boolean(existingForm))
      setFormDirty(!existingForm)
      setCondition(requirementForm(requirement))
      setActiveRequirement(requirement)
      setMustReload(false)
    } catch {
      setError('편집 정보를 불러오지 못했습니다. 다시 시도해 주세요.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  // 새 캠페인 작성 시 기존 ID·버전·신청 폼·미디어 초안을 함께 비워 다른 캠페인의 참조가 섞이지 않게 합니다.
  const reset = () => {
    setMediaSession({ managed: null, draft: emptyCampaignMediaDraft() })
    setApplicationForm(emptyApplicationForm())
    setSavedForm(null)
    setFormDirty(true)
    setFormConfigured(false)
    setOriginal(null)
    setForm(emptyCampaign())
    setCondition(emptyRequirement())
    setActiveRequirement(undefined)
    setError('')
    setNotice('')
    setMustReload(false)
  }
  // 로컬 검증은 네트워크 요청 전에 수행합니다. 이후 실패는 서버 반영 여부가 불명확할 수 있으므로 재조회 잠금을 사용합니다.
  const submit = async (event) => {
    event.preventDefault()
    if (busy || mustReload || submitting.current) return
    let payload
    try {
      if (mediaApi)
        validatePendingMedia(mediaSession.draft, {
          editing: Boolean(original),
          originalHadRepresentative: Boolean(
            mediaSession.managed?.representativeImage ||
              mediaSession.managed?.legacyRepresentativeImageUrl,
          ),
          originalFulfillmentTypes: savedForm?.allowedFulfillmentTypes || [],
          originalVisitLocation: mediaSession.managed?.visitLocation,
          fulfillmentTypes: applicationForm.allowedFulfillmentTypes,
        })
      payload = configuredCampaignPayload(form, condition, original)
      if (formDirty || !original) {
        payload.applicationForm = applicationFormRequest(applicationForm)
        if (original)
          payload.expectedApplicationFormVersion = savedForm?.version ?? null
      }
    } catch (failure) {
      setError(failure.message)
      return
    }
    submitting.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      // 새 파일을 업로드해 자산 ID를 얻은 뒤 configured 요청에 이미지 참조를 포함합니다.
      // 이 단계의 파일 업로드는 뒤의 본문·신청 폼 저장과 별도 요청입니다.
      payload = await prepareMediaSave(
        mediaApi,
        payload,
        mediaSession,
        {
          editing: Boolean(original),
          originalFulfillmentTypes: savedForm?.allowedFulfillmentTypes || [],
        },
        (draft) => setMediaSession((current) => ({ ...current, draft })),
      )
      // 서버 저장 응답만으로 화면의 최신값을 확정하지 않고 관련 조회가 모두 성공한 뒤 완료 안내를 표시합니다.
      const result = await saveConfiguredCampaign(payload, original?.id)
      if (mediaApi) validateManagedPresentation(result.presentation)
      const [detail, requirement, campaigns, confirmedForm, media] =
        await Promise.all([
          readCampaign(result.campaign.id),
          readCampaignRequirement(result.campaign.id),
          getSellerCampaigns(),
          readCampaignForm(result.campaign.id),
          mediaRead(result.campaign.id),
        ])
      if (media) setMediaSession(media)
      setOriginal(detail)
      setForm(detail)
      setCondition(requirementForm(requirement))
      setActiveRequirement(requirement)
      setSavedForm(confirmedForm)
      setApplicationForm(confirmedForm)
      setFormDirty(false)
      setFormConfigured(true)
      setState((current) => ({ ...current, campaigns }))
      setNotice(
        mediaApi
          ? '캠페인·신청서·이미지·방문 정보를 저장하고 다시 확인했습니다.'
          : '캠페인·참여 조건·신청서를 저장하고 다시 확인했습니다.',
      )
    } catch (failure) {
      setMustReload(true)
      setError(
        failure.response?.status === 409
          ? '다른 변경 사항이 있습니다. 최신 내용을 다시 불러온 후 수정해 주세요.'
          : failure.response?.status === 403
            ? '이 캠페인을 수정할 권한이 없습니다.'
            : '저장 결과를 확인하지 못했습니다. 목록을 새로고침해 저장 여부를 확인해 주세요.',
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  return (
    <section
      className={`seller-campaign-manager${dashboard ? ' business-editor' : ''}`}
      aria-label="브랜드 캠페인 관리"
    >
      {!dashboard && <h2>브랜드 캠페인 작성·수정</h2>}
      {state.loading ? (
        <p role="status">캠페인을 불러오고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : (
        <>
          <form onSubmit={submit}>
            <div className="business-editor-fields">
              <h3
                className={dashboard ? 'business-visually-hidden' : undefined}
              >
                {original ? `캠페인 수정: ${original.title}` : '새 캠페인 작성'}
              </h3>
              <CampaignFields
                value={form}
                onChange={setForm}
                brands={state.brands}
                preorders={state.preorders.filter(
                  (item) =>
                    original ||
                    !state.campaigns.some((c) => c.preorderId === item.id),
                )}
                editing={Boolean(original)}
                disabled={busy || mustReload}
              />
              <RequirementFields
                value={condition}
                onChange={setCondition}
                disabled={busy || mustReload}
              />
              <p role="status">
                {!formConfigured
                  ? '신청 준비 미완료: 참여 방식과 필요한 질문·동의 문서를 설정하고 저장해 주세요.'
                  : formDirty
                    ? '신청서에 저장하지 않은 변경 사항이 있습니다.'
                    : `신청서 저장됨 · 버전 ${savedForm.version}`}
              </p>
              <ApplicationFormFields
                value={applicationForm}
                onChange={(value) => {
                  if (mediaApi)
                    setMediaSession((current) => ({
                      ...current,
                      draft: changeMediaFulfillment(
                        current.draft,
                        applicationForm.allowedFulfillmentTypes,
                        value.allowedFulfillmentTypes,
                      ),
                    }))
                  setApplicationForm(value)
                  setFormDirty(true)
                }}
                disabled={busy || mustReload}
              />
              {mediaApi && (
                <CampaignMediaFields
                  value={mediaSession.draft}
                  onChange={(draft) =>
                    setMediaSession((current) => ({ ...current, draft }))
                  }
                  fulfillmentTypes={applicationForm.allowedFulfillmentTypes}
                  disabled={busy || mustReload}
                />
              )}
            </div>
            <aside className="business-editor-summary">
              {original && (
                <VisitEvidence
                  key={`visit-history-${original.id}-${mediaSession.managed?.version ?? 0}`}
                  api={liveCampaignVisitEvidenceApi}
                  campaignId={original.id}
                />
              )}
              {dashboard && (
                <>
                  <h2>작성 상태</h2>
                  <dl className="business-details">
                    <div>
                      <dt>캠페인 본문</dt>
                      <dd>{form.title?.trim() ? '입력 중' : '미입력'}</dd>
                    </div>
                    <div>
                      <dt>모집 일정</dt>
                      <dd>
                        {form.startAt && form.endAt ? '입력 중' : '미입력'}
                      </dd>
                    </div>
                    <div>
                      <dt>추가 질문</dt>
                      <dd>
                        {applicationForm.questions.length
                          ? `${applicationForm.questions.length}개`
                          : '질문 없음'}
                      </dd>
                    </div>
                    <div>
                      <dt>동의문 정책</dt>
                      <dd>
                        <span className="business-badge">확인 필요</span>
                      </dd>
                    </div>
                  </dl>
                </>
              )}
              {original && (
                <p>
                  현재 저장된 조건:{' '}
                  {campaignRequirementSummary(activeRequirement)}
                </p>
              )}
              <p>저장된 조건은 이 캠페인의 신규 신청에 즉시 적용됩니다.</p>
              <p>
                조건 변경만으로 기존 신청 내역을 삭제하거나 자동 탈락 처리하지
                않습니다. 기존 신청에 대한 재판정 정책은 별도로 안내합니다.
              </p>
              {error && <p role="alert">{error}</p>}
              {notice && <p role="status">{notice}</p>}
              <div className="seller-campaign-actions">
                {dashboard && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPreview(true)}
                  >
                    사용자 폼 미리보기
                  </button>
                )}
                <button type="submit" disabled={busy || mustReload}>
                  {busy
                    ? '처리 중...'
                    : original
                      ? '캠페인 변경 저장'
                      : '캠페인 등록'}
                </button>
                {original && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => edit(original.id)}
                  >
                    최신 내용 다시 불러오기
                  </button>
                )}
                {original && (
                  <button type="button" disabled={busy} onClick={reset}>
                    새 캠페인 작성
                  </button>
                )}
              </div>
            </aside>
          </form>
          {!dashboard && (
            <>
              <h3>내 캠페인</h3>
              {state.campaigns.length === 0 ? (
                <p>등록한 캠페인이 없습니다.</p>
              ) : (
                state.campaigns.map((campaign) => (
                  <article key={campaign.id}>
                    <h4>{campaign.title}</h4>
                    <p>
                      {campaign.brandName} · {campaign.preorderTitle}
                    </p>
                    <div className="seller-campaign-actions">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => edit(campaign.id)}
                      >
                        캠페인 #{campaign.id} 수정
                      </button>
                      <Link to={`/campaign/${campaign.id}`}>
                        사용자 상세 보기
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </>
          )}
        </>
      )}
      {preview && (
        <CampaignFormPreview
          campaign={form}
          applicationForm={applicationForm}
          condition={condition}
          onClose={() => setPreview(false)}
        />
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setState((current) => ({ ...current, loading: true }))
          setAttempt((v) => v + 1)
        }}
      >
        목록 새로고침
      </button>
    </section>
  )
}
