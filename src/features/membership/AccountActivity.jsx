/** 계정 카드를 열 때만 본인 활동을 조회하며 실패와 실제 0건을 구분합니다. */
import ChannelIcon from './ChannelIcon'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { readChannelProfile } from '../../api/channelProfileApi'
import { readMyCampaignContents } from '../../api/myCampaignContentApi'
const channels = [
  ['NAVER_BLOG', '블로그', 'B'],
  ['INSTAGRAM', '인스타그램', 'I'],
  ['YOUTUBE', '유튜브', 'Y'],
  ['CLIP', '클립', 'C'],
]
const count = (result) =>
  result?.status === 'fulfilled' && Array.isArray(result.value)
    ? result.value.length
    : null
export default function AccountActivity({ onClose }) {
  const [state, setState] = useState(null),
    [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    Promise.allSettled([
      readChannelProfile(controller.signal),
      api
        .get('/campaigns/applications/mine', {
          signal: controller.signal,
          timeout: 15000,
        })
        .then((r) => {
          if (!Array.isArray(r.data)) throw new Error()
          return r.data
        }),
      readMyCampaignContents(controller.signal),
    ]).then((values) => {
      if (active) setState(values)
    })
    return () => {
      active = false
      controller.abort()
    }
  }, [attempt])
  const metrics =
    state?.[0]?.status === 'fulfilled' ? state[0].value.metrics : null
  const apps = state?.[1]?.status === 'fulfilled' ? state[1].value : null
  const metricHas = (type) =>
    metrics?.some(
      (m) =>
        m.channelType === type ||
        (type === 'NAVER_BLOG' && m.channelType === 'BLOG'),
    )
  return (
    <>
      <section className="account-card-section">
        <Link
          className="account-card-heading"
          to="/creator/profile"
          onClick={onClose}
        >
          채널 정보 <span>›</span>
        </Link>
        <div className="account-channel-grid">
          {channels.map(([type, label]) => (
            <Link to="/creator/profile" onClick={onClose} key={type}>
              <span
                className={
                  'account-channel-icon ' +
                  (metricHas(type) ? 'is-recorded' : '')
                }
              >
                <ChannelIcon type={type} />
              </span>
              <strong>{label}</strong>
              <small>
                {!state
                  ? '확인 중'
                  : metrics === null
                    ? '확인 필요'
                    : metricHas(type)
                      ? '지표 등록'
                      : '미등록'}
              </small>
            </Link>
          ))}
        </div>
        <p className="account-card-caption">
          등록한 채널 지표입니다. SNS 계정 연결 여부와는 다릅니다.
        </p>
      </section>
      <section className="account-card-section">
        <Link
          className="account-card-heading"
          to="/mypage/campaigns"
          onClick={onClose}
        >
          나의 캠페인 <span>›</span>
        </Link>
        <div className="account-campaign-summary">
          {!state ? (
            <p role="status">캠페인을 확인하고 있습니다.</p>
          ) : apps === null ? (
            <p>캠페인을 불러오지 못했습니다.</p>
          ) : !apps.length ? (
            <>
              <strong>아직 신청한 캠페인이 없습니다.</strong>
              <p>나에게 맞는 캠페인을 찾아보세요.</p>
              <Link
                className="account-card-browse"
                to="/home"
                onClick={onClose}
              >
                캠페인 둘러보기 ›
              </Link>
            </>
          ) : (
            <>
              <div className="account-summary-counts">
                {[
                  ['신청', ['SUBMITTED']],
                  ['선정', ['SELECTED']],
                  [
                    '진행',
                    ['ACTIVE', 'CONTENT_SUBMITTED', 'REVISION_REQUESTED'],
                  ],
                  ['완료', ['COMPLETED']],
                ].map(([label, statuses]) => (
                  <Link key={label} to="/mypage/campaigns" onClick={onClose}>
                    <strong>
                      {apps.filter((a) => statuses.includes(a.status)).length}
                    </strong>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
              <Link to="/mypage/campaigns" onClick={onClose}>
                전체 신청 {apps.length}건 보기 ›
              </Link>
            </>
          )}
        </div>
      </section>
      <section className="account-card-section">
        <h3 className="account-card-heading">나의 포인트</h3>
        <div className="account-points">
          <strong>준비 중</strong>
          <span>포인트 서비스는 아직 제공되지 않습니다.</span>
        </div>
      </section>
      <div className="account-card-shortcuts">
        <div className="account-shortcut-pending">
          <strong>관심 목록</strong>
          <span>준비 중</span>
        </div>
        <Link to="/mypage/contents" onClick={onClose}>
          등록 콘텐츠{' '}
          <span>{!state ? '…' : (count(state[2]) ?? '확인 필요')} ›</span>
        </Link>
      </div>
      {state?.some((r) => r.status === 'rejected') && (
        <button
          className="account-retry"
          onClick={() => {
            setState(null)
            setAttempt((a) => a + 1)
          }}
        >
          활동 정보 다시 확인
        </button>
      )}
    </>
  )
}
