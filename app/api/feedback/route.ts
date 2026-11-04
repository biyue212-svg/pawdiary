import {database,configured} from '../../../lib/runtime';
export const runtime='nodejs';
const categories = new Set(['功能建议','使用问题','宠物类型与照护需求','界面体验','其他']);
const species = new Set(['不指定','犬','狗','猫','鸟','蜥蜴','仓鼠','兔','龟','鱼','其他']);
const response = (data: unknown, status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const own = new URL(request.url).origin;
  if (origin && origin !== own) return response({ok:false,error:'请从网站内提交反馈。'},403);
  if (!request.headers.get('content-type')?.includes('application/json')) return response({ok:false,error:'提交格式不正确。'},415);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length>12000) return response({ok:false,error:'内容过长，请精简后提交。'},413);
  let data: Record<string,unknown>;
  try {data=JSON.parse(raw);if(!data || Array.isArray(data)||typeof data!=='object')throw Error();}catch{return response({ok:false,error:'无法读取内容，请重试。'},400);}
  if (data.website) return response({ok:false,error:'提交未通过验证。'},400);
  const {id,clientId,category,species:petType}=data;
  const message=typeof data.message==='string'?data.message.trim():'';
  const contact=typeof data.contact==='string'?data.contact.trim():'';
  if(typeof id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(id)||typeof clientId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(clientId)||typeof category!=='string'||!categories.has(category)||typeof petType!=='string'||!species.has(petType)||message.length<5||message.length>2000||contact.length>120)return response({ok:false,error:'请检查反馈类型与内容，意见需为5至2000字。'},400);
  const db = configured()?database():null;
  if(!db) return response({ok:false,error:'反馈服务暂时不可用，内容已保留，请稍后重试。'},503);
  try {
    const existing=await db.prepare('SELECT id FROM feedback WHERE id = ? AND client_id = ?').bind(id,clientId).first();
    if(existing) return response({ok:true,id});
    // Bound the write rate for the anonymous browser identifier. No IP or device fingerprint is collected.
    const now=Date.now();
    const write=await db.prepare('INSERT INTO feedback (id,client_id,category,species,message,contact,created_at) SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM feedback WHERE client_id = ? AND created_at > ?) < 5 ON CONFLICT(id) DO NOTHING').bind(id,clientId,category,petType,message,contact,now,clientId,now-600000).run();
    if(!write.meta.changes)return response({ok:false,error:'提交较频繁，请稍等10分钟再试。'},429);
    return response({ok:true,id},201);
  } catch {return response({ok:false,error:'暂时无法保存，填写内容已保留，请稍后重试。'},503);}
}
