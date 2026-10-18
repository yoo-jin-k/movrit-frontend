/**
 * 신청 당시 주소 또는 업체 주소 변경 이력을 기록 확인 클릭 시 조회합니다.
 * 조회 실패와 기록 없음을 구분하며 현재 주소로 과거 기록을 소급 대체하지 않습니다.
 */
import { useEffect, useRef, useState } from 'react'

function Location({ value }) {
  if (!value) return <p>구조화 주소 기록 없음</p>
  return (
    <p>
      {value.venueName}
      <br />
      {value.postalCode && `(${value.postalCode}) `}
      {value.address1} {value.address2}
    </p>
  )
}
function LegacyLocation({ name, address }) {
  return name || address ? (
    <p>
      기존 자유 입력 원문: {name} {address}
    </p>
  ) : null
}

// api는 DB·서버 반영 확인 후 주입합니다. 공개 화면에는 사용하지 않습니다.
export default function VisitEvidence({
  api = null,
  applicationId,
  campaignId,
}) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: false,
  })
  const request = useRef(null)
  useEffect(() => () => request.current?.abort(), [])
  const snapshot = applicationId != null
  if (!api) return null
  // 새 조회 전에 이전 요청을 취소하고 이전 기록을 지웁니다.
  // 요청 오류와 available=false를 구분하므로 권한 오류를 미기록으로 표시하지 않습니다.
  async function load() {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setState({ data: null, loading: true, error: false })
    try {
      const data = snapshot
        ? await api.snapshot(applicationId, controller.signal)
        : await api.history(campaignId, controller.signal)
      if (!controller.signal.aborted)
        setState({ data, loading: false, error: false })
    } catch {
      if (!controller.signal.aborted)
        setState({ data: null, loading: false, error: true })
    }
  }
  const title = snapshot ? '신청 당시 방문 주소' : '방문 주소 변경 이력'
  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      <button type="button" disabled={state.loading} onClick={load}>
        {state.loading
          ? '조회 중…'
          : state.data
            ? '기록 새로고침'
            : '기록 확인'}
      </button>
      {state.error && (
        <p role="alert">주소 기록을 불러오지 못했습니다. 다시 조회해 주세요.</p>
      )}
      {state.data &&
        (snapshot ? (
          state.data.available ? (
            <>
              <p>
                기록 시각: {state.data.capturedAt || '미기록'} · 표시 버전{' '}
                {state.data.presentationVersion}
              </p>
              <Location value={state.data.visitLocation} />
              <LegacyLocation
                name={state.data.legacyPlaceName}
                address={state.data.legacyAddress}
              />
              {state.data.visitGuide && (
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  당시 방문 안내: {state.data.visitGuide}
                </p>
              )}
            </>
          ) : (
            <p>신청 당시 주소 기록이 없습니다.</p>
          )
        ) : state.data.length ? (
          <ol>
            {state.data.map((item) => (
              <li key={item.id}>
                <p>
                  {item.changedAt || '시각 미기록'} · 표시 버전{' '}
                  {item.presentationVersion}
                </p>
                <h4>변경 전</h4>
                <Location value={item.beforeLocation} />
                <LegacyLocation
                  name={item.legacyPlaceName}
                  address={item.legacyAddress}
                />
                <h4>변경 후</h4>
                <Location value={item.afterLocation} />
                <LegacyLocation
                  name={item.legacyAfterPlaceName}
                  address={item.legacyAfterAddress}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p>주소 변경 이력이 없습니다.</p>
        ))}
    </section>
  )
}
