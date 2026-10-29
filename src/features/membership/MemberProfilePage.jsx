/**
 * 본인 사진과 회원 닉네임을 수정하고 저장 결과를 공통 헤더에 반영합니다.
 * 실명·연락처는 조회된 값을 보존하고 이메일·권한·채널 프로필은 변경하지 않습니다.
 */
import { useEffect, useRef, useState } from 'react'
import BuyerLayout, {
  BuyerButton,
  BuyerCard,
} from '../../components/buyer/BuyerLayout'
import { getMyMemberProfile, updateMyMemberProfile } from '../../api/memberApi'
import AvatarEditor from './AvatarEditor'
import './accountProfile.css'
import { normalizeMemberNickname } from './memberNickname'

export default function MemberProfilePage() {
  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const inFlight = useRef(false)
  useEffect(() => {
    let active = true
    getMyMemberProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
        setNickname(data.nickname || '')
        setError('')
      })
      .catch(() => {
        if (active)
          setError('회원 정보를 불러오지 못했습니다. 다시 시도해 주세요.')
      })
    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    let active = true
    const refresh = () =>
      getMyMemberProfile()
        .then((data) => {
          if (active) setProfile(data)
        })
        .catch(() => {})
    window.addEventListener('movrit:profile-updated', refresh)
    return () => {
      active = false
      window.removeEventListener('movrit:profile-updated', refresh)
    }
  }, [])

  // 서버 저장에 성공한 응답만 반영하며 중복·유효성 오류 시 입력값을 남깁니다.
  const save = async (event) => {
    event.preventDefault()
    if (!profile || inFlight.current) return
    setError('')
    setNotice('')
    let normalized
    try {
      normalized = normalizeMemberNickname(nickname)
    } catch (cause) {
      setError(cause.message)
      return
    }
    inFlight.current = true
    setBusy(true)
    try {
      const saved = await updateMyMemberProfile({
        name: profile.name,
        phone: profile.phone,
        nickname: normalized,
      })
      setProfile(saved)
      setNickname(saved.nickname)
      setNotice('닉네임을 저장했습니다.')
      window.dispatchEvent(new Event('movrit:profile-updated'))
    } catch (cause) {
      setError(
        cause.response?.status === 409
          ? '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.'
          : '닉네임을 저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <BuyerLayout title="프로필 수정">
      <AvatarEditor
        member={profile}
        onReload={() => setAttempt((v) => v + 1)}
      />
      <BuyerCard className="buyer-profile-form" title="기본 정보">
        {!profile ? (
          <>
            {error ? (
              <>
                <p role="alert">{error}</p>
                <BuyerButton onClick={() => setAttempt(attempt + 1)}>
                  다시 불러오기
                </BuyerButton>
              </>
            ) : (
              <p role="status">회원 정보를 불러오고 있습니다.</p>
            )}
          </>
        ) : (
          <form onSubmit={save}>
            <div className="buyer-form-grid">
              <label>
                이름
                <input value={profile.name || ''} readOnly />
              </label>
              <label>
                이메일
                <input value={profile.email || ''} readOnly />
              </label>
              <label>
                휴대폰
                <input value={profile.phone || ''} readOnly />
              </label>
              <label>
                닉네임
                <input
                  name="nickname"
                  autoComplete="nickname"
                  value={nickname}
                  required
                  maxLength={20}
                  disabled={busy}
                  onChange={(event) => setNickname(event.target.value)}
                  aria-describedby="nickname-help"
                />
              </label>
            </div>
            <p id="nickname-help">
              닉네임은 2~20자의 한글, 영문, 숫자, 밑줄과 공백을 사용할 수
              있습니다.
            </p>
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            <div className="buyer-form-actions">
              <BuyerButton type="submit" variant="primary" disabled={busy}>
                {busy ? '저장 중...' : '변경사항 저장'}
              </BuyerButton>
            </div>
          </form>
        )}
      </BuyerCard>
    </BuyerLayout>
  )
}
