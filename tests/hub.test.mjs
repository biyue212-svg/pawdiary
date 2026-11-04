import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
const bundle=await build({stdin:{contents:"import {GET,POST} from './app/api/hub/route.ts'; export default {fetch(request){return request.method==='POST'?POST(request):GET(request)}}",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'neutral',external:['cloudflare:workers'],write:false});
const mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],r2Buckets:['BUCKET']});
try{
 const db=await mf.getD1Database('DB');
 for(const file of ['drizzle/0000_petite_maginty.sql','drizzle/0001_parallel_amphibian.sql'])for(const sql of (await readFile(file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await db.prepare(sql).run();
 async function call(user,action,data={},expected=200){const headers={'Content-Type':'application/json',Origin:'http://unit.test'};if(user)headers['oai-authenticated-user-id']=user;const response=await mf.dispatchFetch('http://unit.test/api/hub',{method:action?'POST':'GET',headers,...(action?{body:JSON.stringify({action,...data})}:{})});const value=await response.json();assert.equal(response.status,expected,JSON.stringify(value));return value;}
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
 console.log('D1/R2 integration: account isolation, revision conflicts, public/private separation, owner checks, invites, chat, blocking and family revocation passed.');
}finally{await mf.dispose();}
