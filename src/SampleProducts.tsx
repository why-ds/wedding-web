import {useEffect,useState} from 'react';
import {memberRequest} from './membership';
import './sample-products.css';

type Product={id:string;name:string;amount:number;previousAmount:number|null;taxStatus:string;operators:number;facts:{label:string;value:string}[]};
type Option={id:string;name:string;amount:number;unit:'ONCE'|'PER_HOUR_PER_OPERATOR';group:string;productIds:string[];operatorsOverride:number|null;additionalOperators:number;description:string};
export type ProductSheet={sourceKind:string;sourceDescription:string;categoryNote:string;caveats:string[];travel:{minimum:number|null;maximum:number|null;description:string};products:Product[];options:Option[]};
type Estimate={demo:boolean;productId:string;lines:{name:string;unitAmount:number;quantity:number;amount:number}[];subtotal:number;travelMinimum:number|null;travelMaximum:number|null;rangeMinimum:number|null;rangeMaximum:number|null;operators:number;taxStatus:string;unresolved:string[]};
const money=(n:number)=>`${n.toLocaleString('ko-KR')}원`;

export default function SampleProducts({listingId,sheet}:{listingId:string;sheet:ProductSheet}){
  const [productId,setProductId]=useState(sheet.products[0].id),[selected,setSelected]=useState<string[]>([]);
  const [hours,setHours]=useState(1),[extensionOperators,setExtensionOperators]=useState(1),[travel,setTravel]=useState('UNKNOWN'),[retry,setRetry]=useState(0);
  const [response,setResponse]=useState<{key:string;estimate?:Estimate;error?:string}|null>(null);
  const product=sheet.products.find(p=>p.id===productId)!;
  const options=sheet.options.filter(o=>o.productIds.includes(productId));
  const chosen=options.filter(o=>selected.includes(o.id));
  const operators=(chosen.find(o=>o.operatorsOverride!=null)?.operatorsOverride??product.operators)+chosen.reduce((sum,o)=>sum+o.additionalOperators,0);
  const extension=chosen.some(o=>o.unit==='PER_HOUR_PER_OPERATOR');
  const params=new URLSearchParams({productId,hours:String(hours),extensionOperators:String(Math.min(extensionOperators,operators)),travel});
  selected.forEach(id=>params.append('option',id));
  const key=params.toString();
  useEffect(()=>{let active=true;
    memberRequest<Estimate>(`/demo/directory/${encodeURIComponent(listingId)}/product-estimate?${key}`)
      .then(estimate=>{if(!estimate.demo)throw new Error('체험 견적 표시를 확인할 수 없습니다.');if(active)setResponse({key,estimate});})
      .catch(e=>{if(active)setResponse({key,error:e.message});});
    return()=>{active=false;};
  },[key,listingId,retry]);
  const current=response?.key===key?response:null;
  const estimate=current?.estimate;
  function chooseProduct(id:string){setProductId(id);setSelected([]);setHours(1);setExtensionOperators(1);}
  function toggle(o:Option){setSelected(prev=>prev.includes(o.id)?prev.filter(id=>id!==o.id):[...prev.filter(id=>o.group!=='DESIGNATION'||!options.some(other=>other.id===id&&other.group==='DESIGNATION')),o.id]);setExtensionOperators(1);}
  return <section className="sample-products detail-section" aria-labelledby="sample-products-title">
    <div className="eyebrow">REFERENCE PRODUCTS</div><h2 id="sample-products-title">상품 구성 · 옵션 비교</h2>
    <p>{sheet.categoryNote}</p><p className="detail-note">{sheet.sourceDescription}</p>
    <div className="sample-product-grid">{sheet.products.map(p=><article className={`sample-product-card ${productId===p.id?'selected':''}`} key={p.id}>
      <h3>{p.name}</h3><strong className="sample-product-price">{money(p.amount)}</strong><span>{p.taxStatus==='INCLUDED'?'부가세 포함':'부가세 미확인'}</span>
      {p.previousAmount!=null&&<small>자료의 취소선 표기: <s>{money(p.previousAmount)}</s><br/>현재 할인 여부 미확인</small>}
      <button className="secondary" aria-pressed={productId===p.id} onClick={()=>chooseProduct(p.id)}>{productId===p.id?'선택된 상품':'이 상품 선택'}</button>
      <dl>{p.facts.map(f=><div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}</dl>
    </article>)}</div>
    <div className="sample-calculator"><div><h3>{product.name} 추가 옵션</h3><p className="detail-note">작가 지정은 하나만 선택할 수 있습니다. 상품을 변경하면 추가 옵션을 초기화합니다.</p>
      <fieldset><legend>작가 지정</legend><label className="sample-option"><input type="radio" name="sample-designation" checked={!chosen.some(o=>o.group==='DESIGNATION')} onChange={()=>{setSelected(prev=>prev.filter(id=>!options.some(o=>o.id===id&&o.group==='DESIGNATION')));setExtensionOperators(1);}}/>기본 작가 · 지정 없음</label>
        {options.filter(o=>o.group==='DESIGNATION').map(o=><label className="sample-option" key={o.id}><input type="radio" name="sample-designation" checked={selected.includes(o.id)} onChange={()=>toggle(o)}/><span><strong>{o.name} · +{money(o.amount)}</strong><small>{o.description}</small></span></label>)}
      </fieldset>
      {options.some(o=>o.group!=='DESIGNATION')&&<fieldset><legend>촬영 추가</legend>{options.filter(o=>o.group!=='DESIGNATION').map(o=><label className="sample-option" key={o.id}><input type="checkbox" checked={selected.includes(o.id)} onChange={()=>toggle(o)}/><span><strong>{o.name} · +{money(o.amount)}{o.unit==='PER_HOUR_PER_OPERATOR'?' / 시간 / 작가':''}</strong><small>{o.description}</small></span></label>)}</fieldset>}
      {extension&&<div className="sample-extension"><label>추가 시간<select value={hours} onChange={e=>setHours(Number(e.target.value))}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1}시간</option>)}</select></label><label>연장할 작가 수<select value={Math.min(extensionOperators,operators)} onChange={e=>setExtensionOperators(Number(e.target.value))}>{Array.from({length:operators},(_,i)=><option key={i} value={i+1}>{i+1}명</option>)}</select></label><p>전체 촬영 인원과 연장 인원은 별개입니다. 선택한 인원의 연장비만 계산합니다.</p></div>}
      <label className="sample-travel">출장비 가정<select value={travel} onChange={e=>setTravel(e.target.value)}><option value="UNKNOWN">아직 확인하지 않았어요</option><option value="APPLIES">자료의 출장비 적용 조건에 해당해요</option><option value="NOT_APPLICABLE">출장비가 없다고 확인한 경우로 계산</option></select></label><p className="detail-note">{sheet.travel.description}</p>
    </div><aside className="sample-estimate" aria-label="선택 상품 참고 계산" aria-live="polite" aria-busy={!current}>
      <h3>선택 상품 참고 계산</h3>{!current?<p role="status">선택 조건으로 계산하고 있습니다.</p>:current.error?<><p role="alert">{current.error}</p><button className="secondary" onClick={()=>setRetry(n=>n+1)}>다시 계산</button></>:estimate&&<>
        <p>선택 촬영 인원 {estimate.operators}명 · 촬영 범위는 옵션별 확인</p>
        <ul className="sample-estimate-lines">{estimate.lines.map((line,i)=><li key={i}><span>{line.name}{line.quantity>1&&<small>{money(line.unitAmount)} × {line.quantity} (시간 × 인원)</small>}</span><strong>{money(line.amount)}</strong></li>)}</ul>
        <p>상품·선택 옵션 소계</p><strong className="sample-product-price">{money(estimate.subtotal)}</strong>
        <p>{estimate.taxStatus==='INCLUDED'?'상품·옵션 부가세 포함':'부가세 미확인 · 세액을 임의로 더하지 않았습니다'}</p>
        {estimate.rangeMinimum!=null&&estimate.rangeMaximum!=null?<p>출장비 가정 반영: <strong>{money(estimate.rangeMinimum)}{estimate.rangeMaximum!==estimate.rangeMinimum?` ~ ${money(estimate.rangeMaximum)}`:''}</strong></p>:<p>출장비 미포함 · 금액 미확인</p>}
        <strong>확정 계약 금액이 아닙니다</strong><ul>{estimate.unresolved.map(text=><li key={text}>{text}</li>)}</ul>
      </>}
    </aside></div>
    <div className="sample-source-notes"><h3>자료를 읽을 때 확인할 점</h3><ul>{sheet.caveats.map(text=><li key={text}>{text}</li>)}</ul></div>
  </section>;
}
