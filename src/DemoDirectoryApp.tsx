import {useEffect,useState,type FormEvent} from 'react';
import Brand from './Brand';
import {catalogCategories,type DirectoryEntry} from './catalog';
import {memberRequest} from './membership';
import './directory.css';

export default function DemoDirectoryApp(){
  const requestedCategory=new URLSearchParams(location.search).get('category')??'';
  const initialCategory=Object.hasOwn(catalogCategories,requestedCategory)?requestedCategory:'';
  const [category,setCategory]=useState(initialCategory),[query,setQuery]=useState(''),[filter,setFilter]=useState({category:initialCategory,query:''}),[page,setPage]=useState(0),[retry,setRetry]=useState(0);
  const [result,setResult]=useState<{items:DirectoryEntry[];total:number;persistent:boolean;demo:boolean}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{let current=true;setLoading(true);setError('');memberRequest<NonNullable<typeof result>>(`/demo/directory?${new URLSearchParams({...filter,page:String(page)})}`).then(r=>{if(!r.demo)throw new Error('체험 데이터 표시를 확인할 수 없습니다.');if(current)setResult(r);}).catch(e=>{if(current)setError(e.message);}).finally(()=>{if(current)setLoading(false);});return()=>{current=false;};},[filter,page,retry]);
  function chooseCategory(code:string){setCategory(code);setQuery('');setFilter({category:code,query:''});setPage(0);history.replaceState(null,'',code?`/preview/catalog?category=${code}`:'/preview/catalog');}
  function submit(e:FormEvent){e.preventDefault();setFilter({category,query});setPage(0);}
  return <div className="directory-shell"><header className="directory-header"><a href="/" aria-label="All About Wedding 홈"><Brand/></a><nav><a href="/">실제 업체 목록</a><a href="/admin">관리자</a></nav></header>
    <main className="directory-main"><div className="eyebrow">SAMPLE DIRECTORY</div><h1>업종별로 미리 둘러보기</h1><p className="directory-intro">10개 업종, 각 2개의 가상 업체로 상세 화면과 견적 조건을 살펴보세요.</p>
      <div className="catalog-demo-notice"><strong>체험용 샘플 · 실제 판매 여부 미검증</strong><p>업체와 이미지는 가상 예시입니다. 아이폰스냅·본식스냅 샘플 A는 사용자 제공 자료로 상품과 옵션을 비교합니다. 최신 가격과 예약 가능 여부는 미확인이며, 실제 업체 목록·회원 찜·관리자 검수 자료와 분리되어 있습니다.</p></div>
      <nav className="catalog-category-tabs" aria-label="체험 업종 바로 선택"><button type="button" aria-pressed={filter.category===''} onClick={()=>chooseCategory('')}>전체</button>{Object.entries(catalogCategories).map(([code,name])=><button type="button" key={code} aria-pressed={filter.category===code} onClick={()=>chooseCategory(code)}>{name}</button>)}</nav>
      <form className="directory-filters" onSubmit={submit}><label>업종<select aria-label="체험 업종" value={category} onChange={e=>setCategory(e.target.value)}><option value="">모든 업종</option>{Object.entries(catalogCategories).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label><label>샘플 이름 · 지역<input maxLength={100} value={query} onChange={e=>setQuery(e.target.value)} placeholder="예: 메이크업, 강남"/></label><button className="primary">찾아보기</button></form>
      {loading?<p role="status">체험 자료를 불러오고 있습니다.</p>:error?<section className="directory-empty" role="alert"><h2>체험 자료를 불러오지 못했습니다</h2><p>{error}</p><button className="secondary" onClick={()=>setRetry(x=>x+1)}>다시 시도</button></section>:<>
        <p className="directory-count">가상 업체 {result?.total??0}곳 · 상품 구성·추가 옵션·조건별 견적 예시</p>
        {result?.items.length?<div className="directory-grid">{result.items.map(item=><article className="directory-card demo-catalog-card" key={item.id}>
          <a href={`/preview/catalog/${item.id}`}><img src={`/demo-assets/${item.category.toLowerCase()}.svg`} alt={`${catalogCategories[item.category]} 가상 일러스트`} loading="lazy"/><span className="directory-category">{catalogCategories[item.category]} · 가상</span><h2>{item.organizationName}</h2></a><p>{item.region}</p><p>상품 구성 · 주차 · 참고 견적 예시</p><a className="directory-detail-link" href={`/preview/catalog/${item.id}`}>가상 상세 살펴보기 →</a>
        </article>)}</div>:<p className="directory-empty">{result?.persistent?'일치하는 체험 자료가 없습니다.':'이 환경에는 PostgreSQL 체험 자료가 연결되지 않았습니다.'}</p>}
        <div className="directory-pagination"><button className="secondary" disabled={page===0} onClick={()=>setPage(x=>x-1)}>이전</button><span>{page+1}페이지</span><button className="secondary" disabled={(page+1)*20>=(result?.total??0)} onClick={()=>setPage(x=>x+1)}>다음</button></div>
      </>}
    </main>
  </div>;
}
