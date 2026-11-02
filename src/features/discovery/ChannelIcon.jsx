/**
 * 콘텐츠 채널(인스타그램·블로그·유튜브·클립) 구분 아이콘입니다.
 *
 * - 카드·목록 필터·상세 화면이 같은 모양과 색을 쓰도록 한 곳에서 그립니다.
 * - 각 서비스의 로고를 그대로 옮기지 않고, 색과 단순한 그림(카메라·펜·재생·필름)으로 구분합니다.
 * - 색만으로 구분하지 않도록 기본으로 채널 이름 글자를 함께 보여 줍니다(showLabel=false면 화면 읽기용 이름만 남깁니다).
 */
import { CHANNELS, channelKey } from './channelModel'

// 채널별 단순 그림입니다. 모두 24×24 격자에 흰 선으로 그립니다.
function Glyph({ channel }) {
  const line = {
    fill: 'none',
    stroke: '#fff',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (channel) {
    case 'instagram':
      // 카메라: 몸체와 렌즈
      return (
        <>
          <rect x="5" y="7" width="14" height="11" rx="3" {...line} />
          <circle cx="12" cy="12.5" r="2.8" {...line} />
          <path d="M9 7l1.2-2h3.6L15 7" {...line} />
        </>
      )
    case 'blog':
      // 펜: 글 쓰는 채널
      return (
        <>
          <path d="M6 18l1-4 8.5-8.5 3 3L10 17z" {...line} />
          <path d="M13.5 7.5l3 3" {...line} />
        </>
      )
    case 'youtube':
      // 재생 단추
      return <path d="M9.5 7.5v9l7-4.5z" fill="#fff" />
    case 'clip':
      // 짧은 영상 필름
      return (
        <>
          <rect x="6" y="5" width="12" height="14" rx="2" {...line} />
          <path d="M6 9h12M6 15h12M10.5 11v2l2-1z" {...line} />
        </>
      )
    default:
      // 기타 채널: 링크 모양
      return (
        <path
          d="M10 14l4-4M9 16.5l-1 1a3 3 0 01-4.2-4.2l3-3a3 3 0 014.2 0M15 7.5l1-1a3 3 0 014.2 4.2l-3 3a3 3 0 01-4.2 0"
          {...line}
        />
      )
  }
}

/**
 * 채널 아이콘을 그립니다.
 * @param {string} channel 서버 코드(INSTAGRAM) 또는 화면 이름(인스타그램)
 * @param {boolean} showLabel 아이콘 옆에 채널 이름을 함께 보일지 여부(기본 true)
 * @param {'sm'|'md'} size 작은 아이콘(카드)·보통 아이콘(상세·필터)
 */
export default function ChannelIcon({
  channel,
  showLabel = true,
  size = 'md',
}) {
  const key = channelKey(channel) || (CHANNELS[channel] ? channel : null)
  if (!key) return null
  const label = CHANNELS[key].label
  return (
    <span className={`channel-icon channel-icon--${key} channel-icon--${size}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <Glyph channel={key} />
      </svg>
      {showLabel ? (
        <span className="channel-icon__label">{label}</span>
      ) : (
        <span className="visually-hidden">{label}</span>
      )}
    </span>
  )
}
