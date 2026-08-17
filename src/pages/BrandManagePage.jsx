import { useEffect, useState } from 'react'
import {
    changeBrandStatus,
    createBrand,
    getMyBrands,
    updateBrand,
    uploadBrandCover,
    uploadBrandLogo,
} from '../api/brandApi'

const emptyForm = { name: '', description: '' }
const imageUrl = (path) => path ? `http://localhost:8080${path}` : null

function BrandManagePage() {
    const [brands, setBrands] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(true)

    const loadBrands = async () => {
        try {
            setLoading(true)
            setBrands(await getMyBrands())
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
        loadBrands()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingId) await updateBrand(editingId, form)
            else await createBrand(form)

            setForm(emptyForm)
            setEditingId(null)
            await loadBrands()
        } catch (error) {
            console.error(error)
            alert('브랜드 저장에 실패했어.')
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
            alert(error.response?.data?.message || '이미지 업로드에 실패했어. JPG, PNG, WEBP / 5MB 이하인지 확인해줘.')
        }
    }

    if (loading) return <p>브랜드 정보를 불러오는 중...</p>

    return (
        <div>
            <h1>내 브랜드 관리</h1>
            <p>승인된 판매자는 여러 브랜드를 운영할 수 있어.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>브랜드명</label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        maxLength={100}
                    />
                </div>
                <div>
                    <label>브랜드 소개</label>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        maxLength={2000}
                    />
                </div>
                <button type="submit">{editingId ? '브랜드 수정' : '브랜드 등록'}</button>
                {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>
                        취소
                    </button>
                )}
            </form>

            <hr />

            {brands.length === 0 ? <p>등록된 브랜드가 없어.</p> : brands.map((brand) => (
                <section key={brand.id}>
                    <h2>{brand.name}</h2>
                    <p>{brand.description || '브랜드 소개 없음'}</p>
                    <p>상태: {brand.status}</p>

                    {brand.logoUrl && <img src={imageUrl(brand.logoUrl)} alt={`${brand.name} 로고`} width="120" />}
                    {brand.coverUrl && <img src={imageUrl(brand.coverUrl)} alt={`${brand.name} 대표`} width="260" />}

                    <div>
                        <label>로고 이미지 (JPG/PNG/WEBP, 최대 5MB)</label>
                        <input type="file" accept="image/jpeg,image/png,image/webp"
                               onChange={(e) => handleImageUpload(brand.id, 'logo', e.target.files?.[0])} />
                    </div>
                    <div>
                        <label>대표 이미지 (JPG/PNG/WEBP, 최대 5MB)</label>
                        <input type="file" accept="image/jpeg,image/png,image/webp"
                               onChange={(e) => handleImageUpload(brand.id, 'cover', e.target.files?.[0])} />
                    </div>

                    <button onClick={() => {
                        setEditingId(brand.id)
                        setForm({ name: brand.name, description: brand.description || '' })
                    }}>정보 수정</button>

                    <button onClick={async () => {
                        await changeBrandStatus(brand.id, brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')
                        await loadBrands()
                    }}>
                        {brand.status === 'ACTIVE' ? '비활성화' : '활성화'}
                    </button>
                    <hr />
                </section>
            ))}
        </div>
    )
}

export default BrandManagePage
