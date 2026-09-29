import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Heart, LogOut, Mail, ShieldCheck, UserRound, X } from 'lucide-react';
import { memberRequest, type Member } from './membership';
import './account.css';

type Props={member:Member|null;ephemeral:boolean;count:number;onClose:()=>void;onChanged:()=>Promise<void>;notify:(message:string)=>void};
export default function AccountDialog({member,ephemeral,count,onClose,onChanged,notify}:Props) {
  // 'sent' shows the server's neutral notice after a registration or reset request (same text whether or not the email exists).
  const [mode,setMode]=useState<'login'|'register'|'profile'|'forgot'|'sent'>(member?'profile':'login');
  const [sentFrom,setSentFrom]=useState<'register'|'forgot'>('register');
  const [notice,setNotice]=useState('');
  const [email,setEmail]=useState('');
  const [name,setName]=useState(member?.displayName??'');
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const modal=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=modal.current;if(!dialog)return;
    const viewport=window.visualViewport;
    const fit=()=>{
      dialog.style.setProperty('--account-viewport-height',`${viewport?.height??window.innerHeight}px`);
      dialog.style.setProperty('--account-viewport-top',`${viewport?.offsetTop??0}px`);
    };
    fit();dialog.showModal();
    viewport?.addEventListener('resize',fit);viewport?.addEventListener('scroll',fit);
    window.addEventListener('resize',fit);
    return()=>{viewport?.removeEventListener('resize',fit);viewport?.removeEventListener('scroll',fit);window.removeEventListener('resize',fit);dialog.close();};
  },[]);
  useEffect(()=>{if(mode==='profile'&&!member){setMode('login');setPassword('');}},[member,mode]);
  function switchMode(next:'login'|'register'|'forgot') {setMode(next);setError('');setPassword('');setConfirmation('');}
  const registration=()=>({email:email.trim(),displayName:name.trim(),password});
  async function requestMail(kind:'register'|'forgot') {
    const response=await memberRequest<{detail:string}>(kind==='register'?'/auth/register':'/auth/password-reset','POST',kind==='register'?registration():{email:email.trim()});
    setNotice(response.detail);setSentFrom(kind);setMode('sent');
  }
  async function resend() {
    if(busy)return;setBusy(true);setError('');
    try{await requestMail(sentFrom);notify('메일을 다시 보냈습니다.');}
    catch(err){setError(err instanceof Error?err.message:'메일을 다시 보내지 못했습니다.');}finally{setBusy(false);}
  }
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy)return;setError('');
    if((mode==='register'||mode==='profile')&&name.trim().length<2){setError('닉네임을 2자 이상 입력해 주세요.');return;}
    if(mode==='register'&&password!==confirmation){setError('비밀번호 확인이 일치하지 않습니다.');return;}
    if(mode==='register'&&new TextEncoder().encode(password).length>72){setError('비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.');return;}
    setBusy(true);
    try {
      // Registration and reset only send mail; keep the typed values so "다시 받기" can resubmit them.
      if(mode==='register'||mode==='forgot'){await requestMail(mode);return;}
      if(mode==='profile') await memberRequest('/me','PATCH',{displayName:name.trim()});
      else await memberRequest('/auth/login','POST',{email:email.trim(),password});
      setPassword('');setConfirmation('');await onChanged();notify(mode==='login'?'로그인했습니다.':'닉네임을 저장했습니다.');onClose();
    } catch(err){setError(err instanceof Error?err.message:'처리하지 못했습니다. 다시 시도해 주세요.');}finally{setBusy(false);}
  }
  async function logout(){
    if(busy)return;setBusy(true);setError('');
    try{await memberRequest('/auth/logout','POST');await onChanged();notify('로그아웃했습니다.');onClose();}
    catch(err){setError(err instanceof Error?err.message:'로그아웃하지 못했습니다.');}finally{setBusy(false);}
  }
  return <dialog ref={modal} className="account-dialog" aria-labelledby="account-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <div className="account-dialog-header">
    <button className="dialog-close" disabled={busy} onClick={onClose} aria-label="회원 창 닫기"><X size={20}/></button>
    <div className="account-mark"><UserRound size={25}/></div>
    <div className="eyebrow">ALL ABOUT WEDDING · MY ACCOUNT</div>
    <h2 id="account-title">{mode==='profile'?`${member?.displayName??''}님의 공간`:mode==='register'?'우리의 준비를 시작해요':mode==='forgot'?'비밀번호를 잊으셨나요?':mode==='sent'?'메일함을 확인해 주세요':'다시 만나 반가워요'}</h2>
    <p className="account-subtitle">{mode==='profile'?'내 정보를 관리하고 마음에 든 공간을 모아두세요.':mode==='forgot'?'가입한 이메일로 비밀번호 재설정 링크를 보내 드려요.':mode==='sent'?email.trim():'마음에 드는 업체를 내 계정에 담아두세요.'}</p>
    {(mode==='login'||mode==='register')&&<div className="account-tabs" role="group" aria-label="회원 기능"><button type="button" aria-pressed={mode==='login'} disabled={busy} className={mode==='login'?'active':''} onClick={()=>switchMode('login')}>로그인</button><button type="button" aria-pressed={mode==='register'} disabled={busy} className={mode==='register'?'active':''} onClick={()=>switchMode('register')}>회원가입</button></div>}
    </div><div className="account-dialog-content">
    {mode==='sent'?<div className="account-form account-sent" role="status">
      <p>{notice}</p>
      <p className="account-sent-hint">메일이 보이지 않으면 스팸함을 확인해 주세요. 링크는 {sentFrom==='register'?'24시간':'30분'} 동안 한 번만 쓸 수 있습니다.</p>
      {error&&<p className="account-error" role="alert">{error}</p>}
      <button type="button" className="primary full" disabled={busy} onClick={resend}>{busy?'보내는 중…':'메일 다시 받기'}<Mail size={16}/></button>
      <button type="button" className="account-link-button" disabled={busy} onClick={()=>switchMode('login')}>로그인 화면으로</button>
    </div>:<form onSubmit={submit} className="account-form">
      <fieldset disabled={busy}>
        {mode==='profile'?<div className="account-email"><Mail size={16}/><div><strong>{member?.email}</strong><small>{member?.emailVerified?'이메일 인증 완료':'이메일 인증 전'} · 이메일 변경은 준비 중</small></div></div>:<label>이메일<input type="email" required maxLength={254} autoComplete="username" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
        {(mode==='register'||mode==='profile')&&<label>닉네임<input required minLength={2} maxLength={30} autoComplete="nickname" placeholder="함께 불릴 이름" value={name} onChange={e=>setName(e.target.value)}/><small>2~30자로 입력해 주세요.</small></label>}
        {(mode==='login'||mode==='register')&&<label>비밀번호<input type="password" required minLength={mode==='register'?10:1} maxLength={72} autoComplete={mode==='register'?'new-password':'current-password'} placeholder={mode==='register'?'10자 이상 입력해 주세요':'비밀번호를 입력해 주세요'} value={password} onChange={e=>setPassword(e.target.value)}/>{mode==='register'&&<small>10자 이상 · UTF-8 기준 72바이트 이내</small>}</label>}
        {mode==='register'&&<label>비밀번호 확인<input type="password" required autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}
        {mode==='profile'&&<div className="account-summary"><Heart size={19}/><div>내 계정에 찜한 업체<strong>{count}곳</strong></div><ShieldCheck size={23}/></div>}
        {error&&<p className="account-error" role="alert">{error}</p>}
        <button className="primary full" type="submit">{busy?'처리 중…':mode==='register'?'인증 메일 받고 가입하기':mode==='profile'?'내 정보 저장':mode==='forgot'?'재설정 링크 받기':'로그인'}{mode==='profile'?<Check size={16}/>:<ArrowRight size={16}/>}</button>
        {mode==='login'&&<button type="button" className="account-link-button" onClick={()=>switchMode('forgot')}>비밀번호를 잊으셨나요?</button>}
        {mode==='forgot'&&<button type="button" className="account-link-button" onClick={()=>switchMode('login')}>로그인 화면으로</button>}
      </fieldset>
    </form>}
    {mode==='profile'&&<button disabled={busy} className="logout-button" onClick={logout}><LogOut size={15}/>로그아웃</button>}
    <p className="account-storage-note">{ephemeral?'체험 모드: 회원 정보와 계정 찜은 서버 재시작 시 초기화됩니다. 테스트용 이메일과 비밀번호를 사용해 주세요.':'회원 정보와 계정 찜은 서버에 저장됩니다.'}</p>
    {mode!=='profile'&&<p className="account-guest-note">비회원으로 담은 찜은 이 브라우저에 따로 유지됩니다.</p>}
    </div>
  </dialog>;
}
