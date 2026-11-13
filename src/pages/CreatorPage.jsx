/**
 * 본인의 채널 지표와 검증 상태를 조회하고 입력한 인스타그램 팔로워 수를 저장합니다.
 * 클라이언트는 숫자 형식을 검증하며 수동 입력값을 공식 채널 인증 결과로 바꾸지 않습니다.
 * 변경 이력(고치기 전 → 고친 후): 안내 상자만 안쪽으로 들여 있고 지표가 점 목록·서버 코드(BLOG)로 보이며
 * 하단 안내·링크에 스타일이 없음 → 카드 폭과 간격을 맞추고 지표를 칸으로 정리, 채널 이름을 한국어로 표시.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CommonLayout from '../components/layout/CommonLayout'
import { readChannelProfile, saveChannelMetric } from '../api/channelProfileApi'
import {
  instagramMetricRequest,
  metricTitle,
  metricVerificationLabel,
} from '../features/membership/channelProfileModel'

export default function CreatorPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [count, setCount] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    readChannelProfile(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setProfile(data)
        const current = data.metrics.find(
          (v) =>
            v.channelType === 'INSTAGRAM' && v.metricType === 'FOLLOWER_COUNT',
        )
        setCount(current ? String(current.value) : '')
        setError('')
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('채널 지표를 불러오지 못했습니다. 다시 시도해 주세요.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])
  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    setError('')
    setNotice('')
    try {
      const request = instagramMetricRequest(count)
      setSaving(true)
      const data = await saveChannelMetric(request)
      setProfile(data)
      setNotice(
        '저장했습니다. 직접 입력한 지표는 확인 전까지 미확인 상태입니다.',
      )
    } catch {
      setError(
        '저장 결과를 확인하지 못했습니다. 다시 불러온 후 저장 여부를 확인해 주세요.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <CommonLayout title="활동 프로필" className="creator-profile">
      <aside className="creator-profile__note">
        <strong>채널 지표는 캠페인별 참여 조건을 확인할 때 사용합니다.</strong>
        <p>
          추가 지표 조건이 없는 캠페인은 채널 등록 없이 신청할 수 있습니다.
          이메일 인증과 신청서 확인은 필요합니다.
        </p>
        <p>
          외부 채널의 수치를 자동으로 수집하지 않습니다. 등급은 기준 확정 전까지
          미산정으로 표시합니다.
        </p>
      </aside>
      {loading ? (
        <p role="status">채널 지표를 불러오고 있습니다.</p>
      ) : (
        <>
          {profile && (
            <section
              className="creator-profile__card"
              aria-labelledby="creator-metrics-title"
            >
              <h2 id="creator-metrics-title">내 채널 지표</h2>
              {profile.metrics.length === 0 ? (
                <p className="creator-profile__empty">
                  등록된 채널 지표가 없습니다. 아래에서 인스타그램 팔로워 수를
                  입력할 수 있습니다.
                </p>
              ) : (
                <ul className="creator-profile__metrics">
                  {profile.metrics.map((metric) => (
                    <li key={metric.id}>
                      <span>{metricTitle(metric)}</span>
                      <strong>{metric.value.toLocaleString('ko-KR')}</strong>
                      <small>
                        {metricVerificationLabel(metric.verificationStatus)} ·
                        등급 미산정
                      </small>
                      {metric.measurementPeriod && (
                        <small>
                          집계기간:{' '}
                          {metric.measurementPeriod === 'RECENT_4_DAYS'
                            ? '최근 4일 평균(오늘 제외)'
                            : metric.measurementPeriod}
                        </small>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {profile && (
            <form className="creator-profile__card" onSubmit={submit}>
              <h2>인스타그램 팔로워 수</h2>
              <p className="creator-profile__help">
                저장하거나 수정하면 지표는 미확인 상태가 됩니다. 기존 확인
                상태도 다시 확인이 필요합니다.
              </p>
              <label className="creator-profile__field">
                팔로워 수
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  inputMode="numeric"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </label>
              <button
                className="creator-profile__button"
                type="submit"
                disabled={saving}
              >
                {saving ? '저장 중...' : '지표 저장'}
              </button>
            </form>
          )}
          {/* UI점검: localhost:5174/creator/profile - 프론트 수정해야함 */}
          {/* 카드 정렬·지표 표시는 정리했고, 네이버 방문자 입력 안내·다른 참여자 화면(UserPage) 틀 적용 여부는 정해지지 않았습니다. */}
          <p className="creator-profile__help">
            네이버 방문자 지표 입력은 집계기간 기준 확정 후 안내합니다.
          </p>
        </>
      )}
      {notice && (
        <p role="status" className="creator-profile__notice">
          {notice}
        </p>
      )}
      {error && (
        <div className="creator-profile__error">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="creator-profile__button is-secondary"
            disabled={loading || saving}
            onClick={() => {
              setLoading(true)
              setAttempt((v) => v + 1)
            }}
          >
            다시 불러오기
          </button>
        </div>
      )}
      <Link className="creator-profile__link" to="/mypage/campaigns">
        내 캠페인 신청 보기 ›
      </Link>
    </CommonLayout>
  )
}
