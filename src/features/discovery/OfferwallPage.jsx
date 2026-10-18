import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DiscoveryLayout from './DiscoveryLayout'

const SHOPS = [
  ['gmarket', 'G마켓', '#00a85a'],
  ['nstore', 'N+스토어', '#00b66e'],
  ['kurly', '컬리', '#60227d'],
  ['ohou', '오늘의집', '#36b8e8'],
  ['ssg', 'SSG', '#222'],
  ['11st', '11번가', '#ef3150'],
]
export default function OfferwallPage() {
  const { shop } = useParams()
  const selected = SHOPS.find(([id]) => id === shop)
  const [notice, setNotice] = useState('')
  const [url, setUrl] = useState('')
  return (
    <DiscoveryLayout notice={notice} onCloseNotice={() => setNotice('')}>
      <main>
        <section className="discovery-wallet-hero">
          <div className="discovery-width">
            <div>
              <h1>
                다양한 미션으로 적립하는
                <br />
                <em>MOVRIT 포인트 저금통</em>
              </h1>
              <p>
                차곡차곡 쌓이는 새로운 즐거움.
                <br />
                포인트 서비스를 준비하고 있습니다.
              </p>
              <div className="discovery-wallet-balance">
                <h2>나의 저금통</h2>
                <div>
                  <span>
                    저금통 참여 포인트<strong>— P</strong>
                  </span>
                  <span>
                    적립 예정 포인트<strong>— P</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      '포인트 내역은 서비스 연동 후 확인할 수 있습니다.',
                    )
                  }
                >
                  내 저금통 내역 확인하기 →
                </button>
              </div>
            </div>
            <div className="discovery-wallet-art" aria-hidden="true">
              <span>모으는 즐거움, 함께하는 경험</span>
              <img src="/assets/discovery/piggy-bank.svg" alt="" />
            </div>
          </div>
        </section>
        <div className="discovery-width discovery-wallet-content">
          {selected ? (
            <>
              <Link to="/offerwall">‹ 저금통으로 돌아가기</Link>
              <h2>{selected[1]} 쇼핑 적립</h2>
              <div className="discovery-wallet-shop-detail">
                <strong style={{ color: selected[2] }}>{selected[1]}</strong>
                <p>제휴 및 적립 조건을 준비 중입니다.</p>
                <button
                  type="button"
                  className="discovery-primary-button"
                  onClick={() =>
                    setNotice(
                      '제휴 링크 발급 API가 연결되면 이용할 수 있습니다.',
                    )
                  }
                >
                  상품 찾아보기
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>오늘 쇼핑은 어디?</h2>
              <p className="discovery-muted">
                제휴 쇼핑몰과 적립 조건은 서비스 오픈 후 안내됩니다.
              </p>
              <div className="discovery-shop-grid">
                {SHOPS.map(([id, name, color]) => (
                  <Link to={`/offerwall/${id}`} key={id}>
                    <strong style={{ color }}>{name}</strong>
                    <span>쇼핑 적립 준비 중</span>
                    <div>
                      <span>자세히 보기</span>
                      <span>상품 찾아보기 →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
          <section className="discovery-referral">
            <h2>쇼핑 추천링크 만들기</h2>
            <p>추천하고 싶은 상품의 주소를 입력해 주세요.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                setNotice(
                  '추천 링크 발급 기능을 준비 중입니다. 입력한 주소는 전송되지 않았습니다.',
                )
              }}
            >
              <input
                type="url"
                required
                aria-label="추천 상품 URL"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="상품의 URL을 입력해주세요."
              />
              <button type="submit" className="discovery-primary-button">
                링크 생성하기
              </button>
            </form>
            <h3>유의사항</h3>
            <p>
              적립 대상, 적립률, 취소 및 환불 시 처리 기준은 제휴 정책 확정 후
              안내됩니다.
            </p>
          </section>
        </div>
      </main>
    </DiscoveryLayout>
  )
}
