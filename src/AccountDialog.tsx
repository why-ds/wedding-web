import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Heart, LogOut, Mail, ShieldCheck, UserRound, X } from 'lucide-react';
import { memberRequest, type Member } from './membership';
import './account.css';

type Props={member:Member|null;ephemeral:boolean;count:number;onClose:()=>void;onChanged:()=>Promise<void>;notify:(message:string)=>void};
export default function AccountDialog({member,ephemeral,count,onClose,onChanged,notify}:Props) {
  const [mode,setMode]=useState<'login'|'register'|'profile'>(member?'profile':'login');
  const [email,setEmail]=useState('');
  const [name,setName]=useState(member?.displayName??'');
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const modal=useRef<HTMLDialogElement>(null);
  useEffect(()=>{modal.current?.showModal();},[]);
  useEffect(()=>{if(mode==='profile'&&!member){setMode('login');setPassword('');}},[member,mode]);
  function switchMode(next:'login'|'register') {setMode(next);setError('');setPassword('');setConfirmation('');}
  async function submit(event:FormEvent) {
    event.preventDefault();if(busy)return;setError('');
    if(mode!=='login'&&name.trim().length<2){setError('닉네임을 2자 이상 입력해 주세요.');return;}
    if(mode==='register'&&password!==confirmation){setError('비밀번호 확인이 일치하지 않습니다.');return;}
    if(mode==='register'&&new TextEncoder().encode(password).length>72){setError('비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.');return;}
    setBusy(true);
    try {
      if(mode==='profile') await memberRequest('/me','PATCH',{displayName:name.trim()});
      else await memberRequest(`/auth/${mode==='register'?'register':'login'}`,'POST',mode==='register'?{email:email.trim(),displayName:name.trim(),password}:{email:email.trim(),password});
      setPassword('');setConfirmation('');await onChanged();notify(mode==='register'?'가입을 완료했습니다. 반가워요!':mode==='login'?'로그인했습니다.':'닉네임을 저장했습니다.');onClose();
    } catch(err){setError(err instanceof Error?err.message:'처리하지 못했습니다. 다시 시도해 주세요.');}finally{setBusy(false);}
  }
  async function logout(){
    if(busy)return;setBusy(true);setError('');
    try{await memberRequest('/auth/logout','POST');await onChanged();notify('로그아웃했습니다.');onClose();}
    catch(err){setError(err instanceof Error?err.message:'로그아웃하지 못했습니다.');}finally{setBusy(false);}
  }
  return <dialog ref={modal} className="account-dialog" aria-labelledby="account-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}} onClick={event=>{if(event.target===event.currentTarget&&!busy)onClose();}}>
    <button className="dialog-close" disabled={busy} onClick={onClose} aria-label="회원 창 닫기"><X size={20}/></button>
    <div className="account-mark"><UserRound size={25}/></div>
    <div className="eyebrow">ALL ABOUT WEDDING · MY ACCOUNT</div>
    <h2 id="account-title">{mode==='profile'?`${member?.displayName??''}님의 공간`:mode==='register'?'우리의 준비를 시작해요':'다시 만나 반가워요'}</h2>
    <p className="account-subtitle">{mode==='profile'?'내 정보를 관리하고 마음에 든 공간을 모아두세요.':'마음에 드는 업체를 내 계정에 담아두세요.'}</p>
    {mode!=='profile'&&<div className="account-tabs" role="group" aria-label="회원 기능"><button disabled={busy} className={mode==='login'?'active':''} onClick={()=>switchMode('login')}>로그인</button><button disabled={busy} className={mode==='register'?'active':''} onClick={()=>switchMode('register')}>회원가입</button></div>}
    <form onSubmit={submit} className="account-form">
      <fieldset disabled={busy}>
        {mode==='profile'?<div className="account-email"><Mail size={16}/><div><strong>{member?.email}</strong><small>이메일 인증 전 · 이메일 변경은 준비 중</small></div></div>:<label>이메일<input type="email" required maxLength={254} autoComplete="username" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
        {mode!=='login'&&<label>닉네임<input required minLength={2} maxLength={30} autoComplete="nickname" placeholder="함께 불릴 이름" value={name} onChange={e=>setName(e.target.value)}/><small>2~30자로 입력해 주세요.</small></label>}
        {mode!=='profile'&&<label>비밀번호<input type="password" required minLength={mode==='register'?10:1} maxLength={72} autoComplete={mode==='register'?'new-password':'current-password'} placeholder={mode==='register'?'10자 이상 입력해 주세요':'비밀번호를 입력해 주세요'} value={password} onChange={e=>setPassword(e.target.value)}/>{mode==='register'&&<small>10자 이상 · UTF-8 기준 72바이트 이내</small>}</label>}
        {mode==='register'&&<label>비밀번호 확인<input type="password" required autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>}
        {mode==='profile'&&<div className="account-summary"><Heart size={19}/><div>내 계정에 찜한 업체<strong>{count}곳</strong></div><ShieldCheck size={23}/></div>}
        {error&&<p className="account-error" role="alert">{error}</p>}
        <button className="primary full" type="submit">{busy?'처리 중…':mode==='register'?'가입하고 시작하기':mode==='profile'?'내 정보 저장':'로그인'}{mode==='profile'?<Check size={16}/>:<ArrowRight size={16}/>}</button>
      </fieldset>
    </form>
    {mode==='profile'&&<button disabled={busy} className="logout-button" onClick={logout}><LogOut size={15}/>로그아웃</button>}
    <p className="account-storage-note">{ephemeral?'체험 모드: 회원 정보와 계정 찜은 서버 재시작 시 초기화됩니다. 테스트용 이메일과 비밀번호를 사용해 주세요.':'회원 정보와 계정 찜은 서버에 저장됩니다.'}</p>
    {mode!=='profile'&&<p className="account-guest-note">비회원으로 담은 찜은 이 브라우저에 따로 유지됩니다.<br/>이메일 인증·비밀번호 찾기는 아직 준비 중입니다.</p>}
  </dialog>;
}
