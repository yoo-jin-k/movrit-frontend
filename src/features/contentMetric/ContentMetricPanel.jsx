/**
 * 제출한 게시물별 성과(조회수·좋아요·댓글)를 보여 주고 기록하는 영역입니다.
 * 참여자의 내 캠페인과 업체의 콘텐츠 검토 창에서 같이 씁니다. 운영자에게는 보기만 열립니다.
 *
 * - SNS 지표를 자동으로 가져오지 않으므로 게시물에서 확인한 숫자를 직접 입력합니다.
 * - 같은 날짜로 다시 입력하면 그날 기록을 고칩니다. 날짜는 콘텐츠 제출일부터 오늘까지 고를 수 있습니다.
 * - 서버 API: GET·PUT /api/campaign-contents/{submissionId}/metrics
 */
import { useEffect, useState } from 'react'
import {
  readContentMetrics,
  recordContentMetric,
} from '../../api/contentMetricApi'
import { CONTENT_CHANNELS } from '../membership/myContentModel'
import {
  METRIC_FIELDS,
  RECORDER_LABELS,
  compactCount,
  engagementRate,
  growth,
  metricPayload,
  signed,
  todayIso,
} from './contentMetricModel'
import './contentMetric.css'

const EMPTY_FORM = {
  viewCount: '',
  likeCount: '',
  commentCount: '',
  measuredOn: '',
}

export default function ContentMetricPanel({ submissionId }) {
  const [state, setState] = useState({ id: null, data: null, error: '' })
  const [editing, setEditing] = useState(null) // 입력 중인 게시물 주소
  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!submissionId) return undefined
    const controller = new AbortController()
    readContentMetrics(submissionId, controller.signal)
      .then((data) => setState({ id: submissionId, data, error: '' }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({
          id: submissionId,
          data: null,
          error:
            error.response?.status === 404
              ? '성과 기록을 볼 수 없는 콘텐츠입니다.'
              : '성과 기록을 불러오지 못했습니다.',
        })
      })
    return () => controller.abort()
  }, [submissionId])

  if (!submissionId) return null
  const loading = state.id !== submissionId
  const data = loading ? null : state.data
  const today = todayIso()

  const open = (link) => {
    setEditing(link.contentUrl)
    setMessage({ type: '', text: '' })
    // 최근 기록이 있으면 그 숫자에서 시작해 늘어난 값만 고치면 되게 합니다.
    setForm(
      link.latest
        ? {
            viewCount: String(link.latest.viewCount),
            likeCount: String(link.latest.likeCount),
            commentCount: String(link.latest.commentCount),
            measuredOn: today,
          }
        : { ...EMPTY_FORM, measuredOn: today },
    )
  }

  const save = async (event) => {
    event.preventDefault()
    if (busy) return
    const { body, error } = metricPayload(
      editing,
      form,
      today,
      data?.earliestDate,
    )
    if (error) {
      setMessage({ type: 'error', text: error })
      return
    }
    setBusy(true)
    setMessage({ type: '', text: '' })
    try {
      const next = await recordContentMetric(submissionId, body)
      setState({ id: submissionId, data: next, error: '' })
      setEditing(null)
      setMessage({
        type: 'status',
        text: `${body.measuredOn} 성과를 저장했습니다.`,
      })
    } catch (failure) {
      setMessage({
        type: 'error',
        text:
          failure.response?.data?.detail ||
          '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="content-metric" aria-label="콘텐츠 성과">
      <h4>콘텐츠 성과</h4>
      {loading ? (
        <p role="status">성과 기록을 불러오고 있습니다.</p>
      ) : state.error ? (
        <p role="alert">{state.error}</p>
      ) : (
        <>
          <p className="content-metric__help">
            게시물에서 확인한 조회수·좋아요·댓글 수를 날짜별로 남겨 두면 변화를
            비교할 수 있습니다.
          </p>
          {data.links.map((link) => {
            const diff = growth(link.history)
            return (
              <article key={link.contentUrl} className="content-metric__link">
                <header>
                  <strong>
                    {CONTENT_CHANNELS[link.channelType] || '게시물'}
                  </strong>
                  <a
                    href={link.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    게시물 열기 ↗
                  </a>
                </header>
                {link.latest ? (
                  <>
                    <dl className="content-metric__numbers">
                      {METRIC_FIELDS.map(([key, label]) => (
                        <div key={key}>
                          <dt>{label}</dt>
                          <dd title={link.latest[key].toLocaleString('ko-KR')}>
                            {compactCount(link.latest[key])}
                          </dd>
                          {diff && (
                            <small
                              className={diff[key] < 0 ? 'is-down' : 'is-up'}
                            >
                              {signed(diff[key])}
                            </small>
                          )}
                        </div>
                      ))}
                      <div>
                        <dt>참여율</dt>
                        <dd>{engagementRate(link.latest)}</dd>
                      </div>
                    </dl>
                    <small className="content-metric__meta">
                      {link.latest.measuredOn} 기준 ·{' '}
                      {RECORDER_LABELS[link.latest.recordedByRole]}
                      {diff && ` · ${diff.days}일 전 기록과 비교`}
                    </small>
                  </>
                ) : (
                  <p className="content-metric__empty">
                    아직 기록한 성과가 없습니다.
                  </p>
                )}

                {data.editable && editing !== link.contentUrl && (
                  <button
                    type="button"
                    className="content-metric__open"
                    onClick={() => open(link)}
                  >
                    {link.latest ? '오늘 성과 기록' : '성과 기록하기'}
                  </button>
                )}

                {editing === link.contentUrl && (
                  <form className="content-metric__form" onSubmit={save}>
                    <label>
                      기준일
                      <input
                        type="date"
                        value={form.measuredOn}
                        min={data.earliestDate || undefined}
                        max={today}
                        onChange={(e) =>
                          setForm({ ...form, measuredOn: e.target.value })
                        }
                      />
                    </label>
                    {METRIC_FIELDS.map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          inputMode="numeric"
                          value={form[key]}
                          onChange={(e) =>
                            setForm({ ...form, [key]: e.target.value })
                          }
                          placeholder="0"
                        />
                      </label>
                    ))}
                    <div className="content-metric__actions">
                      <button type="submit" disabled={busy}>
                        {busy ? '저장 중...' : '저장'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditing(null)}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                )}

                {link.history.length > 1 && (
                  <details className="content-metric__history">
                    <summary>지난 기록 {link.history.length}건</summary>
                    <table>
                      <thead>
                        <tr>
                          <th>날짜</th>
                          {METRIC_FIELDS.map(([key, label]) => (
                            <th key={key}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {link.history.map((point) => (
                          <tr key={point.measuredOn}>
                            <td>{point.measuredOn}</td>
                            {METRIC_FIELDS.map(([key]) => (
                              <td key={key}>
                                {point[key].toLocaleString('ko-KR')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
              </article>
            )
          })}
          {message.text && (
            <p role={message.type === 'error' ? 'alert' : 'status'}>
              {message.text}
            </p>
          )}
        </>
      )}
    </section>
  )
}
