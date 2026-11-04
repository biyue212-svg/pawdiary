import { env } from 'cloudflare:workers';
import { PET_TYPES, text, picture, snapshot } from '../../../lib/hub-validation';

const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
type Bindings={DB:D1Database,BUCKET:R2Bucket};
const bindings=()=>env as unknown as Bindings;
const identity=(r:Request)=>r.headers.get('oai-authenticated-user-id');
const key=()=>crypto.randomUUID();
const publicId=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('');
async function scope(db:D1Database,user:string){const m=await db.prepare('SELECT owner FROM family_members WHERE user = ?').bind(user).first<{owner:string}>();return m?.owner||user;}
async function loadSpace(db:D1Database,bucket:R2Bucket,owner:string){const row=await db.prepare('SELECT revision, object_key FROM cloud_spaces WHERE owner = ?').bind(owner).first<{revision:number,object_key:string}>();if(!row)return {revision:0,data:null};const obj=await bucket.get(row.object_key);if(!obj)throw Error('云端档案暂时无法读取，请稍后再试');return {revision:row.revision,data:JSON.parse(await obj.text())};}
async function member(db:D1Database,id:string,user:string){return await db.prepare("SELECT id FROM social_invites WHERE id = ? AND status = 'accepted' AND (sender = ? OR receiver = ?)").bind(id,user,user).first();}
export async function GET(request:Request){
  try {
    const {DB:db,BUCKET:bucket}=bindings();const user=identity(request);
    const posts=await db.prepare('SELECT p.*, (SELECT COUNT(*) FROM social_likes l WHERE l.post_id = p.id) AS likes FROM social_posts p WHERE p.deleted = 0 ORDER BY p.created_at DESC LIMIT 100').all<any>();
    const pets=await db.prepare('SELECT id, data FROM public_pets WHERE visible = 1 ORDER BY updated_at DESC LIMIT 300').all<any>();
    const publicComments=await db.prepare('SELECT id, post_id, name, message AS text, created_at FROM social_comments WHERE post_id IN (SELECT id FROM social_posts WHERE deleted=0 ORDER BY created_at DESC LIMIT 100) ORDER BY created_at LIMIT 1000').all<any>();
    const base={ok:true,signedIn:!!user,comments:publicComments.results,likes:[],bookmarks:[],following:[],blocked:[],invites:[],posts:posts.results.map(p=>({...JSON.parse(p.data),id:p.id,cloud:true,friend:p.author_id,mine:p.owner===user,likes:p.likes})),friends:pets.results.map(p=>({...JSON.parse(p.data),id:p.id,cloud:true}))};
    if(!user)return json(base);
    const owner=await scope(db,user);const space=await loadSpace(db,bucket,owner);
    const [invites,comments,likes,marks,following,hidden,members]=await Promise.all([
      db.prepare('SELECT id, sender, receiver, data, status, created_at FROM social_invites WHERE sender = ? OR receiver = ? ORDER BY created_at DESC LIMIT 100').bind(user,user).all<any>(),
      db.prepare('SELECT id, post_id, name, message AS text, created_at FROM social_comments WHERE post_id IN (SELECT id FROM social_posts WHERE deleted = 0 ORDER BY created_at DESC LIMIT 100) ORDER BY created_at LIMIT 1000').all<any>(),
      db.prepare('SELECT post_id AS id FROM social_likes WHERE owner = ?').bind(user).all<any>(),
      db.prepare('SELECT post_id AS id FROM social_bookmarks WHERE owner = ?').bind(user).all<any>(),
      db.prepare('SELECT target AS id FROM social_follows WHERE owner = ?').bind(user).all<any>(),
      db.prepare('SELECT target AS id FROM social_blocks WHERE owner = ?').bind(user).all<any>(),
      db.prepare('SELECT user FROM family_members WHERE owner = ?').bind(owner).all<any>()]);
    return json({...base,...space,spaceId:await publicId(owner),viewer:await publicId(user),family:{shared:owner!==user||members.results.length>0,isOwner:owner===user,members:members.results.length+1},invites:invites.results.map(i=>({...JSON.parse(i.data),id:i.id,status:i.status,incoming:i.receiver===user,created:i.created_at})),comments:comments.results,likes:likes.results.map(x=>x.id),bookmarks:marks.results.map(x=>x.id),following:following.results.map(x=>x.id),blocked:hidden.results.map(x=>x.id)});
  }catch{return json({ok:false,error:'云端服务暂时不可用，本机记录仍可使用。'},503);}
}
export async function POST(request:Request){
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({ok:false,error:'请从网站内操作。'},403);
  const user=identity(request);if(!user)return json({ok:false,error:'请先登录，再使用云端功能。'},401);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({ok:false,error:'格式不正确'},415);
  const raw=await request.text();if(new TextEncoder().encode(raw).length>16000000)return json({ok:false,error:'本次内容过大，请减少照片或分批记录。'},413);
  let d:any;try{d=JSON.parse(raw);}catch{return json({ok:false,error:'无法读取提交内容'},400);}
  if(!d||typeof d!=='object'||Array.isArray(d))return json({ok:false,error:'格式不正确'},400);
  try{
    const {DB:db,BUCKET:bucket}=bindings(),owner=await scope(db,user),now=Date.now(),author=await publicId(user);
    // Cap public writes per signed-in visitor; private snapshot reads have no social side effect.
    if(!['sync','messages'].includes(d.action)){
      const rate=await db.prepare('INSERT INTO hub_limits (owner, window, count) VALUES (?, ?, 1) ON CONFLICT(owner) DO UPDATE SET count = CASE WHEN window = excluded.window THEN count + 1 ELSE 1 END, window = excluded.window RETURNING count').bind(user,Math.floor(now/60000)).first<{count:number}>();
      if((rate?.count||0)>40)return json({ok:false,error:'操作较频繁，请一分钟后重试。'},429);
    }
    switch(d.action){
      case 'sync':{
        if(!Number.isInteger(d.revision)||d.revision<0)return json({ok:false,error:'同步版本无效'},400);
        let data;try{data=snapshot(d.data);}catch{return json({ok:false,error:'档案格式不正确，请检查宠物归属与日期。'},400);}const objectKey='spaces/'+await publicId(owner)+'/'+key()+'.json';
        await bucket.put(objectKey,JSON.stringify(data),{httpMetadata:{contentType:'application/json'}});
        const old=await db.prepare('SELECT object_key FROM cloud_spaces WHERE owner = ?').bind(owner).first<{object_key:string}>();
        const result=d.revision===0?await db.prepare('INSERT INTO cloud_spaces (owner, revision, object_key, updated_at) VALUES (?, 1, ?, ?) ON CONFLICT(owner) DO NOTHING').bind(owner,objectKey,now).run():await db.prepare('UPDATE cloud_spaces SET revision = revision + 1, object_key = ?, updated_at = ? WHERE owner = ? AND revision = ?').bind(objectKey,now,owner,d.revision).run();
        if(!result.meta.changes){await bucket.delete(objectKey);return json({ok:false,conflict:true,error:'另一台设备已更新，请先处理版本冲突。',...await loadSpace(db,bucket,owner)},409);}
        if(old?.object_key)await bucket.delete(old.object_key).catch(()=>{});
        return json({ok:true,revision:d.revision+1});
      }
      case 'publishProfile':{
        const p=d.pet||{},id=await publicId(user+':'+text(p.id,80));if(!PET_TYPES.includes(p.type)||!text(p.name,20)||!text(p.city,30))return json({ok:false,error:'请先填写宠物名字、类型和城市。'},400);
        const data={name:text(p.name,20),type:p.type,breed:text(p.breed,40),city:text(p.city,30),district:text(p.district,30),size:text(p.size,10),personality:text(p.personality,20),intent:text(p.intent,20),time:text(p.time,30),age:text(d.age,20),owner:text(d.nickname,20)||'养宠人',bio:text(d.bio,200),photo:picture(p.photo),author,place:p.type==='犬'?'公共地点见面或线上交流':'线上交流'};
        await db.prepare('INSERT INTO public_pets (id,owner,data,visible,updated_at) VALUES (?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,visible=1,updated_at=excluded.updated_at').bind(id,user,JSON.stringify(data),now).run();return json({ok:true,id});
      }
      case 'hideProfile':await db.prepare('UPDATE public_pets SET visible=0 WHERE owner = ?').bind(user).run();return json({ok:true});
      case 'post':{
        const p=d.post||{},title=text(p.title,80),memo=text(p.memo,2000),photos=(Array.isArray(p.photos)?p.photos:[]).slice(0,3).map(picture).filter(Boolean);if(!title&&!memo&&!photos.length)return json({ok:false,error:'请填写文字或照片'},400);
        const id=text(p.id,80)||key(),existing=await db.prepare('SELECT owner FROM social_posts WHERE id=?').bind(id).first<{owner:string}>();if(existing&&existing.owner!==user)return json({ok:false,error:'不能编辑他人的内容'},403);
        const data={title,memo,photos,petName:text(p.petName,20),pet:text(p.pet,80),species:PET_TYPES.includes(p.species)?p.species:'其他',owner:text(p.owner,20)||'养宠人',topic:['日常晒宠','成长瞬间','养宠经验','求助交流'].includes(p.topic)?p.topic:'日常晒宠',city:text(p.city,30),day:new Date(now).toISOString().slice(0,10),created:now};
        await db.prepare('INSERT INTO social_posts (id,owner,author_id,data,created_at,deleted) VALUES (?,?,?,?,?,0) ON CONFLICT(id) DO UPDATE SET data=excluded.data WHERE owner=excluded.owner AND deleted=0').bind(id,user,author,JSON.stringify(data),now).run();return json({ok:true,id});
      }
      case 'deletePost':await db.prepare('UPDATE social_posts SET deleted=1 WHERE id=? AND owner=?').bind(text(d.id,80),user).run();return json({ok:true});
      case 'comment':{
        const message=text(d.message,500);if(!message)return json({ok:false,error:'评论不能为空'},400);
        const exists=await db.prepare('SELECT id,owner FROM social_posts WHERE id=? AND deleted=0').bind(text(d.id,80)).first<{id:string,owner:string}>();if(!exists)return json({ok:false,error:'内容已不存在'},404);if(await db.prepare('SELECT target FROM social_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)').bind(user,await publicId(exists.owner),exists.owner,author).first())return json({ok:false,error:'当前无法评论此内容'},403);
        await db.prepare('INSERT INTO social_comments (id,post_id,owner,name,message,created_at) VALUES (?,?,?,?,?,?)').bind(key(),d.id,user,text(d.name,20)||'养宠人',message,now).run();return json({ok:true});
      }
      case 'like':case 'bookmark':case 'follow':case 'block':{
        const table={like:'social_likes',bookmark:'social_bookmarks',follow:'social_follows',block:'social_blocks'}[d.action as 'like'|'bookmark'|'follow'|'block'],column=['follow','block'].includes(d.action)?'target':'post_id',id=text(d.id,80);
        if(['like','bookmark'].includes(d.action)&&!await db.prepare('SELECT id FROM social_posts WHERE id=? AND deleted=0').bind(id).first())return json({ok:false,error:'内容已不存在'},404);
        if(d.enabled)await db.prepare(`INSERT INTO ${table} (owner,${column}) VALUES (?,?) ON CONFLICT DO NOTHING`).bind(user,id).run();else await db.prepare(`DELETE FROM ${table} WHERE owner=? AND ${column}=?`).bind(user,id).run();return json({ok:true});
      }
      case 'report':await db.prepare('INSERT INTO social_reports (id,owner,post_id,reason,created_at) VALUES (?,?,?,?,?)').bind(key(),user,text(d.id,80),text(d.reason,300)||'用户反馈',now).run();return json({ok:true});
      case 'invite':{
        const p=await db.prepare('SELECT owner,data FROM public_pets WHERE id=? AND visible=1').bind(text(d.target,80)).first<{owner:string,data:string}>();if(!p||p.owner===user)return json({ok:false,error:'请选择其他宠友'},400);
        const blocked=await db.prepare('SELECT target FROM social_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)').bind(user,await publicId(p.owner),p.owner,author).first();if(blocked)return json({ok:false,error:'暂时无法发送邀请'},403);
        const pending=await db.prepare("SELECT id FROM social_invites WHERE ((sender=? AND receiver=?) OR (sender=? AND receiver=?)) AND status IN ('pending','accepted')").bind(user,p.owner,p.owner,user).first();if(pending)return json({ok:false,error:'已有邀请或会话，请在消息中查看。'},409);
        const memo=text(d.memo,300),day=text(d.day,10);if(!memo||!/^\d{4}-\d{2}-\d{2}$/.test(day)||day<new Date(now).toISOString().slice(0,10))return json({ok:false,error:'请填写留言，并选择今天或之后的日期'},400);
        const id=key(),data={memo,day,time:text(d.time,10),place:text(d.place,80),intent:text(d.intent,30),targetName:JSON.parse(p.data).name,senderName:text(d.name,20)||'养宠人'};
        await db.prepare("INSERT INTO social_invites (id,sender,receiver,data,status,created_at) VALUES (?,?,?,?,'pending',?)").bind(id,user,p.owner,JSON.stringify(data),now).run();return json({ok:true,id});
      }
      case 'respondInvite':{
        if(!['accepted','declined'].includes(d.status))return json({ok:false,error:'状态无效'},400);
        await db.prepare("UPDATE social_invites SET status=? WHERE id=? AND receiver=? AND status='pending'").bind(d.status,text(d.id,80),user).run();return json({ok:true});
      }
      case 'cancelInvite':await db.prepare("UPDATE social_invites SET status='cancelled' WHERE id=? AND sender=? AND status='pending'").bind(text(d.id,80),user).run();return json({ok:true});
      case 'messages':case 'message':{
        const id=text(d.id,80);if(!await member(db,id,user))return json({ok:false,error:'双方同意邀请后才能交流'},403);
        if(d.action==='message'){const message=text(d.message,1000);if(!message)return json({ok:false,error:'消息不能为空'},400);const inv=await db.prepare('SELECT sender,receiver FROM social_invites WHERE id=?').bind(id).first<{sender:string,receiver:string}>();const other=inv?.sender===user?inv.receiver:inv?.sender;if(other&&await db.prepare('SELECT target FROM social_blocks WHERE (owner=? AND target=?) OR (owner=? AND target=?)').bind(user,await publicId(other),other,author).first())return json({ok:false,error:'当前无法发送消息'},403);await db.prepare('INSERT INTO social_messages (id,invite_id,owner,name,message,created_at) VALUES (?,?,?,?,?,?)').bind(key(),id,user,text(d.name,20)||'养宠人',message,now).run();}
        const rows=await db.prepare('SELECT owner,name,message,created_at FROM social_messages WHERE invite_id=? ORDER BY created_at DESC LIMIT 100').bind(id).all<any>();return json({ok:true,messages:rows.results.reverse().map(r=>({mine:r.owner===user,name:r.name,text:r.message,time:r.created_at}))});
      }
      case 'familyCode':{
        if(owner!==user)return json({ok:false,error:'只有家庭创建者可以邀请成员'},403);
        const code=crypto.randomUUID().replaceAll('-','').slice(0,24).toUpperCase();await db.prepare('INSERT INTO family_codes (code,owner,expires_at) VALUES (?,?,?)').bind(await publicId(code),user,now+86400000).run();return json({ok:true,code});
      }
      case 'joinFamily':{
        const found=await db.prepare('SELECT owner FROM family_codes WHERE code=? AND expires_at>?').bind(await publicId(text(d.code,24).toUpperCase()),now).first<{owner:string}>();if(!found||found.owner===user)return json({ok:false,error:'邀请码无效、已过期或属于自己'},400);
        if(await db.prepare('SELECT user FROM family_members WHERE owner=?').bind(user).first())return json({ok:false,error:'你已创建共享家庭，暂不能加入另一个家庭'},409);
        await db.prepare('INSERT INTO family_members (user,owner) VALUES (?,?) ON CONFLICT(user) DO UPDATE SET owner=excluded.owner').bind(user,found.owner).run();return json({ok:true});
      }
      case 'leaveFamily':await db.prepare('DELETE FROM family_members WHERE user=?').bind(user).run();return json({ok:true});
      case 'closeFamily':await db.batch([db.prepare('DELETE FROM family_members WHERE owner=?').bind(user),db.prepare('DELETE FROM family_codes WHERE owner=?').bind(user)]);return json({ok:true});
      default:return json({ok:false,error:'不支持的操作'},400);
    }
  }catch(e){return json({ok:false,error:e instanceof Error&&e.message.includes('备份')?e.message:'保存失败，内容仍在本机，请稍后重试。'},503);}
}
