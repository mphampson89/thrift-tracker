import {seed} from './data.js'
export const unknownPlatform = {id:'unknown',name:'Not recorded'}
// Older saved demos have no platform list: give them the starter list, and sample orders their sample platform.
export const normalizePlatforms = data => ({...data,platforms:data.platforms||structuredClone(seed.platforms),orders:data.orders.map(o=>({...o,platform:o.platform||seed.orders.find(s=>s.id===o.id)?.platform||'unknown'}))})
export const platformOptions = data => [...(data.platforms||[]),unknownPlatform]
export const platformName = (data,id) => platformOptions(data).find(p=>p.id===id)?.name||'Not recorded'
export function validatePlatform(name,platforms,exceptId){
 const clean=name.trim().replace(/\s+/g,' ')
 if(!clean)return 'Enter a platform name.'
 if(clean.length>40)return 'Use 40 characters or fewer.'
 if([...platforms,unknownPlatform].some(p=>p.id!==exceptId&&p.name.toLowerCase()===clean.toLowerCase()))return 'That platform already exists.'
 return ''
}
// Removing a platform keeps its orders; they show as Not recorded.
export const removePlatform = (data,id) => ({...data,platforms:data.platforms.filter(p=>p.id!==id),orders:data.orders.map(o=>o.platform===id?{...o,platform:'unknown'}:o)})
export function summarizePlatforms(data){
 const rows=platformOptions(data).map(p=>({...p,orders:0,pieces:0,revenue:0,cost:0,shipping:0,unknownSales:0,awaiting:0}))
 for(const o of data.orders){
  const r=rows.find(r=>r.id===o.platform)||rows.find(r=>r.id==='unknown')
  if(o.status==='Awaiting payment'){r.awaiting++;continue}
  if(!['Paid','Completed','Refunded'].includes(o.status))continue
  r.orders++;r.revenue+=o.total-(o.refund||0);r.shipping+=o.actualShipping||0
  if(o.restocked)continue
  for(const i of o.items.map(id=>data.items.find(i=>i.id===id)).filter(Boolean)){r.pieces++;if(i.cost==null)r.unknownSales++;else r.cost+=Number(i.cost)+(Number(i.prep)||0)}
 }
 return rows.filter(r=>r.orders||r.awaiting).map(r=>({...r,profit:r.unknownSales?null:r.revenue-r.cost-r.shipping})).sort((a,b)=>b.revenue-a.revenue||a.name.localeCompare(b.name))
}
