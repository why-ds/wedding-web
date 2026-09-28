import {useState} from 'react';
import {dateday,koreanToday,weekday,type CatalogDetails,type CatalogPhoto} from './catalog';
import './details.css';

function Photo({photo,demo}:{photo:CatalogPhoto;demo:boolean}){
  const [failed,setFailed]=useState(false);
  return <figure className="detail-photo">{failed?<div className="detail-photo-missing" role="status">사진을 불러오지 못했습니다</div>:<img src={photo.url} alt={photo.caption} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}
    <figcaption><strong>{photo.caption}</strong><span>사진: {photo.credit} · {demo?'체험용 일러스트':<a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">출처 ↗</a>}</span></figcaption></figure>;
}

export default function ListingDetails({details,preview=false,demo=false}:{details:CatalogDetails;preview?:boolean;demo?:boolean}){
  const [date,setDate]=useState(''),[day,setDay]=useState(''),[time,setTime]=useState(''),[guests,setGuests]=useState('');
  const quotes=details.quotes.filter(q=>(!date||q.serviceDate===date)&&(!day||String(weekday(q.serviceDate))===day)&&(!time||q.startTime.slice(0,5)===time)&&(!guests||q.guests===Number(guests)));
  const p=details.parking,today=koreanToday();
  return <div className="listing-details">
    {details.description&&<section className="detail-section"><h2>이곳을 소개합니다</h2><p className="detail-prose">{details.description}</p></section>}
    <section className="detail-section"><div className="detail-section-heading"><h2>공간과 서비스 사진</h2><span>{details.photos.length}장</span></div>
      {details.photos.length?<div className="detail-gallery">{details.photos.map((photo,i)=><Photo key={`${i}-${photo.url}`} photo={photo} demo={demo}/>)}</div>:<p className="detail-empty">확인된 사진이 아직 등록되지 않았습니다.</p>}
    </section>
    <section className="detail-section"><h2>주차 · 오시는 길</h2><dl className="detail-facts">
      <dt>주차 가능 대수</dt><dd>{p.spaces==null?'미확인':p.spaces===0?'주차 공간 없음':`${p.spaces.toLocaleString()}대`}</dd>
      <dt>무료 주차 시간</dt><dd>{p.freeMinutes==null?'미확인':p.freeMinutes===0?'무료 시간 없음':`${p.freeMinutes}분`}</dd>
      <dt>요금 · 주차권 조건</dt><dd>{p.feeDescription||'미확인 · 무료 주차로 간주하지 않습니다'}</dd>
      <dt>발렛 제공</dt><dd>{p.valetAvailable==null?'미확인':p.valetAvailable?'제공 · 요금 및 이용 조건 별도 확인':'미제공'}</dd>
      <dt>주차장 진입 · 대체 주차</dt><dd>{p.accessDescription||'미확인'}</dd>
      <dt>셔틀 · 대중교통</dt><dd>{p.shuttleDescription||'미확인'}</dd>
    </dl><p className="detail-note">주차 대수는 등록된 시설 정보입니다. 행사 당일의 여유 공간을 보장하지 않습니다.</p></section>
    <section className="detail-section"><div className="detail-section-heading"><h2>{demo?'조건별 가상 견적':'조건별 참고 견적'}</h2><span>{details.quotes.length}건</span></div>
      <p className="detail-note">등록된 날짜·시간·인원의 견적 사례입니다. 실시간 예약 가능 여부와 확정 계약 금액은 업체 확인이 필요합니다. 다른 조건으로 자동 환산하지 않습니다. 모든 시간은 한국 시간입니다.</p>
      {!preview&&details.quotes.length>0&&<div className="detail-quote-filters">
        <label>적용 날짜<input type="date" value={date} onChange={e=>{setDate(e.target.value);setDay('');}}/></label>
        <label>요일<select aria-label="요일" value={day} onChange={e=>{setDay(e.target.value);setDate('');}}><option value="">전체 요일</option>{['일요일','월요일','화요일','수요일','목요일','금요일','토요일'].map((d,i)=><option key={d} value={i}>{d}</option>)}</select></label>
        <label>시작 시각<input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label>
        <label>예상 인원<input type="number" min={1} max={10000} placeholder="전체" value={guests} onChange={e=>setGuests(e.target.value)}/></label>
        <button className="secondary" onClick={()=>{setDate('');setDay('');setTime('');setGuests('');}}>조건 초기화</button>
      </div>}
      {!quotes.length?<p className="detail-empty">{details.quotes.length?'해당 조건으로 등록된 견적이 없습니다. 다른 날짜의 금액으로 대체하지 않습니다.':'확인된 견적이 아직 등록되지 않았습니다.'}</p>:<div className="reference-quotes">{quotes.map((q,i)=>{
        const expired=Boolean(q.validUntil&&q.validUntil<today),past=q.serviceDate<today;
        const stale=new Date(`${q.checkedOn}T00:00:00Z`).getTime()<new Date(`${today}T00:00:00Z`).getTime()-90*86400000;
        return <article className="reference-quote" key={i}>
          <div className="quote-scenario"><span>{dateday(q.serviceDate)}</span><strong>{q.startTime.slice(0,5)} 시작</strong></div>
          <h3>{q.title}</h3><div className="quote-price"><strong>{q.amount.toLocaleString('ko-KR')}원</strong><span>{q.taxStatus==='INCLUDED'?'부가세 포함':q.taxStatus==='EXCLUDED'?'부가세 별도':'부가세 미확인'}</span></div>
          {(expired||past||stale)&&<p className="quote-expired">{expired?'견적 유효 기한 경과':past?'지난 일정의 견적 사례':'확인 후 90일 경과'} · 최신 금액 재확인 필요</p>}
          <dl className="detail-facts"><dt>예상 인원</dt><dd>{q.guests==null?'인원 조건 미등록':`${q.guests}명`}</dd><dt>최소 보증 인원</dt><dd>{q.minimumGuests==null?'미등록':`${q.minimumGuests}명`}</dd>
          <dt>포함 항목</dt><dd>{q.included}</dd><dt>별도 · 제외 항목</dt><dd>{q.excluded}</dd><dt>추가 적용 조건</dt><dd>{q.conditions||'추가 조건 미등록 · 업체 확인 필요'}</dd><dt>{demo?'가상 자료 기준일':'금액 확인일'}</dt><dd>{q.checkedOn}</dd><dt>견적 유효 기한</dt><dd>{q.validUntil||'미확인'}</dd></dl>
          {demo?<p className="detail-note">실제 금액이 아닌 화면 확인용 가상 견적입니다.</p>:<a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">이 견적의 출처 보기 ↗</a>}
        </article>;
      })}</div>}
    </section>
  </div>;
}
