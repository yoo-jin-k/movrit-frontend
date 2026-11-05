/**
 * 네이버 블로그 일평균 방문자 조건이 있는 캠페인에서만 보이는 '방문자 수 확인' 영역입니다.
 * 참여자가 '지금 확인'을 누르면 서버가 블로그 방문자 위젯을 읽어 최근 4일 평균(오늘 제외)을 기록하고, 신청 가능 상태를 다시 불러옵니다.
 * 확인한 값은 신청할 때 신청 기록에 남으므로, 신청 뒤에는 위젯을 다시 꺼도 됩니다.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { checkNaverBlogVisitors } from '../../api/channelProfileApi'
import { participationError } from './participationError'

const NEEDS_CHECK = [
  'CHANNEL_METRIC_REQUIRED',
  'CHANNEL_METRIC_UNVERIFIED',
  'CHANNEL_METRIC_STALE',
  'CHANNEL_METRIC_BELOW_MINIMUM',
]

// 확인 결과(result)는 신청 가능 상태를 다시 불러와도 남도록 부모가 보관합니다.
export default function VisitorCheckPanel({ eligibility, result, onChecked }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const needsCheck = eligibility.blockingReasons.some((reason) =>
    NEEDS_CHECK.includes(reason),
  )
  const minimum = eligibility.campaignRequirement.minimumValue
  const check = async () => {
    setBusy(true)
    setError('')
    try {
      onChecked(await checkNaverBlogVisitors())
    } catch (failure) {
      setError(participationError(failure, '방문자 수를 확인하지 못했습니다.'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="visitor-check" aria-label="블로그 방문자 수 확인">
      <h4>블로그 방문자 수 확인</h4>
      <p>
        이 캠페인은 네이버 블로그 일평균 방문자{' '}
        {minimum.toLocaleString('ko-KR')}명 이상이 조건입니다. 블로그 방문자
        위젯의 최근 4일(오늘 제외) 평균으로 확인하며, 확인한 값은 이 캠페인
        업체에만 공개됩니다.
      </p>
      <ol>
        <li>
          <Link to="/settings">설정</Link>에서 네이버 블로그를 소개글 코드로
          연결합니다.
        </li>
        <li>
          블로그 관리 → 꾸미기 설정 → 레이아웃·위젯 설정에서
          &lsquo;방문자&rsquo; 위젯을 켭니다.
        </li>
        <li>
          아래 &lsquo;지금 확인&rsquo;을 누른 뒤 신청합니다. 신청 후에는 위젯을
          다시 꺼도 됩니다.
        </li>
      </ol>
      {result && (
        <p role="status">
          최근 {result.days}일 평균{' '}
          {result.averageVisitors.toLocaleString('ko-KR')}
          명으로 확인되었습니다.
          {result.averageVisitors < minimum &&
            ' 이 캠페인 기준에는 미달합니다.'}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {(needsCheck || result) && (
        <button
          type="button"
          className="discovery-outline-button"
          onClick={check}
          disabled={busy}
        >
          {busy ? '확인하고 있습니다' : '지금 확인'}
        </button>
      )}
    </section>
  )
}
