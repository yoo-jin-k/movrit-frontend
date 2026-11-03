// 시연 데이터 이미지를 위키미디어 공용(Commons)에서 내려받습니다.
// - 목록은 images.json(파일 이름·원본 제목·작성자·라이선스), 출처 표기는 IMAGE_CREDITS.md 에 있습니다.
// - 사진은 저장소에 올리지 않고 qa/portfolio/images/(Git 제외)에 저장하며, 이미 받은 파일은 건너뜁니다.
// - 가로 1200px로 줄인 사본만 받습니다(내용은 바꾸지 않음).
//
// 실행: node qa/portfolio/fetch-images.mjs  (seed-portfolio.mjs 가 필요할 때 자동으로 부릅니다)
import fs from 'node:fs'

const here = new URL('.', import.meta.url).pathname
const out = `${here}images`
// Commons 이용 규칙에 따라 요청에 도구 이름을 밝힙니다(개인 정보는 넣지 않음).
const headers = {
  'User-Agent': 'MOVRIT-portfolio-seed/1.0 (local demo data)',
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 요청이 많으면 Commons가 잠시 거절합니다(429). 기다렸다가 최대 5번까지 다시 시도합니다.
async function politeFetch(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers })
    if (res.ok) return res
    if (res.status !== 429 || attempt === 5)
      throw new Error(`Commons 요청 실패(${res.status}): ${url}`)
    await sleep(5000 * attempt)
  }
}

export async function fetchImages() {
  const items = JSON.parse(fs.readFileSync(`${here}images.json`, 'utf8'))
  fs.mkdirSync(out, { recursive: true })
  let downloaded = 0
  for (const item of items) {
    const target = `${out}/${item.name}.jpg`
    if (fs.existsSync(target)) continue
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: item.title,
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '1200',
    })
    const info = await (
      await politeFetch(`https://commons.wikimedia.org/w/api.php?${params}`)
    ).json()
    const page = Object.values(info.query?.pages || {})[0]
    const url = page?.imageinfo?.[0]?.thumburl
    if (!url) throw new Error(`이미지 주소를 찾지 못했습니다: ${item.title}`)
    const res = await fetch(url, { headers })
    if (!res.ok)
      throw new Error(`이미지를 받지 못했습니다(${res.status}): ${item.title}`)
    fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()))
    downloaded++
    await sleep(1500)
  }
  return { total: items.length, downloaded }
}

// 직접 실행했을 때만 바로 받습니다.
if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await fetchImages()
  console.log(
    `이미지 ${result.total}장 중 ${result.downloaded}장을 새로 받았습니다.`,
  )
}
