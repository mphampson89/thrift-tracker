import React from 'react'
import './logos.css'
export const logos = [
 {id:'1a',name:'Editorial',file:'1a-editorial.png'},
 {id:'1b',name:'Y2K sticker',file:'1b-y2k-sticker.png'},
 {id:'1c',name:'Boutique monogram',file:'1c-boutique-monogram.png'},
 {id:'1d',name:'Retro arch',file:'1d-retro-arch.png'},
 {id:'1e',name:'Hang tag',file:'1e-hang-tag.png'},
 {id:'1f',name:'Mood face',file:'1f-mood-face.png'},
]
export const logoLabel=id=>{const l=logos.find(l=>l.id===id);return l?`${l.id.toUpperCase()} ${l.name}`:'Original wordmark'}
export function LogoImage({id,avatar=false,...props}){const l=logos.find(l=>l.id===id);return l?<img {...props} src={`/assets/logos/${avatar?`avatar-${id}.png`:l.file}`} alt={`${logoLabel(id)} logo`}/>:null}
export function LogoReview({selected,onSelect,onComment,onTry}){return <section className="logo-review"><p className="eyebrow">Brand review · Six supplied options</p><h1>Which feels like Big Mood?</h1><p>Compare the full logo and its small profile version. Your selection carries through the app, website concept and post preview.</p><div className="logo-options">{logos.map(l=><button key={l.id} className={selected===l.id?'selected':''} aria-pressed={selected===l.id} onClick={()=>onSelect(l.id)}><LogoImage id={l.id}/><span>{logoLabel(l.id)}</span><small>{selected===l.id?'Selected for preview':'Try this logo'}</small></button>)}</div><div className="logo-detail"><LogoImage id={selected}/><div><h2>{logoLabel(selected)}</h2><p>At profile size</p><div className="logo-sizes"><LogoImage id={selected} avatar width="64" height="64"/><LogoImage id={selected} avatar width="32" height="32"/></div><p className="fine">Check whether the lettering and symbol remain recognisable when small.</p><div className="button-row"><button className="btn primary" onClick={onComment}>Comment on this logo</button><button className="btn" onClick={()=>onTry('today')}>See in app</button><button className="btn" onClick={()=>onTry('website')}>See website</button><button className="btn" onClick={()=>onTry('posts')}>See Instagram preview</button></div></div></div><p className="fine">Selecting an option is a preview choice, not final approval. The original uploaded artwork is shown unchanged.</p></section>}
