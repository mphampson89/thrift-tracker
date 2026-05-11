import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Label, Field, DollarInput, TextInput, TextArea, SelectRow, PALETTE, PLATFORMS,
} from '../lib/ui'
import AIPanel from '../components/AIPanel'
import IdentifyingOverlay from '../components/IdentifyingOverlay'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

const STEPS = { PHOTO: 'photo', IDENTIFYING: 'identifying', RESULT: 'result', FORM: 'form' }

export default function AddItem() {
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.PHOTO)
  const [photo, setPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [context, setContext] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [listing, setListing] = useState('')
  const [platform, setPlatform] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('unsold')

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhoto(URL.createObjectURL(file))
  }

  async function runIdentify() {
    if (!photoFile) return
    setStep(STEPS.IDENTIFYING)
    try {
      const base64 = await fileToBase64(photoFile)
      const res = await fetch('/.netlify/functions/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType: photoFile.type, context }),
      })
      const data = await res.json()
      setAiResult(data)
      setName(data.name || '')
      const suggested = data.priceLow && data.priceHigh
        ? Math.round((data.priceLow + data.priceHigh) / 2)
        : data.suggestedPrice
      if (suggested) setListing(String(suggested))
      if (context && !notes) setNotes(context)
      setStep(STEPS.RESULT)
    } catch (err) {
      console.error(err)
      alert('Could not identify the photo. You can still fill in details manually.')
      setStep(STEPS.RESULT)
    }
  }

  async function handleSave() {
    if (!name || !cost) return alert('Please add a name and what you paid.')
    setSaving(true)
    try {
      let photoUrl = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        await supabase.storage.from('item-photos').upload(path, photoFile)
        const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }
      const suggestedAvg = aiResult?.priceLow && aiResult?.priceHigh
        ? (aiResult.priceLow + aiResult.priceHigh) / 2
        : aiResult?.suggestedPrice
      await supabase.from('items').insert({
        name,
        cost: parseFloat(cost),
        listing_price: listing ? parseFloat(listing) : null,
        ai_suggested_price: suggestedAvg ? parseFloat(suggestedAvg) : null,
        status,
        listed_on: platform || null,
        notes: notes || null,
        photo_url: photoUrl,
        search_query: aiResult?.searchQuery ?? null,
      })
      navigate('/inventory')
    } catch (err) {
      console.error(err)
      alert('Error saving item.')
      setSaving(false)
    }
  }

  const canSave = step === STEPS.RESULT || step === STEPS.FORM
  const showInputStep = step === STEPS.PHOTO || step === STEPS.IDENTIFYING

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px 8px',
      }}>
        <button
          type="button"
          onClick={() => navigate('/inventory')}
          style={{ all: 'unset', cursor: 'pointer', fontSize: 14, color: PALETTE.ink2, fontWeight: 500 }}
        >Cancel</button>
        <Label>New find</Label>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            all: 'unset',
            cursor: canSave && !saving ? 'pointer' : 'default',
            fontSize: 14,
            fontWeight: 700,
            color: canSave && !saving ? PALETTE.blush700 : PALETTE.ink3,
          }}
        >{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div style={{ padding: '6px 18px 0' }}>
        <label style={{ display: 'block', cursor: 'pointer' }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
          <div style={{
            aspectRatio: '4 / 3',
            borderRadius: 22,
            overflow: 'hidden',
            position: 'relative',
            background: !photo ? PALETTE.blush50 : '#f1dfe1',
            border: !photo ? `1.5px dashed ${PALETTE.blush300}` : 'none',
          }}>
            {photo ? (
              <img src={photo} alt="Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) : (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: PALETTE.blush700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 18px rgba(194,90,120,0.3)',
                }}>
                  <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
                    <path d="M3 5h4l2-3h8l2 3h4a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z" stroke={PALETTE.blush50} strokeWidth="1.6"/>
                    <circle cx="13" cy="12" r="4" stroke={PALETTE.blush50} strokeWidth="1.6"/>
                  </svg>
                </div>
                <div style={{ fontSize: 14.5, color: PALETTE.ink, fontWeight: 600 }}>Take a photo</div>
                <div style={{ fontSize: 12, color: PALETTE.ink3 }}>or upload from your library</div>
              </div>
            )}
            {step === STEPS.IDENTIFYING && <IdentifyingOverlay/>}
          </div>
        </label>
      </div>

      {showInputStep && (
        <div style={{ padding: '14px 18px 0' }}>
          <Field label="Notes for the AI (optional)">
            <TextArea
              value={context}
              onChange={setContext}
              placeholder="Brand, condition, hidden damage, year, anything you can see that the camera can't…"
            />
          </Field>
          <button
            type="button"
            onClick={runIdentify}
            disabled={!photoFile || step === STEPS.IDENTIFYING}
            style={{
              all: 'unset',
              cursor: photoFile && step !== STEPS.IDENTIFYING ? 'pointer' : 'default',
              marginTop: 4,
              padding: '14px 16px',
              width: '100%',
              boxSizing: 'border-box',
              background: photoFile ? PALETTE.blush700 : PALETTE.warmStone,
              color: photoFile ? PALETTE.blush50 : PALETTE.ink3,
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14.5,
              textAlign: 'center',
              letterSpacing: -0.1,
              boxShadow: photoFile ? '0 6px 18px rgba(194,90,120,0.25)' : 'none',
              transition: 'all 0.2s ease',
              opacity: step === STEPS.IDENTIFYING ? 0.6 : 1,
            }}
          >
            {step === STEPS.IDENTIFYING ? 'Identifying…' : '✨ Identify with AI'}
          </button>
        </div>
      )}

      {(step === STEPS.RESULT || step === STEPS.FORM) && aiResult && (
        <AIPanel
          result={aiResult}
          onAccept={() => setStep(STEPS.FORM)}
          accepted={step === STEPS.FORM}
        />
      )}

      {(step === STEPS.RESULT || step === STEPS.FORM) && (
        <div style={{ padding: '14px 18px 0' }}>
          <Field label="Item">
            <TextInput value={name} onChange={setName} placeholder="Vintage wool throw"/>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Paid">
              <DollarInput value={cost} onChange={setCost}/>
            </Field>
            <Field label="Listing">
              <DollarInput value={listing} onChange={setListing}/>
            </Field>
          </div>
          <Field label="Status">
            <SelectRow
              value={status}
              onChange={setStatus}
              options={['unsold', 'listed', 'sold']}
            />
          </Field>
          {(status === 'listed' || status === 'sold') && (
            <Field label="Platform">
              <SelectRow value={platform} onChange={setPlatform} options={PLATFORMS}/>
            </Field>
          )}
          <Field label="Notes">
            <TextArea value={notes} onChange={setNotes} placeholder="Condition, provenance, buyer notes…"/>
          </Field>
        </div>
      )}
    </div>
  )
}
