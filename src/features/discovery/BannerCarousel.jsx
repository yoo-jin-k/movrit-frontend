/**
 * 정해진 배너를 페이지 단위로 순환하며 정지·마우스 위치·모션 감소 설정을 반영합니다.
 * 배너 문구는 이미지가 아닌 코드에 두고 타이머는 효과 정리 시 해제합니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// 문구는 이미지에 합성하지 않고 코드로 관리하여 다른 브랜드 문구가 남지 않도록 합니다.
const BANNERS = [
  [
    '일상에 새로운 취향을',
    '/category/제품',
    'living',
    '좋아하는 제품을 MOVRIT에서 만나보세요.',
  ],
  [
    '특별한 하루의 시작',
    '/category/지역?category=숙박',
    'travel',
    '머물고 싶은 공간, 새로운 여행의 경험',
  ],
  [
    '오늘의 맛있는 발견',
    '/category/지역?category=맛집',
    'dining',
    'MOVRIT과 함께 우리 동네 맛집을 찾아보세요.',
  ],
  [
    '취향을 담은 나의 공간',
    '/category/제품?category=생활',
    'living',
    '생활 속 새로운 브랜드를 경험해 보세요.',
  ],
  [
    '여행의 완성은 특별한 쉼',
    '/category/지역?category=숙박',
    'travel',
    '나만의 여행 이야기를 만들어보세요.',
  ],
  [
    '함께 나누는 맛있는 순간',
    '/category/지역?category=맛집',
    'dining',
    '새로운 메뉴와 즐거운 경험을 만나보세요.',
  ],
  [
    '직접 써보고 이야기해요',
    '/special/shoppingreview',
    'review',
    '일상에서 발견한 좋은 제품의 이야기',
  ],
  [
    '짧은 영상, 새로운 발견',
    '/special/clip',
    'clip',
    '나만의 시선으로 경험을 기록해 보세요.',
  ],
  [
    '오늘 열리는 새로운 기회',
    '/category/오늘오픈',
    'travel',
    'MOVRIT의 새로운 캠페인을 확인해 보세요.',
  ],
]

// 자동 전환은 사용자가 멈추거나 모션 감소를 선택하면 재생하지 않습니다.
export default function BannerCarousel() {
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    if (
      paused ||
      hovered ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const timer = window.setInterval(
      () => setPage((value) => (value + 1) % 3),
      6000,
    )
    return () => window.clearInterval(timer)
  }, [paused, hovered])
  const first = page * 3
  const visible = [-1, 0, 1, 2, 3].map((offset) => (first + offset + 9) % 9)
  return (
    <section
      className="discovery-carousel"
      aria-label="추천 캠페인 배너"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setHovered(false)
      }}
    >
      <div className="discovery-carousel__viewport">
        <div className="discovery-carousel__track">
          {visible.map((index, position) => (
            <Link
              key={`${page}-${index}`}
              to={BANNERS[index][1]}
              className={`discovery-carousel__slide slide-${index % 3}`}
              tabIndex={position === 0 || position === 4 ? -1 : 0}
              aria-hidden={position === 0 || position === 4}
            >
              <img
                src={`/assets/discovery/banners/${BANNERS[index][2]}.png`}
                alt=""
              />
              <div className="discovery-carousel__copy">
                <small>MOVRIT</small>
                <h2>{BANNERS[index][0]}</h2>
                <p>{BANNERS[index][3]}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="discovery-width discovery-carousel__controls">
        <button
          type="button"
          aria-label="이전 배너"
          onClick={() => setPage((page + 2) % 3)}
        >
          ‹
        </button>
        <span aria-live="off">
          {page + 1} <i>/</i> 3
        </span>
        <button
          type="button"
          aria-label="다음 배너"
          onClick={() => setPage((page + 1) % 3)}
        >
          ›
        </button>
        <button
          type="button"
          aria-label={paused ? '배너 자동재생' : '배너 일시정지'}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? '▶' : 'Ⅱ'}
        </button>
      </div>
    </section>
  )
}
