import {cookies} from 'next/headers';
import {supabase} from './runtime';
export async function setSession(session:{access_token:string,refresh_token:string,expires_in?:number}|null){const store=await cookies(),options={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};store.set('paw-access',session?.access_token||'',{...options,maxAge:session?(session.expires_in||3600):0});store.set('paw-refresh',session?.refresh_token||'',{...options,maxAge:session?60*60*24*30:0});}
export async function identity(_request?:Request){const store=await cookies(),access=store.get('paw-access')?.value,refresh=store.get('paw-refresh')?.value;if(!access&&!refresh)return null;const client=supabase();if(access){const {data,error}=await client.auth.getUser(access);if(!error&&data.user)return data.user.id;}
 if(refresh){const {data,error}=await client.auth.refreshSession({refresh_token:refresh});if(!error&&data.session&&data.user){await setSession(data.session);return data.user.id;}}
 await setSession(null);return null;
}
