import React, {useEffect, useRef, useState} from 'react'
import {Signal, Wifi, BatteryFull, MessageSquare, ArrowUpRight} from 'lucide-react'
import {themes} from './data'
import {reviewTheme} from './sources-model'
import './phone-preview.css'

const params = new URLSearchParams(location.search)
export const inPhoneFrame = params.get('phone') === '1'
const savedTheme = () => {try {return reviewTheme(JSON.parse(localStorage.getItem('bigmood.prototype.v1')))}catch{return 'club'}}

export default function PrototypePreview({children}) {
 const [size,setSize]=useState({width:innerWidth,height:innerHeight})
 const [theme,setTheme]=useState(savedTheme)
 const [ready,setReady]=useState(false)
 const frame=useRef(null)
 const initialTheme=useRef(theme)
 useEffect(()=>{const resize=()=>setSize({width:innerWidth,height:innerHeight});window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[])
 useEffect(()=>{const receive=e=>{if(e.origin===location.origin&&e.source===frame.current?.contentWindow&&e.data?.type==='bigmood:theme'&&themes[e.data.theme]){setTheme(e.data.theme);setReady(true)}};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)},[])
 const command=(action,value)=>frame.current?.contentWindow.postMessage({type:'bigmood:preview',action,value},location.origin)
 const showPhone=!inPhoneFrame&&params.get('view')!=='desktop'&&(params.get('view')==='iphone'||size.width>700||matchMedia('(pointer:fine)').matches)
 if(!showPhone)return children
 const compact=size.width<800
 const scale=Math.max(.35,Math.min(1,(size.height-(compact?278:80))/872,(size.width-(compact?36:390))/414))
 return <div className="device-preview">
  <section className="device-controls" aria-label="Prototype review controls">
   <p className="device-eyebrow">BIG MOOD VINTAGE · PROTOTYPE</p>
   <h1>Your business.<br/> In your pocket.</h1>
   <p className="device-instructions">Click and scroll inside the iPhone to try the app. Clubhouse is Jenn’s pick. Try sourcing in Inventory and the comparison in Money.</p>
   <label className="device-direction">Visual direction<select aria-label="Visual direction" disabled={!ready} value={theme} onChange={e=>{setTheme(e.target.value);command('theme',e.target.value)}}>{Object.entries(themes).map(([id,t])=><option key={id} value={id}>{t.name}</option>)}</select></label>
   <div className="device-actions"><button disabled={!ready} onClick={()=>command('feedback')}><MessageSquare size={16}/>Leave feedback</button><button disabled={!ready} onClick={()=>command('guide')}>Review guide</button><button disabled={!ready} className="logo-review-trigger" onClick={()=>command('logos')}>Compare logos</button></div>
   <a className="device-fullscreen" href="?view=desktop">Open full-screen <ArrowUpRight size={15}/></a>
   <p className="device-footnote">Sample data only. Feedback stays on this device until you share it.</p>
  </section>
  <div className="device-stage"><div className="device-scaled" style={{width:414*scale,height:872*scale}}><div className="iphone-model" style={{transform:`scale(${scale})`}}>
   <span className="iphone-side side-silent"/><span className="iphone-side side-up"/><span className="iphone-side side-down"/><span className="iphone-side side-power"/>
   <div className="iphone-glass"><div className="iphone-status" aria-hidden="true"><span>9:41</span><span className="iphone-island"/><span className="iphone-status-icons"><Signal size={16}/><Wifi size={16}/><BatteryFull size={23}/></span></div>
    <iframe ref={frame} title="Interactive Big Mood Vintage iPhone prototype" src={`?phone=1&direction=${initialTheme.current}`} allow="clipboard-write; web-share"/>
    <div className="iphone-bottom" aria-hidden="true"><span/></div>
   </div>
  </div></div><p className="device-caption">Interactive iPhone preview</p></div>
 </div>
}
