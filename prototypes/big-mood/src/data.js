export const themes = {
  label: { name: 'Blue Label', note: 'Familiar, with a vintage point of view.', description: 'Blue navigation, burgundy details and a practical photo-led workspace.' },
  studio: { name: 'Studio', note: 'More room for the clothes.', description: 'A quieter gallery, a horizontal menu and a pared-back working space.' },
  club: { name: 'Clubhouse', note: 'A little more Big Mood.', description: 'A blue canvas, softer shapes and a more expressive brand presence.' },
}
export const seed = {
 sources: [{id:'shop-a',name:'Neighbourhood thrift (sample)'},{id:'shop-b',name:'Community resale (sample)'}],
 items: [
  {id:'BM-001',sourcedFrom:'shop-a',name:'Burgundy scallop cardigan',photo:0,cost:12,price:48,status:'Ready to list',size:'M',condition:'Very good',flaws:'Light pilling at cuffs, shown in photos.',location:'Rack 1',source:'Thrift purchase',date:'2026-09-21',notes:'Soft knit. Cream buttons. Brand unconfirmed.',measurements:'Chest 48 cm flat; length 55 cm',target:20,prep:2,listed:'',caption:''},
  {id:'BM-002',sourcedFrom:'shop-b',name:'Everyday denim jacket',photo:1,cost:18,price:65,status:'Listed',size:'L',condition:'Good',flaws:'Faded collar and light wear at the sleeve edges.',location:'Rack 1',source:'Thrift purchase',date:'2026-08-12',listed:'2026-08-15',notes:'A relaxed fit in medium-wash denim.',measurements:'Chest 58 cm flat; length 61 cm',target:25,prep:0},
  {id:'BM-003',sourcedFrom:'shop-a',name:'Cognac shoulder bag',photo:2,cost:15,price:58,status:'Reserved',size:'One size',condition:'Good',flaws:'Scuff on the base.',location:'Shelf 2',source:'Thrift purchase',date:'2026-09-16',listed:'2026-09-18',notes:'Material and maker to confirm.',target:20,prep:0},
  {id:'BM-004',sourcedFrom:'shop-b',name:'Cream cable knit',photo:3,cost:9,price:42,status:'Preparing',size:'Unknown',condition:'Good',flaws:'One small loose thread.',location:'Bin 2',source:'Thrift purchase',date:'2026-09-20',notes:'Needs measurements and a steam.',target:20,prep:0},
  {id:'BM-005',sourcedFrom:'personal',name:'Printed square scarf',photo:4,cost:null,originalCost:75,price:32,status:'Ready to list',size:'One size',condition:'Very good',flaws:'No known flaws.',location:'Bin 2',source:'Personal item',date:'2026-09-20',notes:'Personal contribution. Transfer value not yet confirmed.',target:15,prep:0},
  {id:'BM-006',sourcedFrom:'shop-a',name:'Charcoal pleated trousers',photo:5,cost:14,price:54,status:'Sold',size:'M',condition:'Very good',flaws:'No known flaws.',location:'',source:'Thrift purchase',date:'2026-09-09',listed:'2026-09-10',notes:'Wool blend.',target:20,prep:0},
 ],
 customers: [
  {id:'c1',name:'Emma R.',handle:'@emma_demo',email:'',phone:'',address:'',flags:['Reliable buyer'],notes:[{date:'2026-09-12',text:'Arrived at the agreed time.',order:'BM-098'}]},
  {id:'c2',name:'Jess M.',handle:'@jess_demo',email:'',phone:'',address:'',flags:['Missed pickup','Review before accepting another order'],notes:[{date:'2026-09-10',text:'Missed the agreed pickup without a message. Rebooked and collected the next day.',order:'BM-097'}]},
 ],
 orders: [
  {id:'BM-101',items:['BM-003'],customer:'c1',total:58,fee:0,actualShipping:0,discount:0,status:'Awaiting payment',method:'Local pickup',date:'2026-09-21',deadline:'2026-09-22T18:00',appointment:'2026-09-23T18:00',instructions:'Confirm pickup details in Instagram.',reference:'',refund:0},
  {id:'BM-100',items:['BM-006'],customer:'c1',total:54,fee:0,actualShipping:0,discount:0,status:'Completed',method:'Local pickup',date:'2026-09-19',deadline:'',appointment:'',instructions:'Collected.',reference:'DEMO-019',refund:0},
 ],
 expenses:[{id:'e1',vendor:'Packaging supplies',amount:8.5,category:'Packaging',date:'2026-09-19',receipt:true},{id:'e2',vendor:'Laundry supplies',amount:4.5,category:'Cleaning',date:'2026-09-20',receipt:true}],
 researchSpent:0,
}
export const flags=['Reliable buyer','Late payment','Missed pickup','Difficult communication','Rude behaviour','Review before accepting another order']
export const cad = n => new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD'}).format(n ?? 0)
export function summarize(data){
 const paid=data.orders.filter(o=>['Paid','Completed','Refunded'].includes(o.status))
 const revenue=paid.reduce((s,o)=>s+o.total-(o.refund||0),0)
 const soldIds=paid.filter(o=>!o.restocked).flatMap(o=>o.items)
 const goods=data.items.filter(i=>soldIds.includes(i.id))
 const cost=goods.reduce((s,i)=>s+(i.cost??0)+(i.prep||0),0)
 const shipping=paid.reduce((s,o)=>s+(o.actualShipping||0),0)
 const overhead=data.expenses.reduce((s,e)=>s+Number(e.amount),0)
 return {revenue,cost,shipping,overhead,profit:revenue-cost-shipping-overhead,unknown:goods.filter(i=>i.cost===null).length,stock:data.items.filter(i=>!['Sold','Archived'].includes(i.status)).reduce((s,i)=>s+(i.cost??0),0),unpaid:data.orders.filter(o=>o.status==='Awaiting payment').reduce((s,o)=>s+o.total,0)}
}
