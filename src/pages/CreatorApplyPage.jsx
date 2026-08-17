import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applyCreator } from '../api/creatorApi'
import './CreatorPage.css'

const initialForm = {
  nickname: '',
  bio: '',
  primaryCategory: '',
  channelPlatform: 'INSTAGRAM',
  channelHandle: '',
  channelUrl: '',
  followerCount: 0,
}

function CreatorApplyPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'followerCount' ? Number(value) : value,
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await applyCreator(form)
      navigate('/creator/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || '인플루언서 신청에 실패했어. 입력값을 다시 확인해줘.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="creator-page">
      <section className="creator-panel creator-form-panel">
        <div className="creator-heading">
          <span className="creator-eyebrow">MOVRIT CREATOR</span>
          <h1>인플루언서 등록</h1>
          <p>활동 채널과 소개를 등록하면 검토 후 공동구매 제안을 받을 수 있어.</p>
        </div>

        <form className="creator-form" onSubmit={onSubmit}>
          <label>
            활동명
            <input name="nickname" value={form.nickname} onChange={onChange} maxLength={100} required />
          </label>

          <label>
            소개
            <textarea name="bio" value={form.bio} onChange={onChange} maxLength={2000} rows={5} />
          </label>

          <label>
            주요 카테고리
            <input
              name="primaryCategory"
              value={form.primaryCategory}
              onChange={onChange}
              placeholder="예: 뷰티, 패션, 육아"
              maxLength={100}
            />
          </label>

          <div className="creator-grid-two">
            <label>
              활동 채널
              <select name="channelPlatform" value={form.channelPlatform} onChange={onChange} required>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
                <option value="BLOG">Blog</option>
                <option value="OTHER">기타</option>
              </select>
            </label>

            <label>
              팔로워 수
              <input
                type="number"
                name="followerCount"
                min="0"
                value={form.followerCount}
                onChange={onChange}
                required
              />
            </label>
          </div>

          <label>
            채널 아이디
            <input
              name="channelHandle"
              value={form.channelHandle}
              onChange={onChange}
              placeholder="예: @movrit_creator"
              maxLength={100}
              required
            />
          </label>

          <label>
            채널 URL
            <input
              type="url"
              name="channelUrl"
              value={form.channelUrl}
              onChange={onChange}
              placeholder="https://..."
              maxLength={500}
              required
            />
          </label>

          {error && <p className="creator-error">{error}</p>}

          <button className="creator-primary-button" type="submit" disabled={submitting}>
            {submitting ? '신청 중...' : '인플루언서 신청하기'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default CreatorApplyPage
