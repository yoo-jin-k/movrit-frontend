/** 선택한 사진은 임시 미리보기이며 서버 저장 성공 후에만 공통 회원 사진을 갱신합니다. */
import { useEffect, useRef, useState } from 'react'
import {
  uploadMemberAvatar,
  deleteMemberAvatar,
} from '../../api/memberAvatarApi'
import { getMyMemberProfile } from '../../api/memberApi'
import MemberAvatar from './MemberAvatar'
import { avatarFileError } from './avatarModel'
export default function AvatarEditor({ member, onReload }) {
  const [file, setFile] = useState(null),
    [preview, setPreview] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false),
    [locked, setLocked] = useState(false)
  const pending = useRef(false),
    input = useRef(null)
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )
  const choose = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    const failure = avatarFileError(selected)
    setNotice('')
    setError(failure)
    setDeleting(false)
    setFile(failure ? null : selected)
    setPreview(failure ? '' : URL.createObjectURL(selected))
    if (failure) e.target.value = ''
  }
  const reset = () => {
    setFile(null)
    setPreview('')
    if (input.current) input.current.value = ''
  }
  const save = async (remove) => {
    if (pending.current || locked || (!remove && !file)) return
    pending.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (remove) await deleteMemberAvatar()
      else await uploadMemberAvatar(file)
      reset()
      setDeleting(false)
      setNotice(
        remove ? '프로필 사진을 삭제했습니다.' : '프로필 사진을 저장했습니다.',
      )
      window.dispatchEvent(new Event('movrit:profile-updated'))
    } catch (cause) {
      setLocked(true)
      setError(
        cause.response?.status === 400 || cause.response?.status === 413
          ? '사진 형식 또는 크기를 확인해 주세요. JPEG·PNG, 5MiB 이하만 등록할 수 있습니다.'
          : '처리 결과를 확인하지 못했습니다. 현재 사진을 다시 확인해 주세요.',
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <section
      id="profile-photo"
      className="account-photo-editor"
      aria-label="프로필 사진 설정"
    >
      <h2>프로필 사진</h2>
      <div className="account-photo-editor__body">
        {preview ? (
          <img
            className="account-photo-preview"
            src={preview}
            alt="저장 전 선택한 사진 미리보기"
            onError={() => {
              reset()
              setError(
                '사진을 열 수 없습니다. 다른 JPEG 또는 PNG 사진을 선택해 주세요.',
              )
            }}
          />
        ) : (
          <MemberAvatar member={member} size={88} />
        )}
        <div>
          <p>나를 표현하는 사진을 등록해 주세요.</p>
          <small>JPEG·PNG · 최대 5MiB</small>
          <label
            className="account-photo-file"
            aria-disabled={busy || locked || !member}
          >
            <span>사진 선택</span>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png"
              aria-label="프로필 사진 파일"
              disabled={busy || locked || !member}
              onChange={choose}
            />
          </label>
          <small className="account-photo-filename">
            {file?.name || '선택한 사진 없음'}
          </small>
        </div>
      </div>
      {file && <p>아직 저장되지 않은 미리보기입니다.</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <div className="account-photo-actions">
        {file && (
          <>
            <button disabled={busy || locked} onClick={() => save(false)}>
              {busy ? '저장 중…' : '사진 저장'}
            </button>
            <button disabled={busy} onClick={reset}>
              선택 취소
            </button>
          </>
        )}
        {member?.avatarUrl && !file && (
          <button disabled={busy || locked} onClick={() => setDeleting(true)}>
            사진 삭제
          </button>
        )}
        {locked && (
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await getMyMemberProfile()
                onReload()
                setLocked(false)
                setError('')
              } catch {
                setError(
                  '현재 사진을 확인하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.',
                )
              } finally {
                setBusy(false)
              }
            }}
          >
            현재 사진 다시 확인
          </button>
        )}
      </div>
      {deleting && (
        <div className="account-photo-confirm">
          <p>프로필 사진을 삭제하시겠습니까?</p>
          <button disabled={busy || locked} onClick={() => save(true)}>
            사진 삭제 확정
          </button>
          <button disabled={busy} onClick={() => setDeleting(false)}>
            취소
          </button>
        </div>
      )}
    </section>
  )
}
