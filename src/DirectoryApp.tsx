import {useEffect,useState,type FormEvent} from 'react';
import Brand from './Brand';
import {catalogCategories} from './catalog';
import {memberRequest} from './membership';
import './directory.css';

type Entry={id:string;organizationName:string;branchName:string;category:string;region:string;address:string;publicPhone:string;sourceUrl:string;reviewedOn:string};
export default function DirectoryApp(){
  const [category,setCategory]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState({category:'',query:''}),[page,setPage]=useState(0),[retry,setRetry]=useState(0);
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  const [data,setData]=useState<{items:Entry[];total:number;persistent:boolean}>({items:[],total:0,persistent:true});
  useEffect(()=>{let active=true;setLoading(true);setError('');const params=new URLSearchParams({...filter,page:String(page)});memberRequest<typeof data>(`/directory?${params}`).then(r=>{if(active)setData(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[filter,page,retry]);
  function submit(e:FormEvent){e.preventDefault();setPage(0);setFilter({category,query});}
  return <div className="directory-shell"><header className="directory-header"><a href="/" aria-label="All About Wedding 홈"><Brand/></a><nav><a href="/">예식장 견적 체험</a><a href="/admin">관리자</a></nav></header><main className="directory-main"><div className="eyebrow">WEDDING DIRECTORY</div><h1>우리의 결혼을 함께할 곳</h1><p className="directory-intro">예식장부터 본식 촬영까지, 출처를 확인한 업체 정보를 한곳에서 살펴보세요.</p>
    <form className="directory-filters" onSubmit={submit}><label>업종<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">모든 업종</option>{Object.entries(catalogCategories).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label><label>업체명 · 지역<input maxLength={100} placeholder="찾고 있는 업체나 지역" value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="primary">찾아보기</button></form>
    <p className="directory-notice">공개된 업체 기본 정보입니다. 상품 구성·가격·예약 가능 일정·후기는 아직 제공하지 않으며 업체 확인이 필요합니다.</p>
    {!data.persistent&&<p className="directory-notice">체험 모드 · 공개 업체 저장소가 연결되지 않은 개발 환경입니다.</p>}
    {loading?<section className="empty" role="status">업체 정보를 불러오고 있습니다.</section>:error?<section className="empty" role="alert"><h2>목록을 불러오지 못했습니다</h2><p>{error}</p><button className="secondary" onClick={()=>setRetry(x=>x+1)}>다시 시도</button></section>:<><p className="directory-count">공개 업체 {data.total}곳</p>{data.items.length===0?<section className="directory-empty"><h2>아직 공개된 업체가 없습니다</h2><p>업체 정보를 확인하고 있습니다. 검수를 마친 업체부터 이곳에 공개됩니다.</p><button className="secondary" onClick={()=>{setCategory('');setQuery('');setPage(0);setFilter({category:'',query:''});}}>전체 업종 보기</button></section>:<div className="directory-grid">{data.items.map(e=><article className="directory-card" key={e.id}><span className="directory-category">{catalogCategories[e.category]}</span><h2>{e.organizationName}</h2><p>{e.branchName} · {e.region}</p><dl><dt>주소</dt><dd>{e.address}</dd><dt>연락처</dt><dd>{e.publicPhone||'공개 연락처 미등록'}</dd><dt>정보 확인일</dt><dd>{e.reviewedOn}</dd></dl><a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">업체 정보 출처 보기 ↗</a></article>)}</div>}<div className="directory-pagination"><button className="secondary" disabled={page===0} onClick={()=>setPage(x=>x-1)}>이전</button><span>{page+1}페이지</span><button className="secondary" disabled={(page+1)*20>=data.total} onClick={()=>setPage(x=>x+1)}>다음</button></div></>}
  </main></div>;
}
