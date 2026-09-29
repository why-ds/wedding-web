import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Check, KeyRound, MailCheck } from 'lucide-react';
import Brand from './Brand';
import { MemberError, memberRequest } from './membership';
import './directory.css';
import './account.css';

type Kind = 'verify' | 'reset';

/**
 * Landing page for emailed links: /account/verify#token=… and /account/reset#token=….
 * The token travels in the URL fragment, so it never reaches server logs or Referer headers.
 * It is read once and removed from the address bar before anything else renders.
 */
function takeToken(): string {
  const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
  if (location.hash) history.replaceState(null, '', location.pathname);
  return /^[A-Za-z0-9_-]{20,100}$/.test(token) ? token : '';
}

export default function AccountLinkApp({ kind }: { kind: Kind }) {
  const [token] = useState(takeToken);
  const [state, setState] = useState<'ready' | 'busy' | 'done'>('ready');
  const [error, setError] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  async function run(action: () => Promise<void>) {
    if (state === 'busy') return;
    setState('busy'); setError('');
    try { await action(); setState('done'); }
    catch (err) { setError(err instanceof MemberError || err instanceof Error ? err.message : '처리하지 못했습니다. 다시 시도해 주세요.'); setState('ready'); }
  }
  // Explicit button instead of auto-submit: mail scanners that prefetch links must not consume the token.
  const verify = () => run(async () => { setVerifiedEmail((await memberRequest<{ email: string }>('/auth/verify', 'POST', { token })).email); });
  const requestReset = (e: FormEvent) => { e.preventDefault(); void run(async () => { setNotice((await memberRequest<{ detail: string }>('/auth/password-reset', 'POST', { email: email.trim() })).detail); }); };
  const confirmReset = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmation) { setError('비밀번호 확인이 일치하지 않습니다.'); return; }
    if (new TextEncoder().encode(password).length > 72) { setError('비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.'); return; }
    void run(async () => { await memberRequest('/auth/password-reset/confirm', 'POST', { token, password }); setPassword(''); setConfirmation(''); });
  };

  const busy = state === 'busy';
  let title: string, body: ReactNode;
  if (kind === 'verify') {
    title = state === 'done' ? '가입이 완료되었어요' : '이메일 인증';
    body = !token ? <p className="account-error" role="alert">링크가 올바르지 않습니다. 메일의 링크를 다시 열거나 처음부터 가입해 주세요.</p>
      : state === 'done' ? <><p className="account-link-lead">{verifiedEmail} 계정이 만들어졌습니다. 가입할 때 정한 비밀번호로 로그인해 주세요.</p><a className="primary full" href="/">로그인하러 가기<ArrowRight size={16}/></a></>
      : <><p className="account-link-lead">아래 버튼을 누르면 이메일 인증이 끝나고 계정이 만들어집니다.</p>{error && <p className="account-error" role="alert">{error}</p>}<button className="primary full" disabled={busy} onClick={verify}>{busy ? '확인 중…' : '인증 완료하기'}<Check size={16}/></button></>;
  } else if (!token) {
    // /account/reset without a token: the "already registered" mail points here to request a link.
    title = '비밀번호 재설정';
    body = state === 'done' ? <p className="account-link-lead" role="status">{notice}</p>
      : <form className="account-form" onSubmit={requestReset}><fieldset disabled={busy}>
          <label>가입한 이메일<input type="email" required maxLength={254} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}/></label>
          {error && <p className="account-error" role="alert">{error}</p>}
          <button className="primary full" type="submit">{busy ? '보내는 중…' : '재설정 링크 받기'}<ArrowRight size={16}/></button>
        </fieldset></form>;
  } else {
    title = state === 'done' ? '비밀번호를 바꿨어요' : '새 비밀번호 설정';
    body = state === 'done' ? <><p className="account-link-lead">다른 기기의 로그인은 모두 해제되었습니다. 새 비밀번호로 로그인해 주세요.</p><a className="primary full" href="/">로그인하러 가기<ArrowRight size={16}/></a></>
      : <form className="account-form" onSubmit={confirmReset}><fieldset disabled={busy}>
          <label>새 비밀번호<input type="password" required minLength={10} maxLength={72} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/><small>10자 이상 · UTF-8 기준 72바이트 이내</small></label>
          <label>새 비밀번호 확인<input type="password" required autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)}/></label>
          {error && <p className="account-error" role="alert">{error}</p>}
          <button className="primary full" type="submit">{busy ? '저장 중…' : '비밀번호 바꾸기'}<KeyRound size={16}/></button>
        </fieldset></form>;
  }
  return <div className="directory-shell"><header className="directory-header"><a href="/" aria-label="All About Wedding 홈"><Brand/></a></header>
    <main className="directory-main account-link-main"><div className="account-mark">{kind === 'verify' ? <MailCheck size={25}/> : <KeyRound size={25}/>}</div>
      <div className="eyebrow">ALL ABOUT WEDDING · MY ACCOUNT</div><h1>{title}</h1>{body}</main></div>;
}
