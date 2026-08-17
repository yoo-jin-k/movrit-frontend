import{useEffect,useState}from'react';import{getMyCreator,saveCreator}from'../api/collaborationApi'
const empty={nickname:'',bio:'',primaryCategory:'',snsUrl:'',followerCount:0}
export default function CreatorPage(){const[form,setForm]=useState(empty);const[exists,setExists]=useState(false)
 useEffect(()=>{getMyCreator().then(v=>{setForm(v);setExists(true)}).catch(e=>{if(e.response?.status!==404)alert('프로필을 불러오지 못했어.')})},[])
 const submit=async e=>{e.preventDefault();try{const v=await saveCreator({...form,followerCount:Number(form.followerCount)},exists);setForm(v);setExists(true);alert('인플루언서 프로필을 저장했어.')}catch(e){alert(e.response?.data?.message||'저장에 실패했어.')}}
 return <main><h1>인플루언서 프로필</h1><form className="form-grid" onSubmit={submit}>
  <label>활동명<input required value={form.nickname} onChange={e=>setForm({...form,nickname:e.target.value})}/></label>
  <label>소개<textarea value={form.bio||''} onChange={e=>setForm({...form,bio:e.target.value})}/></label>
  <label>카테고리<input value={form.primaryCategory||''} onChange={e=>setForm({...form,primaryCategory:e.target.value})}/></label>
  <label>SNS URL<input type="url" value={form.snsUrl||''} onChange={e=>setForm({...form,snsUrl:e.target.value})}/></label>
  <label>팔로워 수<input type="number" min="0" required value={form.followerCount} onChange={e=>setForm({...form,followerCount:e.target.value})}/></label><button>저장</button>
 </form></main>}
