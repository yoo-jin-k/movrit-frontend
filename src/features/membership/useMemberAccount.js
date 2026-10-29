/** 사진·닉네임 저장 이벤트마다 서버 회원 정보를 다시 확인합니다. */
import { useEffect, useState } from 'react'
import { getMyMemberProfile } from '../../api/memberApi'
export default function useMemberAccount() {
  const [state, setState] = useState({ member: null, error: '', loading: true })
  useEffect(() => {
    let active = true,
      sequence = 0
    const refresh = () => {
      const request = ++sequence
      getMyMemberProfile()
        .then((member) => {
          if (active && request === sequence)
            setState({ member, error: '', loading: false })
        })
        .catch(() => {
          if (active && request === sequence)
            setState({
              member: null,
              error: '회원 정보를 불러오지 못했습니다.',
              loading: false,
            })
        })
    }
    refresh()
    window.addEventListener('movrit:profile-updated', refresh)
    return () => {
      active = false
      window.removeEventListener('movrit:profile-updated', refresh)
    }
  }, [])
  return {
    ...state,
    reload: () => window.dispatchEvent(new Event('movrit:profile-updated')),
  }
}
