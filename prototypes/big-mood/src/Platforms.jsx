import React,{useState} from 'react'
import {cad} from './data'
import {platformOptions,validatePlatform,removePlatform,summarizePlatforms} from './platforms-model'

function PlatformAdd({data,setData,onAdded,disabled}){
 const [adding,setAdding]=useState(false),[name,setName]=useState(''),[error,setError]=useState('')
 const add=()=>{const clean=name.trim().replace(/\s+/g,' ');const issue=validatePlatform(clean,data.platforms);if(issue){setError(issue);return}const platform={id:crypto.randomUUID(),name:clean};setData(d=>({...d,platforms:[...d.platforms,platform]}));onAdded?.(platform.id);setAdding(false);setName('');setError('')}
 return !adding?<button className="btn text" type="button" disabled={disabled} onClick={()=>setAdding(true)}>Add a platform</button>:<div className="source-add"><label className="field"><span>New platform name</span><input maxLength={40} value={name} onChange={e=>{setName(e.target.value);setError('')}} placeholder="For example, Facebook Marketplace"/></label><div className="button-row"><button className="btn" type="button" disabled={disabled} onClick={add}>Add platform</button><button className="btn text" type="button" onClick={()=>{setAdding(false);setError('')}}>Cancel</button></div>{error&&<p className="error" role="alert">{error}</p>}</div>
}
export function PlatformPicker({data,setData,value,onChange,disabled}){
 return <div className="source-picker"><label className="field"><span>Sold through</span><select disabled={disabled} value={value} onChange={e=>onChange(e.target.value)}>{platformOptions(data).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><PlatformAdd data={data} setData={setData} onAdded={onChange} disabled={disabled}/></div>
}
function PlatformEdit({platform,data,setData,disabled}){
 const [name,setName]=useState(platform.name),[error,setError]=useState(''),[confirming,setConfirming]=useState(false)
 const used=data.orders.filter(o=>o.platform===platform.id).length
 const save=()=>{const clean=name.trim().replace(/\s+/g,' ');const issue=validatePlatform(clean,data.platforms,platform.id);if(issue){setError(issue);return}setData(d=>({...d,platforms:d.platforms.map(p=>p.id===platform.id?{...p,name:clean}:p)}));setError('Saved. All linked orders use this name.')}
 return <div className="source-edit"><label className="field"><span>Platform name</span><input aria-label={`Rename ${platform.name}`} value={name} maxLength={40} disabled={disabled} onChange={e=>{setName(e.target.value);setError('')}}/></label><button className="btn" disabled={disabled||name===platform.name} type="button" onClick={save}>Save name</button>{!confirming?<button className="btn text danger" disabled={disabled} type="button" onClick={()=>setConfirming(true)}>Remove</button>:<p className="notice warning" role="alert">Remove {platform.name}?{used?` ${used} order${used===1?'':'s'} will show as Not recorded.`:''} <button className="btn text danger" type="button" onClick={()=>setData(d=>removePlatform(d,platform.id))}>Yes, remove</button><button className="btn text" type="button" onClick={()=>setConfirming(false)}>Keep it</button></p>}{error&&<p className="fine" role="status">{error}</p>}</div>
}
export function PlatformManager({data,setData,disabled}){
 return <details className="source-manager"><summary>Manage selling platforms</summary><p className="fine">Rename a platform here to update every linked order. Not recorded is a fixed option.</p>{data.platforms.map(p=><PlatformEdit key={p.id} platform={p} data={data} setData={setData} disabled={disabled}/>)}<PlatformAdd data={data} setData={setData} disabled={disabled}/></details>
}
export function PlatformReport({data}){
 const rows=summarizePlatforms(data)
 return <section className="source-report"><div className="section-line"><h2>Which platforms sell best?</h2></div><p>Paid orders, grouped by where the buyer found you. Highest sales first.</p><p className="fine">Profit is after refunds, item costs, preparation and postage, before shared business expenses. Unpaid reservations are counted separately, not as sales.</p>{rows.length?rows.map(r=><article className="source-result" key={r.id}><h3>{r.name}</h3><dl><div><dt>Paid orders</dt><dd>{r.orders}</dd></div><div><dt>Pieces sold</dt><dd>{r.pieces}</dd></div><div><dt>Awaiting payment</dt><dd>{r.awaiting}</dd></div><div><dt>Sales received, net</dt><dd>{cad(r.revenue)}</dd></div><div><dt>Profit before overhead</dt><dd>{r.profit===null?'Cost missing':cad(r.profit)}</dd></div></dl>{r.unknownSales>0&&<p className="fine">{r.unknownSales} sold piece(s) have no confirmed cost. Profit is incomplete.</p>}</article>):<p>Record a platform on an order to start comparing.</p>}<p className="fine">Sample data only.</p></section>
}
