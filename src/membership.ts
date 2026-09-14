import { useCallback, useEffect, useRef, useState } from 'react';

export type Member = { id: string; email: string; displayName: string; emailVerified: boolean; admin: boolean };
export class MemberError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
async function read<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(()=>({}));
    throw new MemberError(body.detail || '회원 정보를 불러오지 못했습니다. 다시 시도해 주세요.',response.status);
  }
  return response.status===204 ? undefined as T : response.json();
}
export async function memberRequest<T>(path: string, method='GET', body?: unknown): Promise<T> {
  const headers: Record<string,string>={};
  if (method!=='GET') {
    const csrf=await read<{headerName:string;token:string}>(await fetch('/api/v1/auth/csrf',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)}));
    headers[csrf.headerName]=csrf.token;
    if(body!==undefined&&!(body instanceof FormData)) headers['Content-Type']='application/json';
  }
  return read<T>(await fetch(`/api/v1${path}`,{method,headers,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)}));
}
function guestFavorites(): string[] {
  try { const data=JSON.parse(localStorage.getItem('yeon-favorites')??'[]'); return Array.isArray(data)?data.filter(x=>typeof x==='string'):[]; } catch { return []; }
}
export function useMembership(notify:(message:string)=>void) {
  const [member,setMember]=useState<Member|null>(null);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [ready,setReady]=useState(false);
  const [available,setAvailable]=useState(false);
  const [ephemeral,setEphemeral]=useState(false);
  const [saving,setSaving]=useState(false);
  const generation=useRef(0);
  const writing=useRef(false);
  const refresh=useCallback(async()=> {
    const version=++generation.current;
    try {
      const session=await memberRequest<{member:Member|null;ephemeral:boolean}>('/auth/session');
      const ids=session.member ? await memberRequest<string[]>('/me/favorites') : guestFavorites();
      if (version===generation.current) { setMember(session.member);setFavorites(ids);setEphemeral(session.ephemeral);setAvailable(true); }
    } catch (error) {
      if (version===generation.current) {
        setMember(null);setFavorites(guestFavorites());setAvailable(false);
        if(error instanceof MemberError && error.status===401) setAvailable(true);
      }
      throw error;
    } finally { if(version===generation.current) setReady(true); }
  },[]);
  useEffect(()=> {
    void refresh().catch(()=>{});
    const sync=()=> { if(!writing.current) void refresh().catch(()=>{}); };
    window.addEventListener('focus',sync);
    return ()=> { generation.current++;window.removeEventListener('focus',sync); };
  },[refresh]);
  async function favorite(id:string) {
    if(!ready||writing.current) return;
    if(!available) { notify('회원 연결 상태를 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.');return; }
    writing.current=true;setSaving(true);
    const version=generation.current;
    try {
      const saved=favorites.includes(id);
      const next=member ? await memberRequest<string[]>(`/me/favorites/${id}`,saved?'DELETE':'PUT') : saved?favorites.filter(x=>x!==id):[...favorites,id];
      if(version===generation.current) setFavorites(next);
      if(!member) { try { localStorage.setItem('yeon-favorites',JSON.stringify(next)); } catch { notify('브라우저 저장이 제한되어 이번 방문 중에만 유지됩니다.'); } }
    } catch(error) {
      notify(error instanceof Error?error.message:'찜을 저장하지 못했습니다.');
      if(error instanceof MemberError&&error.status===401) await refresh().catch(()=>{});
    } finally { writing.current=false;setSaving(false); }
  }
  return {member,favorites,ready,available,ephemeral,saving,refresh,favorite};
}
