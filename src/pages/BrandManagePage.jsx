import { useEffect, useState } from 'react'
import {
  changeBrandStatus,
  createBrand,
  getMyBrands,
  updateBrand,
  uploadBrandCover,
  uploadBrandLogo,
} from '../api/brandApi'

const emptyForm = {
  name: '',
  description: '',
  logoFile: null,
  coverFile: null,
}

const imageUrl = (path) => (path ? `http://localhost:8080${path}` : null)

function BrandManagePage() {
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadBrands = async () => {
    try {
      setLoading(true)
      const data = await getMyBrands()
      setBrands(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error(error)
      if (error.response?.status === 403) {
        alert('승인된 판매자만 브랜드를 관리할 수 있어.')
      } else {
        alert('브랜드 정보를 불러오지 못했어.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBrands()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      if (editingId) {
        await updateBrand(editingId, {
          name: form.name,
          description: form.description,
        })

        if (form.logoFile) await uploadBrandLogo(editingId, form.logoFile)
        if (form.coverFile) await uploadBrandCover(editingId, form.coverFile)
      } else {
        // 브랜드 기본 정보를 먼저 만든 뒤 발급된 ID로 이미지를 저장한다.
        const createdBrand = await createBrand({
          name: form.name,
          description: form.description,
        })

        if (form.logoFile) await uploadBrandLogo(createdBrand.id, form.logoFile)
        if (form.coverFile)
          await uploadBrandCover(createdBrand.id, form.coverFile)
      }

      resetForm()
      await loadBrands()
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '브랜드 저장에 실패했어.')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (brandId, type, file) => {
    if (!file) return

    try {
      if (type === 'logo') await uploadBrandLogo(brandId, file)
      else await uploadBrandCover(brandId, file)

      await loadBrands()
    } catch (error) {
      console.error(error)
      alert(
        error.response?.data?.message ||
          '이미지 업로드에 실패했어. JPG, PNG, WEBP / 5MB 이하인지 확인해줘.',
      )
    }
  }

  const startEdit = (brand) => {
    setEditingId(brand.id)
    setForm({
      name: brand.name,
      description: brand.description || '',
      logoFile: null,
      coverFile: null,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <p>브랜드 정보를 불러오는 중...</p>

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div>
          <h1>내 브랜드 관리</h1>
          <p>승인된 판매자는 브랜드를 등록하고 상품 판매를 준비할 수 있어.</p>
        </div>

        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)}>
            + 브랜드 등록
          </button>
        )}
      </div>

      {showForm && (
        <section
          style={{
            marginTop: 24,
            padding: 24,
            border: '1px solid #ddd',
            borderRadius: 12,
          }}
        >
          <h2>{editingId ? '브랜드 정보 수정' : '브랜드 등록'}</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label>브랜드명 *</label>
              <br />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
                style={{ width: '100%', maxWidth: 520 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>브랜드 소개</label>
              <br />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={2000}
                rows={5}
                style={{ width: '100%', maxWidth: 520 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>브랜드 로고</label>
              <br />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setForm({ ...form, logoFile: e.target.files?.[0] || null })
                }
              />
              <p>JPG, PNG, WEBP / 최대 5MB</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>브랜드 대표 이미지</label>
              <br />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setForm({ ...form, coverFile: e.target.files?.[0] || null })
                }
              />
              <p>JPG, PNG, WEBP / 최대 5MB</p>
            </div>

            <button type="submit" disabled={saving}>
              {saving ? '저장 중...' : editingId ? '수정 완료' : '브랜드 등록'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              style={{ marginLeft: 8 }}
            >
              취소
            </button>
          </form>
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <h2>등록된 브랜드</h2>

        {brands.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p>아직 등록된 브랜드가 없어.</p>
            <p>첫 브랜드를 등록하고 상품 판매를 시작해봐.</p>
            {!showForm && (
              <button type="button" onClick={() => setShowForm(true)}>
                브랜드 등록
              </button>
            )}
          </div>
        ) : (
          brands.map((brand) => (
            <article
              key={brand.id}
              style={{
                padding: 20,
                marginBottom: 20,
                border: '1px solid #ddd',
                borderRadius: 12,
              }}
            >
              <h3>{brand.name}</h3>
              <p>{brand.description || '등록된 브랜드 소개가 없어.'}</p>
              <p>상태: {brand.status === 'ACTIVE' ? '운영 중' : '비활성'}</p>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <p>로고</p>
                  {brand.logoUrl ? (
                    <img
                      src={imageUrl(brand.logoUrl)}
                      alt={`${brand.name} 로고`}
                      width="120"
                    />
                  ) : (
                    <p>등록된 로고 없음</p>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleImageUpload(brand.id, 'logo', e.target.files?.[0])
                    }
                  />
                </div>

                <div>
                  <p>대표 이미지</p>
                  {brand.coverUrl ? (
                    <img
                      src={imageUrl(brand.coverUrl)}
                      alt={`${brand.name} 대표 이미지`}
                      width="260"
                    />
                  ) : (
                    <p>등록된 대표 이미지 없음</p>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      handleImageUpload(brand.id, 'cover', e.target.files?.[0])
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <button type="button" onClick={() => startEdit(brand)}>
                  브랜드 정보 수정
                </button>
                <button
                  type="button"
                  style={{ marginLeft: 8 }}
                  onClick={async () => {
                    try {
                      await changeBrandStatus(
                        brand.id,
                        brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      )
                      await loadBrands()
                    } catch (error) {
                      console.error(error)
                      alert('브랜드 상태 변경에 실패했어.')
                    }
                  }}
                >
                  {brand.status === 'ACTIVE' ? '비활성화' : '활성화'}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default BrandManagePage
