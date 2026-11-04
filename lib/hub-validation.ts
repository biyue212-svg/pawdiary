export const PET_TYPES = ['犬','猫','鸟','蜥蜴','仓鼠','兔','龟','鱼','其他'];
export function text(value: unknown, max=2000) { return typeof value === 'string' ? value.trim().slice(0,max) : ''; }
export function picture(value: unknown) {
  const s = text(value, 800000);
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : '';
}
export function snapshot(value: unknown) {
  if(!value || typeof value !== 'object' || Array.isArray(value)) throw Error('备份格式不正确');
  const d = value as Record<string, any>;
  if(!Array.isArray(d.pets)||!Array.isArray(d.records)||d.pets.length>100||d.records.length>20000) throw Error('档案格式或数量不正确');
  const ids=new Set<string>();
  for(const p of d.pets) {if(!p || typeof p.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(p.id)||ids.has(p.id)||!text(p.name,20)||!PET_TYPES.includes(p.type))throw Error('宠物档案不完整');ids.add(p.id);}
  for(const r of d.records) {if(!r||!ids.has(r.pet)||typeof r.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(r.id)||!/^\d{4}-\d{2}-\d{2}$/.test(r.day)||!['日常','体重','疫苗','驱虫','护理','里程碑'].includes(r.kind))throw Error('记录缺少归属或日期');}
  return d;
}
