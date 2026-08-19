import { Link } from 'react-router-dom'

function HeaderIconLink({ to, label, icon }) {
  return (
    <Link to={to} className="app-header__icon-link" aria-label={label} title={label}>
      <img src={icon} alt="" width="24" height="24" />
    </Link>
  )
}

export default HeaderIconLink
