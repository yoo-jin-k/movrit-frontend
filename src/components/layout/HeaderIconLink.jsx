/**
 * 아이콘 링크의 접근 가능한 이름을 label로 제공합니다.
 * 이미지 자체는 장식으로 두고 이동 목적은 링크의 aria-label과 title에서 설명합니다.
 */
import { Link } from 'react-router-dom'

function HeaderIconLink({ to, label, icon }) {
  return (
    <Link
      to={to}
      className="app-header__icon-link"
      aria-label={label}
      title={label}
    >
      <img src={icon} alt="" width="24" height="24" />
    </Link>
  )
}

export default HeaderIconLink
