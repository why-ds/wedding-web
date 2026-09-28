import {dateday,koreanToday,type CatalogDetails,type CatalogPhoto,type ReferenceQuote} from '../catalog';
import './details-editor.css';

const numberOrNull=(value:string)=>value===''?null:Number(value);
export default function DetailsEditor({details,onChange,category}:{details:CatalogDetails;onChange:(value:CatalogDetails)=>void;category:string}){
  const p=details.parking;
  function photo(index:number,patch:Partial<CatalogPhoto>){onChange({...details,photos:details.photos.map((v,i)=>i===index?{...v,...patch}:v)});}
  function quote(index:number,patch:Partial<ReferenceQuote>){onChange({...details,quotes:details.quotes.map((v,i)=>i===index?{...v,...patch}:v)});}
  return <div className="details-editor">
    <h3>상세 소개</h3><label>업체 소개<textarea maxLength={2000} rows={3} value={details.description} onChange={e=>onChange({...details,description:e.target.value})}/></label>
    <h3>주차 · 교통</h3><p className="admin-editor-note">모르면 비워 두세요. 0은 주차 공간 또는 무료 시간이 없다는 뜻입니다.</p>
    <div className="admin-form-grid"><label>주차 가능 대수<input type="number" min={0} max={100000} value={p.spaces??''} onChange={e=>onChange({...details,parking:{...p,spaces:numberOrNull(e.target.value)}})}/></label><label>무료 주차 시간 (분)<input type="number" min={0} max={10080} value={p.freeMinutes??''} onChange={e=>onChange({...details,parking:{...p,freeMinutes:numberOrNull(e.target.value)}})}/></label></div>
    <label>요금 · 주차권 조건<textarea maxLength={1000} rows={2} placeholder="예: 하객 주차권 제시 시 120분 무료, 초과 요금은 별도 확인" value={p.feeDescription??''} onChange={e=>onChange({...details,parking:{...p,feeDescription:e.target.value}})}/></label>
    <label>발렛 제공<select value={p.valetAvailable==null?'':String(p.valetAvailable)} onChange={e=>onChange({...details,parking:{...p,valetAvailable:e.target.value===''?null:e.target.value==='true'}})}><option value="">미확인</option><option value="true">제공 (요금은 조건에 기재)</option><option value="false">미제공</option></select></label>
    <label>주차장 진입 · 대체 주차<textarea maxLength={1000} rows={2} value={p.accessDescription??''} onChange={e=>onChange({...details,parking:{...p,accessDescription:e.target.value}})}/></label>
    <label>셔틀 · 대중교통<textarea maxLength={1000} rows={2} value={p.shuttleDescription??''} onChange={e=>onChange({...details,parking:{...p,shuttleDescription:e.target.value}})}/></label>
    <h3>사진 ({details.photos.length}/12)</h3><p className="admin-editor-note">직접 열리는 공개 HTTPS 이미지 주소를 입력하세요. 파일 업로드는 아직 지원하지 않습니다. 게시 권한을 확보한 사진만 등록합니다.</p>
    {details.photos.map((item,i)=><section className="detail-edit-card" key={i}><div className="detail-edit-heading"><strong>사진 {i+1}</strong><button type="button" aria-label={`사진 ${i+1} 삭제`} onClick={()=>onChange({...details,photos:details.photos.filter((_,n)=>n!==i)})}>삭제</button></div>
      <label>이미지 URL<input type="url" required maxLength={1000} value={item.url} onChange={e=>photo(i,{url:e.target.value})} placeholder="https://"/></label>
      <label>사진 설명 (대체 텍스트)<input required maxLength={200} value={item.caption} onChange={e=>photo(i,{caption:e.target.value})}/></label>
      <label>사진 제공자 · 저작자<input required maxLength={200} value={item.credit} onChange={e=>photo(i,{credit:e.target.value})}/></label>
      <label>사진 출처 URL<input required type="url" maxLength={1000} value={item.sourceUrl} onChange={e=>photo(i,{sourceUrl:e.target.value})}/></label>
      <label>게시 권한 근거<select value={item.rights} onChange={e=>photo(i,{rights:e.target.value as CatalogPhoto['rights'],rightsConfirmed:false})}><option value="OWNED">직접 촬영 · 권리 보유</option><option value="PERMISSION">권리자의 게시 허락</option><option value="LICENSED">이용 허락된 라이선스</option></select></label>
      <label className="detail-edit-check"><input required type="checkbox" checked={item.rightsConfirmed} onChange={e=>photo(i,{rightsConfirmed:e.target.checked})}/>사진을 이 사이트에 게시할 권한과 표기 조건을 확인했습니다.</label>
    </section>)}
    <button type="button" className="secondary" disabled={details.photos.length>=12} onClick={()=>onChange({...details,photos:[...details.photos,{url:'',caption:'',credit:'',sourceUrl:'',rights:'PERMISSION',rightsConfirmed:false}]})}>사진 추가</button>
    <h3>조건별 참고 견적 ({details.quotes.length}/24)</h3><p className="admin-editor-note">출처에서 확인한 견적 사례만 입력합니다. 날짜·시각은 한국 기준이며 자동 견적 규칙이 아닙니다. 실제 예약 가능 여부는 확인하지 않습니다.</p>
    {details.quotes.map((item,i)=><section className="detail-edit-card" key={i}><div className="detail-edit-heading"><strong>참고 견적 {i+1}</strong><button type="button" aria-label={`참고 견적 ${i+1} 삭제`} onClick={()=>onChange({...details,quotes:details.quotes.filter((_,n)=>n!==i)})}>삭제</button></div>
      <label>견적명 · 홀 · 상품 구성<input required maxLength={120} placeholder="예: 3층 홀 · 점심 예식 · 뷔페" value={item.title} onChange={e=>quote(i,{title:e.target.value})}/></label>
      <div className="admin-form-grid"><label>적용 날짜<input required type="date" min="2020-01-01" max="2100-12-31" value={item.serviceDate} onChange={e=>quote(i,{serviceDate:e.target.value})}/><small>{dateday(item.serviceDate)}</small></label><label>시작 시각<input required type="time" step={60} value={item.startTime.slice(0,5)} onChange={e=>quote(i,{startTime:e.target.value})}/></label>
      <label>예상 인원{category==='VENUE'?' (필수)':''}<input type="number" required={category==='VENUE'||item.minimumGuests!=null} min={1} max={10000} value={item.guests??''} onChange={e=>quote(i,{guests:numberOrNull(e.target.value)})}/></label>
      <label>최소 보증 인원{category==='VENUE'?' (필수)':''}<input type="number" required={category==='VENUE'} min={1} max={10000} value={item.minimumGuests??''} onChange={e=>quote(i,{minimumGuests:numberOrNull(e.target.value)})}/></label>
      <label>참고 견적 금액 (원)<input required type="number" min={0} max={100000000000} step={1} value={Number.isNaN(item.amount)?'':item.amount} onChange={e=>quote(i,{amount:e.target.value===''?NaN:Number(e.target.value)})}/></label>
      <label>부가세<select value={item.taxStatus} onChange={e=>quote(i,{taxStatus:e.target.value as ReferenceQuote['taxStatus']})}><option value="UNKNOWN">미확인</option><option value="INCLUDED">포함</option><option value="EXCLUDED">별도</option></select></label></div>
      <label>포함 항목<textarea required maxLength={1200} rows={3} placeholder="식대·대관료·생화 등 실제 포함된 항목과 수량" value={item.included} onChange={e=>quote(i,{included:e.target.value})}/></label>
      <label>별도 · 제외 항목<textarea required maxLength={1200} rows={3} placeholder="음주류·봉사료·필수 추가금 등. 없거나 미확인인 경우 명시" value={item.excluded} onChange={e=>quote(i,{excluded:e.target.value})}/></label>
      <label>추가 적용 조건<textarea maxLength={1200} rows={2} placeholder="계약 기간·할인 조건·추가 인원 요금·혼주 포함 여부 등" value={item.conditions} onChange={e=>quote(i,{conditions:e.target.value})}/></label>
      <label>이 견적의 출처 URL<input type="url" required maxLength={1000} value={item.sourceUrl} onChange={e=>quote(i,{sourceUrl:e.target.value})}/></label>
      <div className="admin-form-grid"><label>금액 확인일<input required type="date" min="2020-01-01" max={koreanToday()} value={item.checkedOn} onChange={e=>quote(i,{checkedOn:e.target.value})}/></label><label>견적 유효 기한 (선택)<input type="date" min={item.checkedOn} value={item.validUntil??''} onChange={e=>quote(i,{validUntil:e.target.value||null})}/></label></div>
    </section>)}
    <button type="button" className="secondary" disabled={details.quotes.length>=24} onClick={()=>onChange({...details,quotes:[...details.quotes,{title:'',serviceDate:'',startTime:'',guests:null,minimumGuests:null,amount:NaN,taxStatus:'UNKNOWN',included:'',excluded:'',conditions:'',sourceUrl:'',checkedOn:koreanToday(),validUntil:null}]})}>참고 견적 추가</button>
  </div>;
}
