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
