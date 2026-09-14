import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDownUp, ArrowRight, Building2, CalendarDays, Check, ChevronRight, CircleHelp, Heart, MapPin, Search, SlidersHorizontal, Users, X, Camera, Gem, Sparkles, Shirt, Flower2, Scale, Leaf, RotateCcw } from 'lucide-react';
import { defaults, initialCriteria, search, type Criteria, type Estimate } from './api';
import AccountDialog from './AccountDialog';
import Brand from './Brand';
import { useMembership } from './membership';

const won = (value: string | number) => `${Number(value).toLocaleString('ko-KR')}원`;
const man = (value: string) => `${(Number(value)/10000).toLocaleString('ko-KR')}만원`;
const categories = [{ name:'예식장', icon: Building2 },{ name:'스튜디오', icon: Camera },{ name:'드레스', icon: Flower2 },{ name:'메이크업', icon: Sparkles },{ name:'예물', icon: Gem },{ name:'한복', icon: Leaf },{ name:'예복', icon: Shirt }];

export default function App() {
  const [draft,setDraft] = useState<Criteria>(initialCriteria);
  const [criteria,setCriteria] = useState<Criteria>(initialCriteria);
  const [results,setResults] = useState<Estimate[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  const [onlySaved,setOnlySaved] = useState(false);
  const [selected,setSelected] = useState<string[]>([]);
  const [detail,setDetail] = useState<Estimate|null>(null);
  const [compareOpen,setCompareOpen] = useState(false);
  const [toast,setToast] = useState('');
  const [accountOpen,setAccountOpen] = useState(false);
  const membership=useMembership(setToast);
  const {favorites,favorite}=membership;
  const [category,setCategory] = useState('예식장');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setError(''); setSelected([]); setDetail(null); setCompareOpen(false);
    search(criteria,abort.signal).then(data=>setResults(data.results)).catch(err=> { if (err.name !== 'AbortError') { setError(err.message); setResults([]); } }).finally(()=> { if(!abort.signal.aborted) setLoading(false); });
    return ()=>abort.abort();
  },[criteria,retry]);
  useEffect(()=> { if (toast) { const t=setTimeout(()=>setToast(''),3000); return ()=>clearTimeout(t); } },[toast]);
  useEffect(()=> { if(detail || compareOpen) dialog.current?.showModal(); else dialog.current?.close(); },[detail,compareOpen]);
  function select(id:string) { if(selected.includes(id)) setSelected(selected.filter(x=>x!==id)); else if(selected.length<5) setSelected([...selected,id]); else setToast('한 번에 최대 5곳까지 비교할 수 있어요.'); }
  function submit(event:FormEvent) { event.preventDefault(); setCriteria({...draft}); }
  function reset() { setDraft({...defaults}); setCriteria({...defaults}); setOnlySaved(false); }
  const visible=results.filter(e=>!onlySaved||favorites.includes(e.venue.id));
  const compared=results.filter(e=>selected.includes(e.venue.id));
  const complete=visible.filter(e=>e.totalMax!==null);
  return <>
    <header className="header"><div className="header-inner">
      <a className="site-brand" href="/" aria-label="All About Wedding 홈"><Brand/><i>함께 고르는 결혼 준비</i></a>
      <nav aria-label="주 메뉴"><button className={!onlySaved?'nav-active':''} onClick={()=>setOnlySaved(false)}>업체 둘러보기</button><button className={onlySaved?'nav-active':''} onClick={()=>setOnlySaved(true)}><Heart size={16}/>찜한 업체 <span>{favorites.length}</span></button></nav>
      <button className="member-button" disabled={!membership.ready||membership.saving} onClick={()=>setAccountOpen(true)}><Users size={15}/><span>{!membership.ready?'확인 중…':membership.member?`${membership.member.displayName}님`:'로그인 · 회원가입'}</span></button>
      {membership.member?.admin&&<a className="member-button" href="/admin">관리자</a>}
      <span className="preview-label">PREVIEW <span>초안</span></span>
    </div></header>
    <div className="category-bar"><div className="categories">{categories.map(({name,icon:Icon})=><button key={name} className={category===name?'active':''} onClick={()=>setCategory(name)}><Icon size={19}/>{name}{name!=='예식장'&&<small>준비 중</small>}</button>)}</div></div>
    <main>
      <div className="breadcrumbs">결혼 준비 <ChevronRight size={12}/> 업체 비교 <ChevronRight size={12}/><strong>{category}</strong></div>
      <section className="page-intro"><div><div className="eyebrow">YOUR DAY, YOUR WAY</div><h1>우리의 시작에 맞는 {category}</h1><p>같은 조건으로 살펴보고, 포함된 구성까지 비교하세요.</p></div><div className="intro-note"><Leaf size={25}/><span>하나씩, 함께<br/><strong>더 나은 선택으로.</strong></span></div></section>
      <div className="demo-notice"><span>가상 데이터</span> 업체·금액·시설은 개발용 예시입니다. 실제 업체 정보나 예약 가능한 가격이 아닙니다.</div>
      {category!=='예식장'?<section className="empty category-empty"><Sparkles size={35}/><h2>{category} 비교를 준비하고 있어요</h2><p>현재 초안에서는 예식장 검색과 총액 비교를 먼저 살펴볼 수 있습니다.</p><button className="primary" onClick={()=>setCategory('예식장')}>예식장 둘러보기 <ArrowRight size={16}/></button></section>:<>
      <form className="condition-bar" onSubmit={submit}>
        <label><MapPin size={18}/><span>희망 지역<select value={draft.region} onChange={e=>setDraft({...draft,region:e.target.value})}><option value="">서울 전체</option>{['강남','서초','송파','영등포'].map(x=><option key={x}>{x}</option>)}</select></span></label>
        <label><CalendarDays size={18}/><span>예식 날짜<input aria-label="예식 날짜" type="date" required min="2027-01-01" max="2027-12-31" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></span></label>
        <label className="time-field"><span>시작 시간<input aria-label="시작 시간" type="time" required value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})}/></span></label>
        <label><Users size={18}/><span>예상 성인 인원<input aria-label="예상 성인 인원" type="number" min="1" max="2000" required value={draft.guests || ''} onChange={e=>setDraft({...draft,guests:Number(e.target.value)})}/></span><b>명</b></label>
        <button className="primary search-button" type="submit"><Search size={18}/>내 조건으로 검색</button>
      </form>
      <div className="workspace"><aside className="filters"><div className="filter-heading"><h2><SlidersHorizontal size={17}/>상세 조건</h2><button onClick={reset} className="reset"><RotateCcw size={13}/>초기화</button></div>
        <label className="filter-block"><strong>예식장 이름</strong><div className="query"><Search size={15}/><input value={draft.query} placeholder="어떤 공간을 찾으세요?" maxLength={100} onChange={e=>setDraft({...draft,query:e.target.value})}/></div></label>
        <label className="filter-block"><strong>예상 총예산</strong><select value={draft.budget??''} onChange={e=>setDraft({...draft,budget:e.target.value?Number(e.target.value):null})}><option value="">전체 예산</option><option value="20000000">2,000만원 이하</option><option value="27000000">2,700만원 이하</option><option value="30000000">3,000만원 이하</option><option value="40000000">4,000만원 이하</option></select><small>필수 비용이 확인된 총액 기준</small></label>
        <fieldset className="filter-block"><legend>공간 스타일</legend>{['','호텔','가든','채플','하우스'].map(x=><label className="radio" key={x}><input type="radio" name="style" checked={draft.style===x} onChange={()=>setDraft({...draft,style:x})}/>{x||'전체 스타일'}</label>)}</fieldset>
        <div className="filter-block"><strong>추가 구성</strong><label className="checkbox"><input type="checkbox" checked={draft.beverages} onChange={e=>setDraft({...draft,beverages:e.target.checked})}/>주류·음료 포함</label><small>선택한 항목을 총액에 반영해요.</small></div>
        <button className="filter-apply" onClick={()=>setCriteria({...draft})}>조건 적용 <ArrowRight size={15}/></button>
        <div className="help-note"><CircleHelp size={18}/><div><strong>시작가와 총액은 달라요</strong><p>보증인원, 대관료, 필수 장식비를 함께 확인하세요. 보증금은 별도 문의가 필요해요.</p></div></div>
      </aside>
      <section className="results" aria-busy={loading}>
        <div className="results-top"><h2>{onlySaved?'찜한 예식장':'예식장'} <span>{loading?'…':visible.length}</span></h2><label className="sort"><ArrowDownUp size={14}/><select aria-label="정렬" value={criteria.sort} onChange={e=>{setDraft({...draft,sort:e.target.value});setCriteria({...criteria,sort:e.target.value});}}><option value="price">예상 총액 낮은 순</option><option value="meal">1인 식대 낮은 순</option></select></label></div>
        <div className="applied"><Check size={14}/>{criteria.date.replaceAll('-','.')} · {criteria.time} · 성인 {criteria.guests}명 · {criteria.beverages?'주류 포함':'주류 제외'}<span>부가세 포함</span></div>
        {onlySaved&&<div className="member-storage">{membership.member?`${membership.member.displayName}님의 계정 찜 · 현재 검색 조건 적용 중`:'비회원 찜은 이 브라우저에 저장됩니다.'}{!membership.member&&<button onClick={()=>setAccountOpen(true)}>회원으로 시작하기</button>}</div>}
        {loading?<div className="empty" role="status"><div className="spinner"/><h3>같은 조건으로 금액을 계산하고 있어요</h3></div>:error?<div className="empty" role="alert"><CircleHelp size={30}/><h3>검색을 불러오지 못했어요</h3><p>{error}</p><button className="primary" onClick={()=>setRetry(retry+1)}>다시 시도</button></div>:visible.length===0?<div className="empty"><Search size={32}/><h3>{onlySaved?'아직 찜한 업체가 없어요':'조건에 맞는 예식장이 없어요'}</h3><p>지역과 예산 조건을 넓히거나 다른 인원으로 검색해 보세요.</p><button className="secondary" onClick={reset}>전체 조건으로 보기</button></div>:<div className="card-list">{visible.map((e,index)=><article className={`venue-card ${e.state==='UNAVAILABLE'?'unavailable':''}`} key={e.venue.id}>
          <div className={`venue-cover cover-${e.venue.style}`}><span className="cover-label">{e.venue.style.toUpperCase()} WEDDING</span><span className="cover-name">{e.venue.hall}</span><span className="cover-bottom">ALL ABOUT WEDDING <span>0{index+1}</span></span><button className={`heart ${favorites.includes(e.venue.id)?'saved':''}`} aria-label={`${e.venue.name} ${favorites.includes(e.venue.id)?'찜 해제':'찜하기'}`} disabled={!membership.ready||membership.saving} aria-pressed={favorites.includes(e.venue.id)} onClick={()=>favorite(e.venue.id)}><Heart size={17} fill={favorites.includes(e.venue.id)?'currentColor':'none'}/></button></div>
          <div className="venue-body"><div className="venue-meta"><span><MapPin size={12}/>서울 {e.venue.region}</span><span>{e.venue.style} 예식</span>{complete[0]?.venue.id===e.venue.id&&criteria.sort==='price'&&<span className="best">조건 내 최저 총액</span>}</div><button className="venue-title" onClick={()=>setDetail(e)}>{e.venue.name}<ChevronRight size={18}/></button><p className="hall-name">{e.venue.hall} · 보증 {e.venue.guarantee}명 · 최대 {e.venue.capacity}명</p><div className="features">{e.venue.features.map(x=><span key={x}>{x}</span>)}</div><div className="review-note">등록된 후기 없음 <span>· 일정 확인 필요</span></div>
          <div className="price-row"><div><span className="price-caption">{e.state==='UNAVAILABLE'?'조건 미지원':e.state==='PARTIAL'?'확인된 비용 소계':'내 조건 예상 총액'}</span><div className={`price ${e.state==='PARTIAL'?'partial':''}`}>{e.state==='UNAVAILABLE'?'문의 필요':man(e.totalMax??e.knownSubtotal)}{e.state==='PARTIAL'&&<small>+ 미확인 비용</small>}</div></div><span className="meal">1인 식대 <strong>{won(e.venue.meal)}</strong></span></div>
          {e.unknownItems.length>0&&<p className="unknown">{e.unknownItems.join(' · ')}</p>}
          <div className="card-actions"><label><input type="checkbox" checked={selected.includes(e.venue.id)} onChange={()=>select(e.venue.id)}/>비교함에 담기</label><button onClick={()=>setDetail(e)}>구성·금액 자세히 <ArrowRight size={14}/></button></div></div>
        </article>)}</div>}
        <p className="results-footnote">예상 총액은 예약·계약 확정 금액이 아닙니다. 보증금은 별도이며, 소인과 공휴일 특별요금은 이번 가상 계산에 포함되지 않습니다.</p>
      </section></div></>}
      <footer><a href="/" className="site-brand" aria-label="All About Wedding 홈"><Brand/></a><span>우리다운 결혼 준비, 함께 고르는 순간부터.</span><small>DEVELOPMENT PREVIEW · 2026</small></footer>
    </main>
    {selected.length>0&&category==='예식장'&&<div className="compare-tray"><div className="tray-icon"><Scale size={22}/></div><div><strong>비교함 <span>{selected.length}/5</span></strong><p>{compared.map(e=>e.venue.name).join(' · ')}</p></div><button className="tray-clear" onClick={()=>setSelected([])}>비우기</button><button className="primary" disabled={selected.length<2||loading} onClick={()=>setCompareOpen(true)}>{selected.length<2?'한 곳 더 선택해 주세요':'한눈에 비교하기'}<ArrowRight size={16}/></button></div>}
    <dialog ref={dialog} className={compareOpen?'comparison-dialog':''} onCancel={()=>{setDetail(null);setCompareOpen(false);}} onClick={e=>{if(e.target===e.currentTarget){setDetail(null);setCompareOpen(false);}}}>
      <button className="dialog-close" aria-label="닫기" onClick={()=>{setDetail(null);setCompareOpen(false);}}><X size={22}/></button>
      {detail&&<><div className="eyebrow">VENUE DETAILS</div><h2>{detail.venue.name}</h2><p className="detail-address"><MapPin size={14}/>{detail.venue.address} · {detail.venue.hall}</p><p className="detail-description">{detail.venue.description}</p><div className="detail-total"><span>{detail.state==='PARTIAL'?'확인된 비용 소계':'내 조건 예상 총액'}</span><strong>{detail.state==='UNAVAILABLE'?'문의 필요':won(detail.totalMax??detail.knownSubtotal)}</strong><small>{criteria.date} · {criteria.time} · 성인 {criteria.guests}명</small></div><h3>금액 구성</h3>{detail.lines.map(l=><div className="cost-line" key={l.label}><div><strong>{l.label}</strong><small>{l.explanation} · 수량 {l.quantity}</small></div><span>{won(l.amount)}</span></div>)}{detail.unknownItems.map(x=><p className="unknown" key={x}>{x}</p>)}<div className="detail-caution">반환형 보증금: 금액 미확인<br/>일정: 업체 확인 필요<br/>후기: 등록된 후기 없음</div><button className="primary full" onClick={()=>{select(detail.venue.id);setDetail(null);}}>{selected.includes(detail.venue.id)?'비교함에서 빼기':'비교함에 담기'}<Scale size={16}/></button></>}
      {compareOpen&&<><div className="eyebrow">SIDE BY SIDE</div><h2>같은 조건으로, 한눈에</h2><p className="detail-address">{criteria.date} · {criteria.time} · 성인 {criteria.guests}명 · {criteria.beverages?'주류 포함':'주류 제외'}</p><div className="table-scroll"><table><thead><tr><th>비교 항목</th>{compared.map(e=><th key={e.venue.id}>{e.venue.name}<small>{e.venue.hall}</small></th>)}</tr></thead><tbody>
        <tr className="total-table"><th>예상 총액</th>{compared.map(e=><td key={e.venue.id}>{e.totalMax?man(e.totalMax):e.state==='PARTIAL'?<>소계 {man(e.knownSubtotal)}<small>추가 비용 미확인</small></>:'조건 미지원'}</td>)}</tr>
        <tr><th>지역 · 스타일</th>{compared.map(e=><td key={e.venue.id}>{e.venue.region} · {e.venue.style}</td>)}</tr>
        <tr><th>1인 식대</th>{compared.map(e=><td key={e.venue.id}>{won(e.venue.meal)}</td>)}</tr>
        <tr><th>보증 / 청구 인원</th>{compared.map(e=><td key={e.venue.id}>{e.venue.guarantee}명 / {e.billedGuests||'—'}명</td>)}</tr>
        {[...new Set(compared.flatMap(e=>e.lines.map(l=>l.label)))].map(label=><tr key={label}><th>{label}</th>{compared.map(e=><td key={e.venue.id}>{e.lines.find(l=>l.label===label)?won(e.lines.find(l=>l.label===label)!.amount):'— / 확인 필요'}</td>)}</tr>)}
        <tr><th>미확인 항목</th>{compared.map(e=><td key={e.venue.id}>{e.unknownItems.join(', ')||'소비 비용 없음'}<small>보증금·일정 별도 확인</small></td>)}</tr>
      </tbody></table></div><p className="results-footnote">미확인 비용이 있는 소계는 완전한 총액과 직접 비교할 수 없습니다. 모든 업체는 개발용 가상 데이터입니다.</p></>}
    </dialog>
    {accountOpen&&<AccountDialog member={membership.member} ephemeral={membership.ephemeral} count={favorites.length} onClose={()=>setAccountOpen(false)} onChanged={membership.refresh} notify={setToast}/>}
    {toast&&<div role="status" className="toast">{toast}</div>}
  </>;
}
