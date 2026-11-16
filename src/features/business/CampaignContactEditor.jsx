/** 회원 개인정보를 자동 입력하지 않고 소유 브랜드가 공개할 담당자 정보를 직접 저장합니다. */
import { useEffect, useRef, useState } from 'react'
import {
  readCampaignContact,
  saveCampaignContact,
} from '../../api/collaborationApi'
export default function CampaignContactEditor({ campaignId }) {
  const [state, setState] = useState({ loading: true, error: '', value: null })
  const [name, setName] = useState(''),
    [phone, setPhone] = useState('')
  const [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [notice, setNotice] = useState('')
  const inFlight = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    readCampaignContact(campaignId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setName(data?.name || '')
          setPhone(data?.phone || '')
          setLocked(false)
          setState({ loading: false, error: '', value: data })
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            error: '담당자 연락처를 불러오지 못했습니다.',
            value: null,
          })
      })
    return () => controller.abort()
  }, [campaignId, attempt])
  const reload = () => {
    setState((old) => ({ ...old, loading: true }))
    setAttempt((v) => v + 1)
  }
  const save = async (event) => {
    event.preventDefault()
    if (
      inFlight.current ||
      locked ||
      state.loading ||
      state.error ||
      !name.trim() ||
      !phone.trim()
    )
      return
    inFlight.current = true
    setBusy(true)
    setNotice('')
    try {
      await saveCampaignContact(campaignId, {
        name: name.trim(),
        phone: phone.trim(),
      })
      setNotice(
        '담당자 연락처를 저장했습니다. 선정된 신청 당사자에게 표시됩니다.',
      )
      reload()
    } catch (error) {
      setLocked(true)
      setNotice(
        error.response?.status === 403
          ? '이 캠페인의 연락처를 수정할 권한이 없습니다.'
          : '저장 결과를 확인하지 못했습니다. 다시 저장하기 전에 최신 연락처를 확인해 주세요.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <section aria-label="캠페인 담당자 연락처">
      <h3>참여자에게 공개할 담당자 연락처</h3>
      <p className="business-info">
        이 캠페인에 선정된 참여자에게만 공개됩니다. 회원·대표자 전화번호는
        자동으로 입력하지 않습니다.
      </p>
      {state.loading ? (
        <p role="status">연락처 확인 중…</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : (
        <form onSubmit={save}>
          {!state.value && <p>아직 담당자 연락처를 등록하지 않았습니다.</p>}
          <label>
            담당자 이름
            <input
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={busy || locked}
            />
          </label>
          <label>
            담당자 연락처
            <input
              type="tel"
              required
              maxLength={30}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={busy || locked}
            />
          </label>
          <button className="business-primary" disabled={busy || locked}>
            {busy ? '저장 중…' : '담당자 연락처 저장'}
          </button>
        </form>
      )}
      {notice && <p role={locked ? 'alert' : 'status'}>{notice}</p>}
      <button type="button" onClick={reload} disabled={busy || state.loading}>
        최신 연락처 확인
      </button>
    </section>
  )
}
