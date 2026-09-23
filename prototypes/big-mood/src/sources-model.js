export const fixedSources = [{id:'personal',name:'Personal wardrobe'},{id:'unknown',name:'Not recorded'}]
export const reviewTheme = saved => saved?.reviewRevision === 2 && ['club','studio','label'].includes(saved.theme) ? saved.theme : 'club'
export const normalizeSources = data => ({...data,sources:data.sources||[],items:data.items.map(i=>({...i,sourcedFrom:i.sourcedFrom||(i.source==='Personal item'?'personal':'unknown')}))})
export const sourceOptions = data => [...(data.sources||[]),...fixedSources]
export const sourceName = (data,id) => sourceOptions(data).find(s=>s.id===id)?.name||'Not recorded'
export function validateSource(name,sources,exceptId){
 const clean=name.trim().replace(/\s+/g,' ')
 if(!clean)return 'Enter a store or source name.'
 if(clean.length>70)return 'Use 70 characters or fewer.'
 if([...sources,...fixedSources].some(s=>s.id!==exceptId&&s.name.toLowerCase()===clean.toLowerCase()))return 'That source already exists. Choose it from the list.'
 return ''
}
// Allocate whole cents, including the remainder, so bundle totals reconcile.
function allocate(amount,weights){
 const cents=Math.round(amount*100),sum=weights.reduce((a,b)=>a+b,0)
 let cumulative=0,assigned=0
 return weights.map((w,i)=>{cumulative+=sum?w/sum:1/weights.length;const target=i===weights.length-1?cents:Math.round(cents*cumulative);const n=target-assigned;assigned=target;return n/100})
}
export function summarizeSources(data){
 const rows=sourceOptions(data).map(s=>({...s,finds:0,sales:0,unsold:0,stock:0,unknownStock:0,revenue:0,cost:0,shipping:0,unknownSales:0}))
 const rowFor=i=>rows.find(r=>r.id===(i.sourcedFrom||'unknown'))||rows.find(r=>r.id==='unknown')
 for(const i of data.items){const r=rowFor(i);r.finds++;if(!['Sold','Archived'].includes(i.status)){r.unsold++;if(i.cost==null)r.unknownStock++;else r.stock+=Number(i.cost)}}
 for(const o of data.orders.filter(o=>['Paid','Completed','Refunded'].includes(o.status))){
  const items=o.items.map(id=>data.items.find(i=>i.id===id)).filter(Boolean)
  const weights=items.map(i=>Math.max(0,Number(i.price)||0))
  const revenue=allocate(o.total-(o.refund||0),weights),shipping=allocate(o.actualShipping||0,weights)
  items.forEach((i,n)=>{const r=rowFor(i);r.revenue+=revenue[n];r.shipping+=shipping[n];if(!o.restocked){r.sales++;if(i.cost==null)r.unknownSales++;else r.cost+=Number(i.cost)+(Number(i.prep)||0)}})
 }
 return rows.filter(r=>r.finds).map(r=>({...r,profit:r.unknownSales?null:r.revenue-r.cost-r.shipping})).sort((a,b)=>(b.profit??-Infinity)-(a.profit??-Infinity)||a.name.localeCompare(b.name))
}
