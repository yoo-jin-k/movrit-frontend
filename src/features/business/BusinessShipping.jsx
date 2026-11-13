/**
 * 업체 '배송 관리' 화면입니다(/seller/shipping).
 *
 * 흐름: 캠페인 선택 → 선정된 배송형 참여자의 배송지 확인 → 엑셀로 내려받아 택배 접수 → 택배사·송장번호 입력 후 한 번에 저장
 * - 저장하면 참여자에게 '체험 상품이 발송되었습니다' 알림이 가고, '내 캠페인'에 송장번호가 보입니다.
 * - 참여자가 수령(체험 완료)을 확인한 줄은 고칠 수 없습니다.
 * - 엑셀에는 개인정보(수령인·연락처·주소)가 담겨 있어 내려받을 때마다 감사 기록이 남습니다.
 */
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useBusinessList from './useBusinessList'
import { ListState, PageHeader } from './BusinessUi'
import {
  downloadShippingExcel,
  readCouriers,
  readShippingRows,
  saveShipments,
} from '../../api/shippingApi'
import {
  changedShipments,
  saveSummary,
  shippingStage,
  shippingSummary,
  shortTime,
  trackingError,
} from '../shipping/shippingModel'

export default function BusinessShipping() {
  const campaigns = useBusinessList('/collaborations/campaigns/seller')
  const [params, setParams] = useSearchParams()
  const campaignId = params.get('campaignId') || ''
  const [couriers, setCouriers] = useState([])
  const [state, setState] = useState({ loading: false, data: [], error: '' })
  const [edits, setEdits] = useState({})
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    readCouriers()
      .then(setCouriers)
      .catch(() => setCouriers([]))
  }, [])

  useEffect(() => {
    if (!campaignId) return undefined
    const controller = new AbortController()
    readShippingRows(campaignId, controller.signal)
      .then((data) => {
        setState({ loading: false, data, error: '' })
        setEdits({})
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({
            loading: false,
            data: [],
            error: '배송 목록을 불러오지 못했습니다.',
          })
      })
    return () => controller.abort()
  }, [campaignId, attempt])

  const rows = campaignId ? state.data : []
  const summary = shippingSummary(rows)
  const pending = changedShipments(rows, edits)
  const invalid = rows.some((row) =>
    trackingError(edits[row.applicationId]?.trackingNumber),
  )
  const edit = (id, field, value) =>
    setEdits((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }))
  const value = (row, field) =>
    edits[row.applicationId]?.[field] ?? row[field] ?? ''

  const save = async () => {
    if (busy || !pending.length || invalid) return
    setBusy(true)
    setError('')
    try {
      setNotice(saveSummary(await saveShipments(campaignId, pending)))
      setAttempt((count) => count + 1)
    } catch (failure) {
      setError(failure.response?.data?.detail || '송장을 저장하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const name = await downloadShippingExcel(campaignId)
      setNotice(`${name} 파일을 내려받았습니다.`)
    } catch {
      setError('엑셀 파일을 만들지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="배송 관리"
        description="선정된 참여자의 배송지를 확인하고 송장번호를 입력하세요."
      />
      <p className="business-info">
        엑셀로 배송지를 내려받아 택배를 접수한 뒤, 택배사와 송장번호를 입력해
        저장하면 참여자에게 발송 알림이 갑니다. 엑셀에는 개인정보가 담겨 있으니
        택배 접수 후에는 지워 주세요.
      </p>
      <div className="business-filters">
        <select
          aria-label="캠페인 선택"
          value={campaignId}
          onChange={(e) => {
            setNotice('')
            setError('')
            setState({ loading: Boolean(e.target.value), data: [], error: '' })
            setParams(e.target.value ? { campaignId: e.target.value } : {})
          }}
        >
          <option value="">캠페인을 골라 주세요</option>
          {campaigns.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {campaignId && (
        <>
          <p className="business-recruitment" role="status">
            <strong>배송 대상 {rows.length}명</strong>
            <span>발송 전 {summary.READY}명</span>
            <span>발송 {summary.SHIPPED}명</span>
            <span>수령 확인 {summary.RECEIVED}명</span>
          </p>
          <div className="shipping-actions">
            <button
              className="business-secondary"
              disabled={busy || !rows.length}
              onClick={download}
            >
              배송지 엑셀 내려받기
            </button>
            <button
              className="business-primary"
              disabled={busy || !pending.length || invalid}
              onClick={save}
            >
              {busy ? '저장 중…' : `입력한 송장 저장 (${pending.length}건)`}
            </button>
          </div>
        </>
      )}
      {notice && (
        <p role="status" className="business-info">
          {notice}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {campaignId && (
        <section className="business-panel">
          <ListState state={state}>
            {rows.length ? (
              <div className="business-table-scroll">
                <table className="participants-table shipping-table">
                  <thead>
                    <tr>
                      <th>참여자</th>
                      <th>수령인·연락처</th>
                      <th>주소</th>
                      <th>택배사</th>
                      <th>송장번호</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const stage = shippingStage(row)
                      const tracking = value(row, 'trackingNumber')
                      const problem = trackingError(tracking)
                      const locked = Boolean(row.receivedAt)
                      return (
                        <tr key={row.applicationId}>
                          <td data-label="참여자">
                            {row.creatorNickname}
                            <small>신청 #{row.applicationId}</small>
                          </td>
                          <td data-label="수령인·연락처">
                            {row.recipientName || '-'}
                            <small>{row.recipientPhone || '-'}</small>
                          </td>
                          <td data-label="주소">
                            ({row.postalCode || '-'}) {row.address1}
                            <small>{row.address2}</small>
                          </td>
                          <td data-label="택배사">
                            <select
                              aria-label={`신청 ${row.applicationId} 택배사`}
                              disabled={locked || busy}
                              value={value(row, 'courier')}
                              onChange={(e) =>
                                edit(
                                  row.applicationId,
                                  'courier',
                                  e.target.value,
                                )
                              }
                            >
                              <option value="">선택</option>
                              {couriers.map((name) => (
                                <option key={name} value={name}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td
                            data-label="송장번호"
                            className={problem ? 'is-error' : ''}
                          >
                            <input
                              aria-label={`신청 ${row.applicationId} 송장번호`}
                              disabled={locked || busy}
                              maxLength={30}
                              inputMode="numeric"
                              value={tracking}
                              placeholder="숫자만 입력"
                              onChange={(e) =>
                                edit(
                                  row.applicationId,
                                  'trackingNumber',
                                  e.target.value,
                                )
                              }
                            />
                            {problem && <small role="alert">{problem}</small>}
                          </td>
                          <td data-label="상태">
                            <span
                              className={`shipping-stage is-${stage.code.toLowerCase()}`}
                            >
                              {stage.label}
                            </span>
                            <small>
                              {row.receivedAt
                                ? `수령 ${shortTime(row.receivedAt)}`
                                : row.shippedAt
                                  ? `발송 ${shortTime(row.shippedAt)}`
                                  : ''}
                            </small>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="business-empty">
                이 캠페인에는 선정된 배송형 참여자가 없습니다.
              </div>
            )}
          </ListState>
        </section>
      )}
    </>
  )
}
