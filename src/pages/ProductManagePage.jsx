import { useEffect, useState } from 'react'
import { getMyBrands } from '../api/brandApi'
import {
  createProduct,
  createVariant,
  getMyProducts,
  getVariants,
  restockVariant,
  updateSafetyStock,
  uploadProductThumbnail,
} from '../api/productApi'

const emptyProduct = {
  brandId: '',
  name: '',
  description: '',
  category: '',
  normalPrice: '',
  status: 'ACTIVE',
}

const emptyVariant = {
  skuCode: '',
  optionName1: '',
  optionValue1: '',
  optionName2: '',
  optionValue2: '',
  additionalPrice: '0',
  initialStock: '0',
  safetyStock: '0',
}

const imageUrl = (path) => (path ? `http://localhost:8080${path}` : null)

function ProductManagePage() {
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [productForm, setProductForm] = useState(emptyProduct)
  const [variantForms, setVariantForms] = useState({})
  const [variants, setVariants] = useState({})
  const [loading, setLoading] = useState(true)

  const loadBrands = async () => {
    try {
      const brandList = await getMyBrands()
      setBrands(brandList)

      const activeBrands = brandList.filter(
        (brand) => brand.status === 'ACTIVE',
      )

      setProductForm((current) => {
        const selectedBrandExists = activeBrands.some(
          (brand) => String(brand.id) === String(current.brandId),
        )

        if (selectedBrandExists) return current

        return {
          ...current,
          brandId: activeBrands.length > 0 ? String(activeBrands[0].id) : '',
        }
      })
    } catch (error) {
      console.error(error)
      alert('브랜드 정보를 불러오지 못했어.')
      setBrands([])
    }
  }

  const loadProducts = async () => {
    try {
      const productList = await getMyProducts()
      setProducts(productList)

      const pairs = await Promise.all(
        productList.map(async (product) => [
          product.id,
          await getVariants(product.id),
        ]),
      )
      setVariants(Object.fromEntries(pairs))
    } catch (error) {
      console.error(error)
      setProducts([])
      setVariants({})
    }
  }

  /**
   * 특정 상품의 SKU 목록만 다시 조회한다.
   * 입고/안전재고 변경 직후 DB에 반영된 최신 값을 받아 화면에 바로 보여준다.
   */
  const refreshVariants = async (productId) => {
    const updatedVariants = await getVariants(productId)
    setVariants((current) => ({
      ...current,
      [productId]: updatedVariants,
    }))
  }

  const load = async () => {
    setLoading(true)
    await Promise.all([loadBrands(), loadProducts()])
    setLoading(false)
  }

  useEffect(() => {
    // 최초 진입 시 브랜드와 상품을 한 번에 불러온다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    // load는 화면 내 갱신에도 쓰이므로 최초 마운트에서만 실행한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeBrands = brands.filter((brand) => brand.status === 'ACTIVE')

  const submitProduct = async (e) => {
    e.preventDefault()

    if (!productForm.brandId) {
      alert('상품을 등록할 브랜드를 선택해줘.')
      return
    }

    try {
      await createProduct({
        ...productForm,
        brandId: Number(productForm.brandId),
        normalPrice: Number(productForm.normalPrice),
      })

      const selectedBrandId = productForm.brandId
      setProductForm({ ...emptyProduct, brandId: selectedBrandId })
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '상품 등록에 실패했어.')
    }
  }

  const submitVariant = async (productId) => {
    const form = variantForms[productId] || emptyVariant
    try {
      await createVariant(productId, {
        ...form,
        additionalPrice: Number(form.additionalPrice),
        initialStock: Number(form.initialStock),
        safetyStock: Number(form.safetyStock),
      })

      setVariantForms((current) => ({ ...current, [productId]: emptyVariant }))
      await refreshVariants(productId)
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || '옵션/SKU 등록에 실패했어.')
    }
  }

  const setVariantField = (productId, field, value) => {
    const current = variantForms[productId] || emptyVariant
    setVariantForms({
      ...variantForms,
      [productId]: { ...current, [field]: value },
    })
  }

  if (loading) {
    return <p>상품 정보를 불러오는 중...</p>
  }

  return (
    <div>
      <h1>상품 · 재고 관리</h1>
      <p>
        재고는 상품 전체가 아니라 실제 판매 단위인 SKU/옵션 조합별로 관리해.
      </p>

      <h2>상품 등록</h2>

      {activeBrands.length === 0 ? (
        <div>
          <p>상품을 등록할 수 있는 활성 브랜드가 없어.</p>
          <p>먼저 브랜드를 등록하거나 브랜드 상태를 활성화해줘.</p>
        </div>
      ) : (
        <form onSubmit={submitProduct}>
          <div>
            <label>브랜드</label>
            <select
              value={productForm.brandId}
              onChange={(e) =>
                setProductForm({ ...productForm, brandId: e.target.value })
              }
              required
            >
              <option value="">브랜드 선택</option>
              {activeBrands.map((brand) => (
                <option key={brand.id} value={String(brand.id)}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <input
            placeholder="상품명"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
            required
          />
          <input
            placeholder="카테고리"
            value={productForm.category}
            onChange={(e) =>
              setProductForm({ ...productForm, category: e.target.value })
            }
          />
          <input
            type="number"
            min="0"
            placeholder="정상가"
            value={productForm.normalPrice}
            onChange={(e) =>
              setProductForm({ ...productForm, normalPrice: e.target.value })
            }
            required
          />
          <textarea
            placeholder="상품 설명"
            value={productForm.description}
            onChange={(e) =>
              setProductForm({ ...productForm, description: e.target.value })
            }
          />
          <button type="submit">상품 등록</button>
        </form>
      )}

      <hr />

      {products.length === 0 ? (
        <p>등록된 상품이 없어.</p>
      ) : (
        products.map((product) => {
          const variantForm = variantForms[product.id] || emptyVariant
          const productVariants = variants[product.id] || []

          return (
            <section key={product.id}>
              <h2>{product.name}</h2>
              <p>브랜드: {product.brandName}</p>
              <p>정상가: {Number(product.normalPrice).toLocaleString()}원</p>
              {product.thumbnailUrl && (
                <img
                  src={imageUrl(product.thumbnailUrl)}
                  alt={product.name}
                  width="180"
                />
              )}

              <div>
                <label>상품 대표 이미지</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      await uploadProductThumbnail(product.id, file)
                      await loadProducts()
                    } catch (error) {
                      console.error(error)
                      alert(
                        error.response?.data?.message ||
                          '상품 이미지 업로드에 실패했어.',
                      )
                    }
                  }}
                />
              </div>

              <h3>옵션/SKU 추가</h3>
              <input
                placeholder="SKU 코드 (예: TSHIRT-BLK-M)"
                value={variantForm.skuCode}
                onChange={(e) =>
                  setVariantField(product.id, 'skuCode', e.target.value)
                }
              />
              <input
                placeholder="옵션1 이름 (예: 색상)"
                value={variantForm.optionName1}
                onChange={(e) =>
                  setVariantField(product.id, 'optionName1', e.target.value)
                }
              />
              <input
                placeholder="옵션1 값 (예: 블랙)"
                value={variantForm.optionValue1}
                onChange={(e) =>
                  setVariantField(product.id, 'optionValue1', e.target.value)
                }
              />
              <input
                placeholder="옵션2 이름 (예: 사이즈)"
                value={variantForm.optionName2}
                onChange={(e) =>
                  setVariantField(product.id, 'optionName2', e.target.value)
                }
              />
              <input
                placeholder="옵션2 값 (예: M)"
                value={variantForm.optionValue2}
                onChange={(e) =>
                  setVariantField(product.id, 'optionValue2', e.target.value)
                }
              />
              <input
                type="number"
                min="0"
                placeholder="추가금액"
                value={variantForm.additionalPrice}
                onChange={(e) =>
                  setVariantField(product.id, 'additionalPrice', e.target.value)
                }
              />
              <input
                type="number"
                min="0"
                placeholder="초기 실재고"
                value={variantForm.initialStock}
                onChange={(e) =>
                  setVariantField(product.id, 'initialStock', e.target.value)
                }
              />
              <input
                type="number"
                min="0"
                placeholder="안전재고"
                value={variantForm.safetyStock}
                onChange={(e) =>
                  setVariantField(product.id, 'safetyStock', e.target.value)
                }
              />
              <button type="button" onClick={() => submitVariant(product.id)}>
                SKU 추가
              </button>

              <h3>재고 현황</h3>
              {productVariants.length === 0 ? (
                <p>등록된 SKU가 없어.</p>
              ) : (
                productVariants.map((variant) => (
                  <div key={variant.id}>
                    <strong>{variant.skuCode}</strong>
                    <p>
                      {variant.optionName1
                        ? `${variant.optionName1}: ${variant.optionValue1}`
                        : '기본 옵션'}
                      {variant.optionName2
                        ? ` / ${variant.optionName2}: ${variant.optionValue2}`
                        : ''}
                    </p>
                    <p>실재고: {variant.onHandQuantity}</p>
                    <p>예약재고: {variant.reservedQuantity}</p>
                    <p>안전재고: {variant.safetyStockQuantity}</p>
                    <p>
                      <b>판매가능재고: {variant.availableQuantity}</b>
                    </p>
                    <p>누적판매: {variant.soldQuantity}</p>

                    <button
                      onClick={async () => {
                        const value = prompt('추가 입고 수량을 입력해줘.')
                        if (!value) return

                        try {
                          await restockVariant(variant.id, Number(value))
                          await refreshVariants(product.id)
                        } catch (error) {
                          console.error(error)
                          alert(
                            error.response?.data?.message ||
                              '입고 처리에 실패했어.',
                          )
                        }
                      }}
                    >
                      입고
                    </button>

                    <button
                      onClick={async () => {
                        const value = prompt(
                          '새 안전재고 수량을 입력해줘.',
                          variant.safetyStockQuantity,
                        )
                        if (value === null) return

                        try {
                          await updateSafetyStock(variant.id, Number(value))
                          await refreshVariants(product.id)
                        } catch (error) {
                          console.error(error)
                          alert(
                            error.response?.data?.message ||
                              '안전재고 변경에 실패했어.',
                          )
                        }
                      }}
                    >
                      안전재고 변경
                    </button>
                    <hr />
                  </div>
                ))
              )}
            </section>
          )
        })
      )}
    </div>
  )
}

export default ProductManagePage
