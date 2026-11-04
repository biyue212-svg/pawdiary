export const maxDuration=30;
import {supabase,configured} from '../../../lib/runtime';
import {identity,setSession} from '../../../lib/session';
export const runtime='nodejs';export const dynamic='force-dynamic';
const json=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)return json({ok:false,error:'请从本站操作'},403);if(!configured())return json({ok:false,error:'登录服务尚未配置，请联系网站管理员。本机记录仍可使用。'},503);
 let d;try{const raw=await request.text();if(raw.length>12000)throw Error();d=JSON.parse(raw);}catch{return json({ok:false,error:'请求格式不正确'},400);}
 try{const client=supabase();if(d.action==='signout'){await setSession(null);return json({ok:true});}
 if(d.action==='session'){if(typeof d.access_token!=='string'||d.access_token.length>8000||typeof d.refresh_token!=='string'||d.refresh_token.length>2000)return json({ok:false,error:'验证链接无效'},400);const {data,error}=await client.auth.getUser(d.access_token);if(error||!data.user)return json({ok:false,error:'验证链接已过期，请重新登录'},401);const {data:session,error:se}=await client.auth.refreshSession({refresh_token:d.refresh_token});if(se||!session.user||session.user.id!==data.user.id||!session.session)return json({ok:false,error:'会话验证失败'},401);await setSession(session.session);return json({ok:true});}
 if(d.action==='password'){if(!await identity(request))return json({ok:false,error:'请先使用邮件中的重置链接'},401);const {cookies}=await import('next/headers');const store=await cookies();if(typeof d.password!=='string'||d.password.length<10||d.password.length>128)return json({ok:false,error:'密码需为10至128位'},400);await client.auth.setSession({access_token:store.get('paw-access')!.value,refresh_token:store.get('paw-refresh')!.value});const {error}=await client.auth.updateUser({password:d.password});if(error)return json({ok:false,error:'密码修改失败，请重新申请重置邮件'},400);return json({ok:true});}
 const email=typeof d.email==='string'?d.email.trim():'',password=typeof d.password==='string'?d.password:'';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({ok:false,error:'请输入有效邮箱'},400);
 const redirect=new URL('/account',request.url).href;
 if(d.action==='recover'){await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});return json({ok:true,message:'如果该邮箱已注册，会收到密码重置邮件。请检查邮箱及垃圾邮件。'});}
 if(!['login','signup'].includes(d.action)||password.length<10||password.length>128)return json({ok:false,error:'密码需为10至128位'},400);
 const result=d.action==='signup'?await client.auth.signUp({email,password,options:{emailRedirectTo:redirect}}):await client.auth.signInWithPassword({email,password});
 if(result.error)return json({ok:false,error:result.error.status===429?'操作较频繁，请稍后再试。':d.action==='login'?'登录失败，请核对邮箱和密码，并确认邮箱已经验证。':'暂时无法注册，请稍后再试或使用已有账号登录。'},400);
 if(result.data.session){await setSession(result.data.session);return json({ok:true});}return json({ok:true,message:'请打开邮箱中的验证链接，完成验证后再登录。'});
 }catch{return json({ok:false,error:'登录服务暂时不可用，请稍后重试'},503);}}
