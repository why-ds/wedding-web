import {useEffect,useState} from 'react';
import {memberRequest} from '../membership';
type Report={persistent:boolean;database:string;account:string;migration:string;schemaWriteAllowed:boolean;auditRewriteAllowed:boolean;counts:{name:string;rows:number;purpose:string}[];checkedAt:string};
export default function StoragePanel(){
  const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[reload,setReload]=useState(0),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;setLoading(true);setError('');setReport(null);memberRequest<Report>('/admin/storage').then(r=>{if(active)setReport(r);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[reload]);
  return <section className="admin-panel"><div className="admin-panel-header"><h2>실제 저장소 상태</h2><button disabled={loading} onClick={()=>setReload(x=>x+1)}>새로 확인</button></div>
    {loading?<p className="admin-empty" role="status">데이터베이스를 확인하고 있습니다.</p>:error?<p className="admin-error" role="alert">{error} 이전 연결 상태를 정상으로 대신 표시하지 않습니다.</p>:report&&<>
      <div className="admin-guidance"><span>{report.persistent?'PostgreSQL 연결 확인':'메모리 체험 모드 · 영구 DB 미연결'} · {new Date(report.checkedAt).toLocaleString('ko-KR')}</span></div>
      <div className="storage-details"><p>데이터베이스 <strong>{report.database}</strong></p><p>실행 계정 <strong>{report.account}</strong></p><p>확인된 스키마 <strong>{report.migration}</strong></p><p>테이블 구조 변경 권한 <strong>{report.schemaWriteAllowed?'허용 · 운영 설정 점검 필요':'없음'}</strong></p><p>감사 이력 수정·삭제 권한 <strong>{report.auditRewriteAllowed?'허용 · 운영 설정 점검 필요':'없음'}</strong></p></div>
      <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>저장 항목</th><th>테이블</th><th>저장 건수</th></tr></thead><tbody>{report.counts.map(c=><tr key={c.name}><td>{c.purpose}</td><td>{c.name}</td><td>{c.rows.toLocaleString()}건</td></tr>)}</tbody></table></div>
      <p className="admin-guidance">회원·찜·업체 초안·게시·CSV·변경 이력은 DB에서 조회합니다. 상품·가격·견적의 테이블 존재 여부와 실제 기능 구현 여부는 다릅니다. 로그인 세션과 CSRF 토큰은 현재 서버 메모리에 있으며 재배포 시 로그인이 만료됩니다.</p>
    </>}
  </section>;
}
