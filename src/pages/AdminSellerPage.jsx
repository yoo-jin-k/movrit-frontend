import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllSellers } from '../api/adminSellerApi'
import AdminLayout, { AdminCard, AdminStatus } from '../components/admin/AdminLayout'
import { sellers as preview } from '../preview/adminPreview'

export default function AdminSellerPage(){
  const [items,setItems]=useState([]); const [filter,setFilter]=useState('전체')
  useEffect(()=>{getAllSellers().then(result=>setItems(result.length?result:preview)).catch(()=>setItems(preview))},[])
  const normalized=items.map(x=>({id:x.id,brand:x.brandName||x.brand,owner:x.representativeName||x.owner,number:x.businessNumber||x.number,date:x.createdAt?.slice(0,10)||x.date,status:({PENDING:'심사 대기',APPROVED:'승인',REJECTED:'반려'}[x.status]||x.status)}))
  const shown=filter==='전체'?normalized:normalized.filter(x=>x.status===filter)
  return <AdminLayout title="업체 관리"><div className="admin-filters"><input placeholder="업체명, 사업자번호 검색"/><div className="admin-chips">{['전체','심사 대기','승인','반려'].map(x=><button key={x} className={filter===x?'is-active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div></div><AdminCard title="업체 목록" subtitle={`총 ${shown.length}건`}><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>업체</th><th>대표자</th><th>사업자번호</th><th>신청일</th><th>상태</th><th></th></tr></thead><tbody>{shown.map(x=><tr key={x.id}><td data-label="업체"><strong>{x.brand}</strong></td><td data-label="대표자">{x.owner}</td><td data-label="사업자번호">{x.number}</td><td data-label="신청일">{x.date}</td><td data-label="상태"><AdminStatus tone={x.status==='승인'?'success':x.status==='반려'?'danger':'warning'}>{x.status}</AdminStatus></td><td><Link className="admin-button admin-button--secondary" to={`/admin/sellers/${x.id}`}>상세</Link></td></tr>)}</tbody></table></div></AdminCard></AdminLayout>
}
