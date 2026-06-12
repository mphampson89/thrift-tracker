import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Label, Money, StatusPill, CircleBtn, Field, DollarInput, TextInput, TextArea, SelectRow,
} from '../lib/ui'
import { PALETTE, PLATFORMS } from '../lib/theme'
import { formatShortDate } from '../lib/format'
import StatusTimeline from '../components/StatusTimeline'
import SoldCelebrate from '../components/SoldCelebrate'
import CompsPanel from '../components/CompsPanel'

function StatCell({ label, value, accent }) {
  return (
    <div style={{
      textAlign: 'center',
      borderRight: `1px solid ${PALETTE.hairline2}`,
      padding: '0 4px',
    }}>
      <Label size={9.5}>{label}</Label>
      <div style={{ marginTop: 4 }}>
        {value == null || value === '' || isNaN(parseFloat(value))
          ? <span style={{ color: PALETTE.ink3, fontSize: 16, fontWeight: 600 }}>—</span>
          : <Money value={parseFloat(value)} size={accent ? 18 : 16} weight={700}
              color={accent ? PALETTE.blush700 : PALETTE.ink}/>}
      </div>
    </div>
  )
}

export default function EditItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [celebrate, setCelebrate] = useState(null)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [listing, setListing] = useState('')
  const [soldPrice, setSoldPrice] = useState('')
  const [status, setStatus] = useState('unsold')
  const [platform, setPlatform] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase.from('items').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setItem(data)
        setName(data.name || '')
        setCost(data.cost?.toString() || '')
        setListing(data.listing_price?.toString() || '')
        setSoldPrice(data.sold_price?.toString() || '')
        setStatus(data.status || 'unsold')
        setPlatform(data.listed_on || '')
        setNotes(data.notes || '')
      }
      setLoading(false)
    })
  }, [id])

  async function persist(patch) {
    await supabase.from('items').update(patch).eq('id', id)
  }

  async function handleSave() {
    if (!name || !cost) return alert('Please add a name and what you paid.')
    setSaving(true)
    try {
      await persist({
        name,
        cost: parseFloat(cost),
        listing_price: listing ? parseFloat(listing) : null,
        sold_price: soldPrice ? parseFloat(soldPrice) : null,
        status,
        listed_on: platform || null,
        notes: notes || null,
      })
      navigate('/inventory')
    } catch (err) {
      console.error(err)
      alert('Error saving.')
      setSaving(false)
    }
  }

  async function handleMarkSold() {
    const fallback = parseFloat(listing) || parseFloat(item?.ai_suggested_price) || 0
    const price = parseFloat(soldPrice) || fallback
    const profit = price - (parseFloat(cost) || 0)
    setCelebrate({ profit })
    await persist({ status: 'sold', sold_price: price, listed_on: platform || null })
    setStatus('sold')
    setSoldPrice(String(price))
    setTimeout(() => {
      setCelebrate(null)
      navigate('/inventory')
    }, 2400)
  }

  async function handleDelete() {
    if (!confirm('Delete this item? This cannot be undone.')) return
    setSaving(true)
    try {
      if (item.photo_url) {
        const path = item.photo_url.split('/').pop()
        await supabase.storage.from('item-photos').remove([path])
      }
      await supabase.from('items').delete().eq('id', id)
      navigate('/inventory')
    } catch (err) {
      console.error(err)
      alert('Error deleting.')
      setSaving(false)
    }
  }

  if (loading) return <p style={{ textAlign: 'center', padding: 48, color: PALETTE.ink3 }}>Loading…</p>
  if (!item) return <p style={{ textAlign: 'center', padding: 48, color: PALETTE.ink3 }}>Item not found.</p>

  const profit = (status === 'sold' && soldPrice && cost)
    ? parseFloat(soldPrice) - parseFloat(cost)
    : null

  return (
    <div>
      <div style={{ position: 'relative', aspectRatio: '4 / 4.2', background: '#f1dfe1' }}>
        {item.photo_url && (
          <img src={item.photo_url} alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        )}
        <div style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <CircleBtn onClick={() => navigate(-1)} ariaLabel="Back">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M10 2L4 8l6 6" stroke={PALETTE.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </CircleBtn>
          <CircleBtn onClick={handleDelete} ariaLabel="Delete">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke={PALETTE.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h14M8 6V4a2 2 0 014 0v2M5 6l1 11h8l1-11"/>
            </svg>
          </CircleBtn>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill status={status} size="lg"/>
          <span style={{ fontSize: 11.5, color: PALETTE.ink3, letterSpacing: 0.3 }}>
            Logged {formatShortDate(item.created_at)}
          </span>
        </div>
        <h1 style={{
          margin: '10px 0 4px',
          fontSize: 26,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          letterSpacing: -0.6,
          lineHeight: 1.1,
          color: PALETTE.ink,
        }}>{name || 'Unnamed item'}</h1>

        <div style={{
          marginTop: 16,
          padding: '14px 0',
          borderRadius: 16,
          background: PALETTE.card,
          border: `1px solid ${PALETTE.hairline}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          <StatCell label="Paid" value={cost}/>
          <StatCell label="Listed" value={listing}/>
          <StatCell label="Sold" value={soldPrice}/>
          <StatCell label="Profit" value={profit} accent={profit != null}/>
        </div>

        <StatusTimeline status={status} dateAdded={item.created_at} soldDate={status === 'sold' ? item.created_at : null}/>

        <div style={{ marginTop: 18 }}>
          <Field label="Item">
            <TextInput value={name} onChange={setName}/>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Paid">
              <DollarInput value={cost} onChange={setCost}/>
            </Field>
            <Field label="Listing">
              <DollarInput value={listing} onChange={setListing}/>
            </Field>
          </div>
          {(status === 'listed' || status === 'sold') && (
            <Field label="Platform">
              <SelectRow value={platform} onChange={setPlatform} options={PLATFORMS}/>
            </Field>
          )}
          {status === 'sold' && (
            <Field label="Sold for">
              <DollarInput value={soldPrice} onChange={setSoldPrice}/>
            </Field>
          )}
          <Field label="Notes">
            <TextArea value={notes} onChange={setNotes} placeholder="Condition, provenance, buyer notes…"/>
          </Field>
        </div>

        <CompsPanel searchQuery={item.search_query ?? name} style={{ margin: '14px 0 0' }} />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            all: 'unset',
            cursor: 'pointer',
            marginTop: 8,
            width: '100%',
            boxSizing: 'border-box',
            padding: '13px 18px',
            borderRadius: 14,
            background: PALETTE.card,
            color: PALETTE.ink,
            border: `1px solid ${PALETTE.hairline}`,
            fontWeight: 600,
            fontSize: 14,
            textAlign: 'center',
            opacity: saving ? 0.5 : 1,
          }}
        >Save changes</button>

        {status !== 'sold' && (
          <button
            type="button"
            onClick={handleMarkSold}
            style={{
              all: 'unset',
              cursor: 'pointer',
              marginTop: 10,
              width: '100%',
              boxSizing: 'border-box',
              padding: '15px 18px',
              borderRadius: 14,
              background: PALETTE.blush700,
              color: PALETTE.blush50,
              fontWeight: 700,
              fontSize: 15,
              textAlign: 'center',
              letterSpacing: -0.1,
              boxShadow: '0 6px 18px rgba(194,90,120,0.25)',
            }}
          >Mark as sold</button>
        )}
      </div>

      {celebrate && <SoldCelebrate profit={celebrate.profit}/>}
    </div>
  )
}
