/**
 * 부모가 전달한 크리에이터 소개와 활동 수치를 카드로 표시합니다.
 * 팔로우 버튼에는 현재 요청 핸들러가 없으므로 실제 팔로우 기능으로 취급하지 않습니다.
 */
function CreatorCard({ creator }) {
  return (
    <article className="creator-discovery-card">
      <div className="creator-discovery-card__avatar">
        {creator.category.slice(0, 2)}
      </div>
      <div className="creator-discovery-card__identity">
        <strong>{creator.name}</strong>
        <span>
          {creator.category} · {creator.followers}
        </span>
      </div>
      <span className="creator-discovery-card__active">
        진행중 {creator.active}
      </span>
      <button type="button">+ 팔로우</button>
    </article>
  )
}

export default CreatorCard
