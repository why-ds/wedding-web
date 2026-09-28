import {useEffect,useState} from 'react';
import Brand from './Brand';
import {catalogCategories,emptyDetails,type DirectoryEntry,type CatalogDetails} from './catalog';
import {memberRequest,MemberError,useMembership} from './membership';
import AccountDialog from './AccountDialog';
import ListingDetails from './ListingDetails';
import SampleProducts,{type ProductSheet} from './SampleProducts';
import './directory.css';

export default function DirectoryDetailApp({demo=false}:{demo?:boolean}){
  const id=location.pathname.split('/').filter(Boolean).at(-1)!;
  const listPath=demo?'/preview/catalog':'/';
  const [data,setData]=useState<{listing:DirectoryEntry;details:CatalogDetails;timezone:string;demo?:boolean;productSheet?:ProductSheet}|null>(null),[error,setError]=useState(''),[missing,setMissing]=useState(false),[retry,setRetry]=useState(0);
  const [notice,setNotice]=useState(''),[account,setAccount]=useState(false);const membership=useMembership(setNotice);
  useEffect(()=>{let current=true;setError('');setData(null);setMissing(false);memberRequest<NonNullable<typeof data>>(`${demo?'/demo/directory':'/directory'}/${encodeURIComponent(id)}`).then(r=>{if(demo&&!r.demo)throw new Error('체험 데이터 표시를 확인할 수 없습니다.');if(current)setData(r);}).catch(e=>{if(current){setError(e.message);setMissing(e instanceof MemberError&&e.status===404);}});return()=>{current=false;};},[id,retry,demo]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(timer);},[notice]);
  return <div className="directory-shell"><header className="directory-header"><a href="/" aria-label="All About Wedding 홈"><Brand/></a><nav><a href={listPath}>{demo?'체험 목록':'전체 업체'}</a><button disabled={!membership.ready} onClick={()=>setAccount(true)}>{membership.member?`${membership.member.displayName}님`:'로그인 · 회원가입'}</button></nav></header>
    <main className="directory-main detail-main"><a href={listPath} className="detail-back">← {demo?'가상 업체 체험 목록':'업체 목록'}</a>{demo&&<div className="catalog-demo-notice"><strong>체험용 샘플 · 실제 판매 여부 미검증</strong><p>업체와 이미지는 가상 예시입니다. 사용자 제공 참고 상품에는 출처와 미확인 항목을 별도로 표시합니다. 실제 예약 상품이 아니며 회원 찜에 저장되지 않습니다.</p></div>}
      {error?<section className="directory-empty" role="alert"><h1>{missing?'현재 공개되지 않은 업체입니다':'상세 정보를 불러오지 못했습니다'}</h1><p>{error}</p>{!missing&&<button className="secondary" onClick={()=>setRetry(x=>x+1)}>다시 시도</button>}</section>:!data?<p role="status">상세 정보를 불러오고 있습니다.</p>:<>
        <div className="detail-heading"><div><span className="directory-category">{catalogCategories[data.listing.category]} · {data.listing.region}</span><h1>{data.listing.organizationName}</h1><p>{data.listing.branchName}</p></div>{!demo&&<button className="secondary" disabled={!membership.ready||!membership.available||membership.saving} aria-pressed={membership.favorites.includes(id)} onClick={()=>{if(!membership.member)setAccount(true);else void membership.favorite(id);}}>{membership.favorites.includes(id)?'♥ 찜한 업체':'♡ 내 계정에 찜'}</button>}</div>
        <div className="detail-contact"><p>{data.listing.address}</p><p>{demo?'가상 자료 기준일':`연락처 ${data.listing.publicPhone||'미등록'} · 정보 확인일`} {data.listing.reviewedOn}</p>{!demo&&<a href={data.listing.sourceUrl} target="_blank" rel="noopener noreferrer">업체 정보 출처 ↗</a>}</div>
        {demo&&data.productSheet&&<SampleProducts listingId={id} sheet={data.productSheet}/>}
        <ListingDetails details={data.details??emptyDetails()} demo={demo} showQuotes={!demo||!data.productSheet}/>
      </>}
    </main>{account&&<AccountDialog member={membership.member} ephemeral={membership.ephemeral} count={membership.favorites.length} onClose={()=>setAccount(false)} onChanged={membership.refresh} notify={setNotice}/>} {notice&&<div className="toast" role="status">{notice}</div>}
  </div>;
}
