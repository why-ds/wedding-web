import {useEffect,useRef,useState,type FormEvent} from 'react';
import {memberRequest} from '../membership';
import {catalogCategories,type CatalogDraft,type Publication} from '../catalog';

export function PublishDialog({draft,onClose,onDone}:{draft:CatalogDraft;onClose:()=>void;onDone:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [publication,setPublication]=useState<Publication|null>(null);
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [reviewedOn,setReviewedOn]=useState(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
  const [confirmed,setConfirmed]=useState(false);
  useEffect(()=>{dialog.current?.showModal();let active=true;memberRequest<{publication:Publication|null}>(`/admin/catalog/${draft.id}/publication`).then(r=>{if(active){setPublication(r.publication);setReady(true);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[draft.id]);
  async function submit(e:FormEvent){e.preventDefault();if(!ready||busy)return;setBusy(true);setError('');try{
    await memberRequest(`/admin/catalog/${draft.id}/publish`,'POST',{version:draft.version,publicationVersion:publication?.version??null,reviewedOn,factsConfirmed:confirmed});onDone();
  }catch(e){setError(e instanceof Error?e.message:'게시하지 못했습니다.');}finally{setBusy(false);}}
  return <dialog ref={dialog} className="admin-editor" aria-labelledby="publish-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
    <h2 id="publish-title">업체 기본 정보 공개 검수</h2><p className="admin-editor-note">아래 정보가 누구에게나 공개됩니다. 사진·가격·후기는 이번 게시 대상에 포함되지 않습니다.</p>
    <dl className="publication-review"><dt>업체 · 지점</dt><dd>{draft.data.organizationName} · {draft.data.branchName}</dd><dt>업종 · 지역</dt><dd>{catalogCategories[draft.data.category]} · {draft.data.region}</dd><dt>주소</dt><dd>{draft.data.address}</dd><dt>공개 연락처</dt><dd>{draft.data.publicPhone||'미등록'}</dd><dt>출처</dt><dd>{draft.data.sourceUrl?<a href={draft.data.sourceUrl} target="_blank" rel="noopener noreferrer">{draft.data.sourceUrl}</a>:'출처 URL이 없습니다. 초안을 먼저 수정해 주세요.'}</dd></dl>
    {publication&&<p className="admin-editor-note">현재 {publication.status==='PUBLISHED'?'공개 중':'게시 중단'} · 승인된 초안 버전 {publication.draftVersion} → 이번 버전 {draft.version}</p>}
    <form onSubmit={submit}><fieldset disabled={busy||!ready}><label>정보 확인일<input type="date" required value={reviewedOn} onChange={e=>setReviewedOn(e.target.value)}/></label><label className="publication-confirm"><input type="checkbox" required checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>최근 90일 이내 출처에서 기본 정보를 직접 확인했고 공개 연락처·주소임을 확인했습니다.</label>
    {error&&<p className="admin-row-error" role="alert">{error}</p>}<button className="primary" disabled={!draft.data.sourceUrl||!confirmed} type="submit">{busy?'게시 중…':'확인한 정보 공개하기'}</button></fieldset></form>
    {!ready&&error&&<p role="alert">{error}</p>}<button className="secondary" disabled={busy} onClick={onClose}>닫기</button>
  </dialog>;
}

export default function PublicationPanel(){
  const [page,setPage]=useState(0),[reload,setReload]=useState(0),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [data,setData]=useState<{items:Publication[];total:number;persistent:boolean}>({items:[],total:0,persistent:true});
  const [withdrawing,setWithdrawing]=useState<Publication|null>(null);
  useEffect(()=>{let active=true;setLoading(true);setError('');memberRequest<typeof data>(`/admin/publications?page=${page}`).then(r=>{if(active)setData(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[page,reload]);
  async function withdraw(){if(!withdrawing||busy)return;setBusy(true);setError('');try{await memberRequest(`/admin/catalog/${withdrawing.draftId}/withdraw`,'POST',{version:withdrawing.version});setWithdrawing(null);setReload(x=>x+1);}catch(e){setError(e instanceof Error?e.message:'중단하지 못했습니다.');}finally{setBusy(false);}}
  return <section className="admin-panel"><div className="admin-panel-header"><h2>검수·게시 현황 {data.total}건</h2><a href="/directory" target="_blank" rel="noopener noreferrer">공개 업체 목록 보기 ↗</a></div>
    {!data.persistent&&<p className="admin-guidance">현재 체험 모드입니다. 공개 게시에는 PostgreSQL 연결이 필요합니다.</p>}
    {error&&<p className="admin-error" role="alert">{error}<button onClick={()=>setReload(x=>x+1)}>다시 조회</button></p>}
    {loading?<p className="admin-empty" role="status">게시 현황을 불러오는 중입니다.</p>:data.items.length===0?<p className="admin-empty">게시 이력이 없습니다. 업체 초안에서 출처를 입력하고 공개 검수를 진행해 주세요.</p>:<div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>업체</th><th>업종</th><th>공개 상태</th><th>확인일</th><th>관리</th></tr></thead><tbody>{data.items.map(p=><tr key={p.draftId}><td><strong>{p.data.organizationName}</strong><small>{p.data.branchName} · 승인 초안 버전 {p.draftVersion}</small></td><td>{catalogCategories[p.data.category]}</td><td>{p.status==='PUBLISHED'?'공개 중':'게시 중단'}</td><td>{p.reviewedOn}</td><td><button disabled={busy||p.status!=='PUBLISHED'} onClick={()=>setWithdrawing(p)}>게시 중단</button></td></tr>)}</tbody></table></div>}
    {withdrawing&&<div className="admin-guidance" role="alert"><span>{withdrawing.data.organizationName}의 공개를 중단할까요? 초안·출처·검수 이력은 보존됩니다.</span><button disabled={busy} onClick={withdraw}>중단 확인</button><button disabled={busy} onClick={()=>setWithdrawing(null)}>취소</button></div>}
    <div className="admin-pagination"><span>{page+1}페이지 · 20건씩</span><div><button disabled={page===0||loading||busy} onClick={()=>setPage(x=>x-1)}>이전</button><button disabled={(page+1)*20>=data.total||loading||busy} onClick={()=>setPage(x=>x+1)}>다음</button></div></div>
  </section>;
}
