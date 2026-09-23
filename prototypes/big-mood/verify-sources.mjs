import assert from 'node:assert/strict'
import {seed,summarize} from './src/data.js'
import {summarizeSources,normalizeSources,validateSource,reviewTheme} from './src/sources-model.js'
const sum=(d,k)=>summarizeSources(d).reduce((s,r)=>s+(r[k]||0),0)
assert.equal(sum(seed,'profit'),40)
assert.equal(sum(seed,'revenue'),54)
assert.equal(sum(seed,'sales'),1)
assert.equal(sum(seed,'unsold'),5)
const d=structuredClone(seed)
d.orders.push({items:['BM-001','BM-002'],status:'Paid',total:105.03,actualShipping:8.17,refund:7.13})
assert.ok(Math.abs(sum(d,'revenue')-summarize(d).revenue)<0.0001)
assert.ok(Math.abs(sum(d,'profit')-(summarize(d).profit+summarize(d).overhead))<0.0001)
d.orders[2].restocked=true
assert.ok(Math.abs(sum(d,'profit')-(summarize(d).profit+summarize(d).overhead))<0.0001)
d.items.find(i=>i.id==='BM-006').cost=null
assert.equal(summarizeSources(d).find(s=>s.id==='shop-a').profit,null)
assert.ok(validateSource(' PERSONAL wardrobe ',[]))
assert.ok(validateSource('neighbourhood thrift (sample)',seed.sources))
const old=structuredClone(seed);delete old.sources;old.items.forEach(i=>delete i.sourcedFrom)
assert.equal(normalizeSources(old).items[0].sourcedFrom,'unknown')
assert.equal(normalizeSources(old).items[4].sourcedFrom,'personal')
assert.equal(reviewTheme({theme:'studio'}),'club')
assert.equal(reviewTheme({theme:'studio',reviewRevision:2}),'studio')
console.log('Source comparison checks passed: payment, bundles, refunds, returns, unknown costs, migration, duplicate sources, theme migration.')
