/** 사진 조회 실패 시에도 닉네임 첫 글자로 회원을 구분할 수 있도록 합니다. */
import { useState } from 'react'
import { avatarUrl } from './avatarModel'
export default function MemberAvatar({ member, size = 64 }) {
  const [failed, setFailed] = useState(null)
  const src = avatarUrl(member?.avatarUrl)
  return (
    <span className="member-avatar" style={{ width: size, height: size }}>
      {src && failed !== src ? (
        <img src={src} alt="" onError={() => setFailed(src)} />
      ) : (
        <span aria-hidden="true">{(member?.nickname || 'M').slice(0, 1)}</span>
      )}
    </span>
  )
}
