import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CommonLayout from '../components/layout/CommonLayout'
import { readChannelProfile, saveChannelMetric } from '../api/channelProfileApi'
import {
  instagramMetricRequest,
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
      setError('저장 결과를 확인하지 못했습니다. 다시 불러온 후 저장 여부를 확인해 주세요.')
    } finally {
      setSaving(false)
    }
  }
  return (
    <CommonLayout title="활동 프로필">
      <aside className="common-role-note">
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
            <section className="common-card" aria-label="내 채널 지표">
              <h2>내 채널 지표</h2>
              {profile.metrics.length === 0 ? (
                <p>등록된 채널 지표가 없습니다. · 등급 미산정</p>
              ) : (
                <ul>
                  {profile.metrics.map((metric) => (
                    <li key={metric.id}>
                      <strong>
                        {{
                          INSTAGRAM: '인스타그램',
                          NAVER_BLOG: '네이버 블로그',
                        }[metric.channelType] || metric.channelType}{' '}
                        ·{' '}
                        {{
                          FOLLOWER_COUNT: '팔로워 수',
                          VISITOR_COUNT: '방문자 수',
                        }[metric.metricType] || metric.metricType}
                      </strong>
                      <p>
                        {metric.value.toLocaleString('ko-KR')} ·{' '}
                        {metricVerificationLabel(metric.verificationStatus)} ·
                        등급 미산정
                      </p>
                      {metric.measurementPeriod && (
                        <p>집계기간: {metric.measurementPeriod}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {profile && (
            <form className="common-card common-signup-form" onSubmit={submit}>
              <h2>인스타그램 팔로워 수</h2>
              <p>
                저장하거나 수정하면 지표는 미확인 상태가 됩니다. 기존 확인
                상태도 다시 확인이 필요합니다.
              </p>
              <label className="common-field">
                팔로워 수
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </label>
              <button className="common-button" type="submit" disabled={saving}>
                {saving ? '저장 중...' : '지표 저장'}
              </button>
            </form>
          )}
          <p>네이버 방문자 지표 입력은 집계기간 기준 확정 후 안내합니다.</p>
        </>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <div>
          <p role="alert">{error}</p>
          <button
            type="button"
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
      <Link to="/mypage/campaigns">내 캠페인 신청</Link>
    </CommonLayout>
  )
}
