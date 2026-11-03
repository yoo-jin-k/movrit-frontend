/**
 * 콘텐츠 채널(인스타그램·블로그·유튜브·클립) 구분 아이콘입니다.
 *
 * - 카드·목록 필터·상세 화면이 같은 모양과 색을 쓰도록 한 곳에서 그립니다.
 * - 인스타그램·유튜브·네이버(블로그)는 널리 쓰는 공개 아이콘 묶음 Simple Icons(CC0)의 모양을 씁니다.
 *   클립과 기타 채널은 해당 아이콘이 없어 단순한 그림(필름·링크)으로 그립니다.
 * - 색만으로 구분하지 않도록 기본으로 채널 이름 글자를 함께 보여 줍니다(showLabel=false면 화면 읽기용 이름만 남깁니다).
 */
import { siInstagram, siNaver, siYoutube } from 'simple-icons'
import { CHANNELS, channelKey } from './channelModel'

// 공개 아이콘 묶음에서 가져온 채널 모양입니다(24×24, 흰색으로 채웁니다).
const BRAND_PATHS = {
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  blog: siNaver.path,
}

// 채널 그림입니다. 공개 아이콘이 있으면 그 모양을, 없으면 흰 선으로 그린 단순한 그림을 씁니다.
function Glyph({ channel }) {
  if (BRAND_PATHS[channel]) return <path d={BRAND_PATHS[channel]} fill="#fff" />
  const line = {
    fill: 'none',
    stroke: '#fff',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (channel) {
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
