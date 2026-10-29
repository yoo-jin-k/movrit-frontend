/** 주소록은 서버에서 읽으며 기존 캠페인의 배송 스냅샷은 변경하지 않습니다. */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BuyerLayout, {
  BuyerCard,
  BuyerButton,
} from '../../components/buyer/BuyerLayout'
import {
  listAddresses,
  saveAddress,
  deleteAddress,
  defaultAddress,
} from '../../api/accountSettingsApi'
const empty = {
  label: '',
  recipientName: '',
  recipientPhone: '',
  postalCode: '',
  address1: '',
  address2: '',
  defaultAddress: false,
}
const fields = [
  ['label', '배송지 이름', 30],
  ['recipientName', '받는 분', 50],
  ['recipientPhone', '연락처', 20],
  ['postalCode', '우편번호', 6],
  ['address1', '기본 주소', 300],
  ['address2', '상세 주소', 300],
]
export default function AccountAddressesPage() {
  const [items, setItems] = useState(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [attempt, setAttempt] = useState(0),
    [busy, setBusy] = useState(false),
    [locked, setLocked] = useState(false),
    [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null)
  const pending = useRef(false)
  useEffect(() => {
    let active = true
    listAddresses()
      .then((data) => {
        if (active) {
          setItems(data)
          setError('')
          setLocked(false)
        }
      })
      .catch(() => {
        if (active)
          setError('주소록을 불러오지 못했습니다. 다시 확인해 주세요.')
      })
    return () => {
      active = false
    }
  }, [attempt])
  const reload = () => {
    setItems(null)
    setError('')
    setEdit(null)
    setRemove(null)
    setAttempt(attempt + 1)
  }
  // 통신 실패 시 이미 저장됐을 수 있으므로 최신 조회 전까지 재제출을 막습니다.
  const run = async (operation, message) => {
    if (pending.current || locked) return
    pending.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await operation()
      setEdit(null)
      setRemove(null)
      setNotice(message)
      setItems(null)
      setAttempt((a) => a + 1)
    } catch (cause) {
      setLocked(true)
      setError(
        cause.response?.status === 409
          ? '주소 등록 한도 또는 상태가 변경되었습니다. 최신 주소록을 확인해 주세요.'
          : '처리 결과를 확인하지 못했습니다. 최신 주소록을 확인한 뒤 다시 시도해 주세요.',
      )
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  const submit = (e) => {
    e.preventDefault()
    const data = Object.fromEntries(
      Object.entries(edit)
        .filter(([key]) => key !== 'id')
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
    )
    if (
      !fields.every(([key]) => key === 'address2' || data[key]) ||
      !/^([0-9+-]){8,20}$/.test(data.recipientPhone) ||
      !/^\d{5,6}$/.test(data.postalCode)
    ) {
      setError(
        '필수 항목과 연락처(숫자·+·-, 8~20자), 우편번호(5~6자리)를 확인해 주세요.',
      )
      return
    }
    data.address2 = data.address2 || null
    run(() => saveAddress(edit.id, data), '배송지를 저장했습니다.')
  }
  return (
    <BuyerLayout title="배송지 관리">
      <Link to="/settings">← 계정 설정</Link>
      <p>
        주소록 변경은 이미 신청한 캠페인의 배송 정보에 영향을 주지 않습니다.
        배송지는 최대 10개까지 등록할 수 있습니다.
      </p>
      {error && (
        <div role="alert">
          <p>{error}</p>
          {(locked || !items) && (
            <BuyerButton disabled={busy} onClick={reload}>
              최신 주소록 확인
            </BuyerButton>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {items === null ? (
        !error && <p role="status">주소록을 불러오고 있습니다.</p>
      ) : (
        <>
          <div className="buyer-stack">
            {!items.length && <p>등록된 배송지가 없습니다.</p>}
            {items.map((a) => (
              <BuyerCard key={a.id} className="buyer-manage-row">
                <div>
                  <strong>{a.label}</strong>
                  {a.defaultAddress && <em>기본 배송지</em>}
                  <p>
                    {a.recipientName} · {a.recipientPhone}
                    <br />
                    {a.postalCode} {a.address1} {a.address2}
                  </p>
                </div>
                <div>
                  <BuyerButton
                    disabled={busy || locked}
                    onClick={() => {
                      setEdit({ ...a, address2: a.address2 || '' })
                      setRemove(null)
                      setError('')
                      setNotice('')
                    }}
                  >
                    수정
                  </BuyerButton>
                  {!a.defaultAddress && (
                    <BuyerButton
                      disabled={busy || locked}
                      onClick={() =>
                        run(
                          () => defaultAddress(a.id),
                          '기본 배송지를 변경했습니다.',
                        )
                      }
                    >
                      기본으로
                    </BuyerButton>
                  )}
                  <BuyerButton
                    disabled={busy || locked}
                    onClick={() => {
                      setRemove(a)
                      setEdit(null)
                    }}
                  >
                    삭제
                  </BuyerButton>
                </div>
              </BuyerCard>
            ))}
          </div>
          {!edit && (
            <BuyerButton
              disabled={busy || locked || items.length >= 10}
              onClick={() => {
                setEdit({ ...empty })
                setRemove(null)
                setError('')
                setNotice('')
              }}
            >
              배송지 추가
            </BuyerButton>
          )}
        </>
      )}
      {remove && (
        <BuyerCard title="배송지 삭제 확인">
          <p>
            {remove.label} 배송지를 삭제하시겠습니까? 기본 배송지를 삭제하면
            남은 주소 중 최근 등록 주소가 기본으로 지정됩니다.
          </p>
          <BuyerButton
            disabled={busy || locked}
            onClick={() =>
              run(() => deleteAddress(remove.id), '배송지를 삭제했습니다.')
            }
          >
            삭제 확정
          </BuyerButton>
          <BuyerButton disabled={busy} onClick={() => setRemove(null)}>
            취소
          </BuyerButton>
        </BuyerCard>
      )}
      {edit && (
        <BuyerCard title={edit.id ? '배송지 수정' : '새 배송지'}>
          <form onSubmit={submit}>
            <div className="buyer-form-grid">
              {fields.map(([key, label, max]) => (
                <label key={key}>
                  {label}
                  {key === 'address2' ? ' (선택)' : ''}
                  <input
                    required={key !== 'address2'}
                    maxLength={max}
                    name={key}
                    value={edit[key]}
                    disabled={busy || locked}
                    onChange={(e) =>
                      setEdit({ ...edit, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              <input
                type="checkbox"
                checked={edit.defaultAddress}
                disabled={
                  busy ||
                  locked ||
                  items?.some((a) => a.id === edit.id && a.defaultAddress)
                }
                onChange={(e) =>
                  setEdit({ ...edit, defaultAddress: e.target.checked })
                }
              />{' '}
              기본 배송지로 사용
            </label>
            <p>
              첫 주소는 기본 배송지로 지정됩니다. 기본 배송지를 바꾸려면 다른
              주소에서 ‘기본으로’를 선택해 주세요.
            </p>
            <div className="buyer-form-actions">
              <BuyerButton
                type="submit"
                variant="primary"
                disabled={busy || locked}
              >
                {busy ? '저장 중…' : '배송지 저장'}
              </BuyerButton>
              <BuyerButton
                type="button"
                disabled={busy}
                onClick={() => setEdit(null)}
              >
                취소
              </BuyerButton>
            </div>
          </form>
        </BuyerCard>
      )}
    </BuyerLayout>
  )
}
