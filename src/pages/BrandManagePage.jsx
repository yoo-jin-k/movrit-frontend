/**
 * 내 브랜드 조회·기본 정보 편집과 로고/커버 업로드를 처리합니다(/seller/brands, 승인된 업체만).
 * - 사용하는 API: GET /api/brands/mine, POST /api/brands, PUT /api/brands/{id},
 *   POST /api/brands/{id}/logo·cover(multipart file), PATCH /api/brands/{id}/status.
 * - 신규 브랜드 ID를 받은 후 파일을 순서대로 업로드하므로 후속 파일 실패가 앞선 기본 정보 저장을 되돌리지는 않습니다.
 *
 * 변경 이력(고치기 전 → 고친 후)
 * - 이미지 주소를 http://localhost:8080 + 경로로 고정 → 시연(5174→18080)에서는 8080에 파일이 없어 이미지가 깨짐.
 *   서버가 준 /uploads/... 상대 주소를 그대로 쓰고, 개발 서버(vite.config.js)도 /uploads를 백엔드로 넘기도록 함.
 * - 파일을 고른 뒤 미리보기·형식 검사가 없어 무엇이 올라갈지 알 수 없었음 → 선택 즉시 미리보기와 JPG·PNG·WEBP/5MB 검사.
 * - 업체 화면 안에 별도 <main>과 인라인 스타일로 그려져 다른 업체 화면과 모양이 달랐음 → 업체 공통 머리글·패널 사용.
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  changeBrandStatus,
  createBrand,
  getMyBrands,
  updateBrand,
  uploadBrandCover,
  uploadBrandLogo,
} from '../api/brandApi'
import { PageHeader } from '../features/business/BusinessUi'
import {
  BRAND_IMAGE_TYPES,
  brandImageError,
  brandImageSrc,
} from '../features/business/brandModel'
import '../features/business/businessSeller.css'

const emptyForm = {
  name: '',
  description: '',
  logoFile: null,
  coverFile: null,
}
const accept = BRAND_IMAGE_TYPES.join(',')

// 고른 파일은 브라우저 임시 주소로, 저장된 이미지는 서버 공개 주소로 보여줍니다.
function ImageFrame({ file, path, alt, empty }) {
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    },
    [fileUrl],
  )
  const [failedSrc, setFailedSrc] = useState('')
  const src = fileUrl || brandImageSrc(path)
  return (
    <div className="brand-image-frame">
      {src && failedSrc !== src ? (
        <img src={src} alt={alt} onError={() => setFailedSrc(src)} />
      ) : (
        <span>{src ? '이미지를 불러오지 못했습니다.' : empty}</span>
      )}
    </div>
  )
}

function BrandManagePage() {
  const [searchParams] = useSearchParams()
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  // 업체 설정의 '브랜드 등록하기'(?new=1)로 들어오면 등록 폼을 바로 엽니다.
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState('')

  // 내 브랜드를 조회하고 배열 응답만 목록에 반영합니다. 403은 업체 승인 관련 안내로 구분합니다.
  const loadBrands = async () => {
    try {
      setLoading(true)
      const data = await getMyBrands()
      if (!Array.isArray(data)) throw new Error('브랜드 목록 형식 오류')
      setBrands(data)
      setLoadError('')
    } catch (error) {
      console.error(error)
      setLoadError(
        error.response?.status === 403
          ? '승인된 업체만 브랜드를 관리할 수 있습니다.'
          : '브랜드 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
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

  const logoError = brandImageError(form.logoFile)
  const coverError = brandImageError(form.coverFile)

  // 기본 정보 생성/수정을 먼저 완료한 뒤 선택한 로고·커버만 업로드합니다.
  // 후속 업로드가 실패해도 앞선 요청이 저장됐을 수 있으므로 이 흐름을 원자 트랜잭션으로 설명하지 않습니다.
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (logoError || coverError) return
    let brandId = editingId
    try {
      setSaving(true)
      if (editingId) {
        await updateBrand(editingId, {
          name: form.name,
          description: form.description,
        })
      } else {
        // 브랜드 기본 정보를 먼저 만든 뒤 발급된 ID로 이미지를 저장합니다.
        const createdBrand = await createBrand({
          name: form.name,
          description: form.description,
        })
        brandId = createdBrand.id
      }
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '브랜드 저장에 실패했습니다.')
      setSaving(false)
      return
    }
    try {
      if (form.logoFile) await uploadBrandLogo(brandId, form.logoFile)
      if (form.coverFile) await uploadBrandCover(brandId, form.coverFile)
      resetForm()
    } catch (error) {
      console.error(error)
      // 기본 정보는 이미 저장됐으므로 폼을 닫고 목록에서 이미지만 다시 올리도록 안내합니다.
      resetForm()
      alert(
        (error.response?.data?.detail || error.response?.data?.message || '') +
          '\n브랜드 정보는 저장됐지만 이미지는 올라가지 않았습니다. 목록에서 이미지를 다시 올려 주세요.',
      )
    } finally {
      setSaving(false)
      await loadBrands()
    }
  }

  // 개별 이미지 교체 성공 후 브랜드 목록을 다시 읽습니다. 이 동작은 이름·설명 폼 저장과 분리되어 있습니다.
  const handleImageUpload = async (brandId, type, input) => {
    const file = input.files?.[0]
    if (!file) return
    const error = brandImageError(file)
    if (error) {
      alert(error)
      input.value = ''
      return
    }
    try {
      setUploadingKey(`${brandId}-${type}`)
      if (type === 'logo') await uploadBrandLogo(brandId, file)
      else await uploadBrandCover(brandId, file)
      await loadBrands()
    } catch (failure) {
      console.error(failure)
      alert(
        failure.response?.data?.detail ||
          failure.response?.data?.message ||
          '이미지 업로드에 실패했습니다. JPG, PNG, WEBP / 5MB 이하인지 확인해 주세요.',
      )
    } finally {
      setUploadingKey('')
      input.value = ''
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

  const fileField = (key, label, error) => (
    <label className="brand-field">
      {label}
      <input
        type="file"
        accept={accept}
        onChange={(e) =>
          setForm({ ...form, [key]: e.target.files?.[0] || null })
        }
      />
      <small>JPG, PNG, WEBP / 최대 5MB</small>
      {form[key] && (
        <ImageFrame file={form[key]} alt={`선택한 ${label}`} empty="" />
      )}
      {error && <span role="alert">{error}</span>}
    </label>
  )

  return (
    <>
      <PageHeader
        title="내 브랜드 관리"
        description="브랜드 로고·대표 이미지와 소개는 캠페인 화면에 함께 표시됩니다."
      >
        {!showForm && (
          <button
            type="button"
            className="business-primary"
            onClick={() => setShowForm(true)}
          >
            + 브랜드 등록
          </button>
        )}
      </PageHeader>

      {showForm && (
        <section className="business-panel">
          <h2>{editingId ? '브랜드 정보 수정' : '새 브랜드 등록'}</h2>
          <form className="brand-form" onSubmit={handleSubmit}>
            <label className="brand-field">
              브랜드명 (필수)
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={100}
              />
            </label>
            <label className="brand-field">
              브랜드 소개
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                maxLength={2000}
                rows={4}
              />
            </label>
            {fileField('logoFile', '브랜드 로고', logoError)}
            {fileField('coverFile', '브랜드 대표 이미지', coverError)}
            <div className="brand-form-actions">
              <button
                type="submit"
                className="business-primary"
                disabled={saving || Boolean(logoError || coverError)}
              >
                {saving
                  ? '저장 중...'
                  : editingId
                    ? '수정 내용 저장'
                    : '브랜드 등록'}
              </button>
              <button type="button" onClick={resetForm} disabled={saving}>
                취소
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="business-panel">
        <h2>등록된 브랜드</h2>
        {loading ? (
          <p role="status">브랜드 정보를 불러오고 있습니다.</p>
        ) : loadError ? (
          <div className="business-empty" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={loadBrands}>
              다시 불러오기
            </button>
          </div>
        ) : brands.length === 0 ? (
          <div className="business-empty">
            <p>
              아직 등록된 브랜드가 없습니다. 첫 브랜드를 등록하고 캠페인을
              시작해 보세요.
            </p>
            {!showForm && (
              <button
                type="button"
                className="business-primary"
                onClick={() => setShowForm(true)}
              >
                브랜드 등록하기
              </button>
            )}
          </div>
        ) : (
          brands.map((brand) => (
            <article key={brand.id} className="brand-card">
              <div className="brand-card-head">
                <h3>{brand.name}</h3>
                <span
                  className={`brand-status${brand.status === 'ACTIVE' ? '' : ' is-inactive'}`}
                >
                  {brand.status === 'ACTIVE' ? '운영 중' : '비활성'}
                </span>
              </div>
              <p>{brand.description || '등록된 브랜드 소개가 없습니다.'}</p>
              <div className="brand-images">
                {[
                  ['logo', '로고', brand.logoUrl],
                  ['cover', '대표 이미지', brand.coverUrl],
                ].map(([type, label, path]) => (
                  <label key={type} className="brand-image-slot">
                    {label}
                    <ImageFrame
                      path={path}
                      alt={`${brand.name} ${label}`}
                      empty={`등록된 ${label} 없음`}
                    />
                    <input
                      type="file"
                      accept={accept}
                      disabled={uploadingKey === `${brand.id}-${type}`}
                      aria-label={`${brand.name} ${label} 올리기`}
                      onChange={(e) =>
                        handleImageUpload(brand.id, type, e.target)
                      }
                    />
                    {uploadingKey === `${brand.id}-${type}` && (
                      <small role="status">이미지를 올리고 있습니다.</small>
                    )}
                  </label>
                ))}
              </div>
              <div className="brand-form-actions">
                <button type="button" onClick={() => startEdit(brand)}>
                  브랜드 정보 수정
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await changeBrandStatus(
                        brand.id,
                        brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      )
                      await loadBrands()
                    } catch (error) {
                      console.error(error)
                      alert('브랜드 상태 변경에 실패했습니다.')
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
    </>
  )
}

export default BrandManagePage
