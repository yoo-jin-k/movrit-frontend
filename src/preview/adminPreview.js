export const members = [
  { id: 1, name: '김유진', email: 'yujin@example.com', role: '구매자', status: '정상', joined: '2025.08.11' },
  { id: 2, name: '박서연', email: 'seller@lumena.kr', role: '업체', status: '정상', joined: '2026.03.02' },
  { id: 3, name: '뮤즈제이', email: 'musej@email.com', role: '인플루언서', status: '정상', joined: '2026.05.18' },
  { id: 4, name: '이민지', email: 'minji@email.com', role: '구매자', status: '휴면', joined: '2024.11.03' },
  { id: 5, name: '최하나', email: 'hana@email.com', role: '구매자', status: '정지', joined: '2026.01.24' },
]

export const sellers = [
  { id: 1, brand: 'LUMENA', owner: '박서연', number: '120-88-10234', date: '2026.08.16', status: '심사 대기' },
  { id: 2, brand: 'MORNING DEW', owner: '정민수', number: '211-45-82910', date: '2026.08.15', status: '서류 보완' },
  { id: 3, brand: '오르비', owner: '한지우', number: '314-09-44721', date: '2026.08.13', status: '승인' },
  { id: 4, brand: 'BLOOM LAB', owner: '서은경', number: '509-22-18372', date: '2026.08.11', status: '반려' },
]

export const creators = [
  { id: 1, name: '뮤즈제이', channel: '@muse.j', followers: '128K', category: '뷰티', status: '심사 대기' },
  { id: 2, name: '오늘의민서', channel: '@minseo_daily', followers: '84K', category: '라이프', status: '승인' },
  { id: 3, name: '하루핏', channel: '@harufit', followers: '62K', category: '헬스', status: '서류 보완' },
  { id: 4, name: '소담키친', channel: '@sodam_kitchen', followers: '41K', category: '푸드', status: '승인' },
]

export const preorders = [
  { id: 'PR-260816-031', title: '글로우 세럼 02 공동구매', seller: 'LUMENA', creator: '뮤즈제이', period: '08.22 - 08.29', status: '심사 대기' },
  { id: 'PR-260815-028', title: '루미 에어 써큘레이터', seller: 'LUMENA', creator: '오늘의민서', period: '08.24 - 09.02', status: '수정 요청' },
  { id: 'PR-260812-019', title: '비건 프로틴 스타터팩', seller: '하루웰', creator: '하루핏', period: '08.20 - 08.27', status: '승인' },
  { id: 'PR-260810-014', title: '세라믹 브런치 세트', seller: '소담', creator: '소담키친', period: '08.21 - 08.30', status: '승인' },
]

export const refunds = [
  { id: 'MR-260815-093', buyer: '김유진', product: '글로우 세럼 02', amount: '38,900원', reason: '단순 변심', status: '요청' },
  { id: 'MR-260815-087', buyer: '이지은', product: '루미 에어 써큘레이터', amount: '89,000원', reason: '상품 파손', status: '검토 중' },
  { id: 'MR-260814-061', buyer: '최하나', product: '비건 프로틴 스타터팩', amount: '42,000원', reason: '배송 지연', status: '완료' },
]

export const collaborations = [
  { id: 'COL-260814-011', parties: 'LUMENA × 뮤즈제이', campaign: '글로우 세럼 02', commission: '18%', status: '계약 서명 완료' },
  { id: 'COL-260812-008', parties: '하루웰 × 하루핏', campaign: '비건 프로틴', commission: '15%', status: '진행 중' },
  { id: 'COL-260809-004', parties: '소담 × 소담키친', campaign: '브런치 세트', commission: '20%', status: '정산 대기' },
]

export const settlements = [
  { id: 'ST-2608-041', partner: 'LUMENA', sales: '128,420,000원', fee: '12,842,000원', payout: '115,578,000원', status: '확정 대기' },
  { id: 'ST-2608-040', partner: '하루웰', sales: '42,180,000원', fee: '4,218,000원', payout: '37,962,000원', status: '지급 완료' },
  { id: 'ST-2608-039', partner: '소담', sales: '31,760,000원', fee: '3,176,000원', payout: '28,584,000원', status: '정산 중' },
]
