import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
export function configured(){return !!(process.env.DATABASE_URL&&process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY);}
export function supabase(admin=false){const url=process.env.SUPABASE_URL,key=admin?process.env.SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_ANON_KEY;if(!url||!key)throw Error('后台服务尚未配置');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});}
// SQL text is authored in this repository; values are always bound separately.
export function compileSql(source:string){let n=0;return source.replace(/\?/g,()=>'$'+(++n)).replace(/\buser\b/g,'"user"').replace(/\bwindow\b/g,'"window"').replace(/WHEN "window" =/g,'WHEN hub_limits."window" =').replace(/THEN count \+ 1/g,'THEN hub_limits.count + 1').replace(/WHERE owner=excluded.owner AND deleted=0/g,'WHERE social_posts.owner=excluded.owner AND social_posts.deleted=0');}
export type Query=(sql:string,values:unknown[])=>Promise<{rows:Record<string,any>[],count:number}>;
export class Statement {
 constructor(readonly source:string,readonly query:Query,readonly values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.source,this.query,values);}
 async first<T=Record<string,unknown>>():Promise<T|null>{return (await this.query(compileSql(this.source),this.values)).rows[0] as T||null;}
 async all<T=Record<string,unknown>>(){return {results:(await this.query(compileSql(this.source),this.values)).rows as T[]};}
 async run(){const r=await this.query(compileSql(this.source),this.values);return {meta:{changes:r.count}};}
}
let sql:ReturnType<typeof postgres>|undefined;
export function database(){if(!process.env.DATABASE_URL)throw Error('数据库尚未配置');sql||=postgres(process.env.DATABASE_URL,{ssl:'require',prepare:false,max:3,idle_timeout:20,connect_timeout:10,types:{bigint:{to:20,from:[20],serialize:(x:unknown)=>String(x),parse:Number}}});const pool=sql;
 const query:Query=async(s,v)=>{const result=await pool.unsafe(s,v as never[]);return {rows:[...result],count:result.count};};
 return {prepare:(s:string)=>new Statement(s,query),batch:async(statements:Statement[])=>pool.begin(async tx=>{for(const s of statements)await tx.unsafe(compileSql(s.source),s.values as never[]);})};
}
export function bucket(){const client=supabase(true).storage.from('pawdiary-private');return {
 async put(key:string,body:string,_options?:unknown){const {error}=await client.upload(key,body,{contentType:'application/json',upsert:false});if(error)throw Error('无法保存云端照片与档案');},
 async get(key:string){const {data,error}=await client.download(key);if(error||!data)return null;return {text:()=>data.text()};},
 async delete(key:string){const {error}=await client.remove([key]);if(error)throw Error('无法清理旧版档案');}
 };}
export type Database=ReturnType<typeof database>;
export type Bucket=ReturnType<typeof bucket>;
export function bindings(){return {DB:database(),BUCKET:bucket()};}
