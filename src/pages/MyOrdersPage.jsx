import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../api/commerceApi'
import BuyerLayout, { BuyerCard } from '../components/buyer/BuyerLayout'
import { buyerOrders } from '../preview/buyerV2Preview'

const labels={PENDING_PAYMENT:'진행중',PAID:'결제완료',PREPARING:'결제완료',SHIPPED:'배송중',DELIVERED:'완료',CANCELLED:'취소',REFUNDED:'취소'}
export default function MyOrdersPage(){
  const [orders,setOrders]=useState([]);const [filter,setFilter]=useState('전체')
  useEffect(()=>{getMyOrders().then(items=>setOrders(items.length?items:buyerOrders)).catch(()=>setOrders(import.meta.env.DEV?buyerOrders:[]))},[])
  const normalized=orders.map((o)=>({id:o.id,number:o.orderNumber||o.number,title:o.preorderTitle||o.title,status:labels[o.status]||o.status,date:o.createdAt?.slice(0,10)||o.date,amount:o.totalPaymentAmount?`${Number(o.totalPaymentAmount).toLocaleString()}원`:o.amount}))
  const shown=useMemo(()=>filter==='전체'?normalized:normalized.filter(o=>o.status===filter),[normalized,filter])
  return <BuyerLayout title="주문 내역"><div className="buyer-chip-row buyer-order-filters">{['전체','진행중','결제완료','배송중','완료','취소'].map(x=><button className={filter===x?'is-active':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><div className="buyer-order-list">{shown.map(o=><BuyerCard key={o.id} className="buyer-order-row"><div><h2>{o.title}</h2><strong>{o.status}</strong><time>{o.date}</time></div><b>{o.amount}</b><Link className="buyer-v2-button buyer-v2-button--secondary" to={`/orders/${o.id}`}>상세 보기</Link></BuyerCard>)}</div></BuyerLayout>
}
