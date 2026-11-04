import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
await mkdir('.sites-runtime',{recursive:true});
const runtimeBundle=await build({entryPoints:['lib/runtime.ts'],bundle:true,format:'esm',platform:'node',packages:'external',write:false});await writeFile('.sites-runtime/runtime-test.mjs',runtimeBundle.outputFiles[0].text);const {Statement}=await import(pathToFileURL(process.cwd()+'/.sites-runtime/runtime-test.mjs'));
const db=new PGlite();try{
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean);');
await db.exec(await readFile('migrations/001_supabase.sql','utf8'));
const query=async(sql,values)=>{const r=await db.query(sql,values);return {rows:r.rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,['revision','likes','count','created_at','updated_at','expires_at'].includes(k)&&v!==null?Number(v):v]))),count:r.affectedRows||r.rows.length};};
const blobs=new Map();globalThis.hubBindings={DB:{prepare:s=>new Statement(s,query),batch:async list=>{await db.exec('BEGIN');try{for(const st of list)await st.run();await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}}},BUCKET:{put:async(k,v)=>blobs.set(k,v),get:async k=>blobs.has(k)?{text:async()=>blobs.get(k)}:null,delete:async k=>blobs.delete(k)}};
const bundle=await build({entryPoints:['app/api/hub/route.ts'],bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'test-runtime',setup(b){b.onResolve({filter:/lib\/(runtime|session)$/},args=>({path:args.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path.endsWith('session')?"export async function identity(request){return request.headers.get('test-user')} ":"export const bindings=()=>globalThis.hubBindings;export const configured=()=>true;",loader:'js'}));}}]});await writeFile('.sites-runtime/hub-test.mjs',bundle.outputFiles[0].text);const route=await import(pathToFileURL(process.cwd()+'/.sites-runtime/hub-test.mjs'));
async function call(user,action,data={},expected=200){const headers={'Content-Type':'application/json',Origin:'http://unit.test'};if(user)headers['test-user']=user;const req=new Request('http://unit.test/api/hub',{method:action?'POST':'GET',headers,...(action?{body:JSON.stringify({action,...data})}:{})});const response=await (action?route.POST(req):route.GET(req));const value=await response.json();assert.equal(response.status,expected,JSON.stringify(value));return value;}
 const space={pets:[{id:'ham',name:'仓鼠A',type:'仓鼠'}],records:[{id:'r1',pet:'ham',kind:'体重',day:'2026-11-04',value:.12}],current:'ham',posts:[],profile:{name:'A'}};
 const initial=await call(null);assert.equal(initial.signedIn,false);assert.deepEqual(initial.blocked,[]);assert.deepEqual(initial.likes,[]);assert.deepEqual(initial.comments,[]);await call(null,'sync',{revision:0,data:space},401);
 assert.equal((await call('A','sync',{revision:0,data:space})).revision,1);
 assert.equal((await call('A')).data.pets[0].name,'仓鼠A');assert.equal((await call('B')).data,null);assert.equal((await call(null)).data,undefined);
 const conflict=await call('A','sync',{revision:0,data:{...space,profile:{name:'old'}}},409);assert.equal(conflict.revision,1);assert.equal(conflict.data.profile.name,'A');
 assert.equal((await call('A','sync',{revision:1,data:space})).revision,2);
 const profile=await call('B','publishProfile',{pet:{id:'bird',name:'鸟B',type:'鸟',city:'成都',hospital:'私密医院',next:'2026-12-01'},nickname:'B',bio:'交流丰容'});
 const anon=await call(null);assert.equal(anon.friends[0].hospital,undefined);assert.equal(anon.friends[0].next,undefined);
 const post=await call('B','post',{post:{pet:'bird',petName:'鸟B',species:'鸟',title:'公开日常',memo:'测试',owner:'B'}});
 await call('A','post',{post:{id:post.id,memo:'越权修改'}},403);assert.equal((await call(null)).posts[0].memo,'测试');
 await call('A','like',{id:post.id,enabled:true});await call('A','like',{id:post.id,enabled:true});assert.equal((await call(null)).posts[0].likes,1);
 const invite=await call('A','invite',{target:profile.id,memo:'聊聊鸟类丰容',day:new Date().toISOString().slice(0,10),name:'A'});
 await call('A','message',{id:invite.id,message:'未接受前'},403);await call('C','messages',{id:invite.id},403);
 await call('B','respondInvite',{id:invite.id,status:'accepted'});await call('A','message',{id:invite.id,message:'你好',name:'A'});assert.equal((await call('B','messages',{id:invite.id})).messages[0].text,'你好');
 await call('B','block',{id:(await call('A')).viewer,enabled:true});await call('A','message',{id:invite.id,message:'屏蔽后'},403);
 const family=await call('A','familyCode');await call('B','joinFamily',{code:family.code});assert.equal((await call('B')).data.pets[0].name,'仓鼠A');
 await call('B','familyCode',{},403);await call('A','closeFamily');assert.equal((await call('B')).data,null);await call('C','joinFamily',{code:family.code},400);
 await call('A','sync',{revision:2,data:{...space,records:[{...space.records[0],pet:'missing'}]}},400);
 await call('B','deletePost',{id:post.id});assert.equal((await call(null)).posts.length,0);

console.log('PostgreSQL integration: snapshots, conflicts, ownership, likes, invitations, messages, blocks and family revocation passed.');
}finally{await db.close();}
