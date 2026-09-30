import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Copy, Heart, ImagePlus, Link2, LoaderCircle, Plus, Sparkles, Trash2 } from 'lucide-react'

const newMoment = () => ({ description: '', image: '' })
const newJourney = () => ({ recipient: '', memories: Array.from({ length: 3 }, () => ({ title: '', moments: [newMoment()] })) })
const chapters = ['Awal cerita', 'Di tengah perjalanan', 'Yang selalu tinggal']

function getDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem('memory-journey-draft'))
    if (draft?.memories?.length === 3) return draft
  } catch { /* Browser storage can be unavailable. */ }
  return newJourney()
}

async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Pilih file gambar yang valid.')
  if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran foto maksimal 8 MB.')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  context.fillStyle = '#f1e9df'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.72)
}

function validate(journey) {
  if (!journey.recipient.trim()) return 'Isi nama orang yang akan menerima cerita ini.'
  for (let i = 0; i < 3; i += 1) {
    const memory = journey.memories[i]
    if (!memory.title.trim()) return `Isi judul memori ${i + 1}.`
    for (let j = 0; j < memory.moments.length; j += 1) {
      if (!memory.moments[j].description.trim()) return `Isi cerita ${j + 1} pada memori ${i + 1}.`
      if (!memory.moments[j].image) return `Tambahkan foto ${j + 1} pada memori ${i + 1}.`
    }
  }
  return ''
}

function Brand() {
  return <a className="brand" href="/" aria-label="Memory Journey"><span className="brand-mark">✳</span><span>memory<span className="brand-light">journey</span></span></a>
}

function Header() {
  return <header className="site-header shell"><Brand /><span className="header-note">A little place for the moments that matter</span><span className="header-heart"><Heart size={17} /></span></header>
}

function PhotoInput({ image, onChange, label }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(''); setBusy(true)
    try { onChange(await compressImage(file)) }
    catch (caught) { setError(caught.message || 'Foto tidak dapat dibaca.') }
    finally { setBusy(false); event.target.value = '' }
  }
  return <div className="photo-control"><label className={`photo-drop ${image ? 'has-photo' : ''}`}>
    {image ? <img src={image} alt={label} /> : <><ImagePlus size={26} strokeWidth={1.5} /><span>{busy ? 'Menyiapkan foto...' : 'Tambahkan foto'}</span><small>JPG, PNG, atau WebP · maks. 8 MB</small></>}
    <input type="file" accept="image/*" onChange={handleFile} disabled={busy} aria-label={label} />
    {image && <span className="photo-overlay">Ganti foto</span>}
  </label>{image && <button className="photo-remove" type="button" onClick={() => onChange('')}><Trash2 size={14} /> Hapus foto</button>}{error && <p className="field-error" role="alert">{error}</p>}</div>
}

function Editor({ journey, setJourney, onPreview }) {
  const [active, setActive] = useState(0)
  const [error, setError] = useState('')
  const memory = journey.memories[active]
  function updateMemory(patch) {
    setJourney(previous => ({ ...previous, memories: previous.memories.map((item, i) => i === active ? { ...item, ...patch } : item) }))
  }
  function updateMoment(index, patch) {
    updateMemory({ moments: memory.moments.map((item, i) => i === index ? { ...item, ...patch } : item) })
  }
  function preview() {
    const issue = validate(journey)
    if (issue) {
      const memoryNumber = issue.match(/memori (\d)/)?.[1]
      if (memoryNumber) setActive(Number(memoryNumber) - 1)
      setError(issue)
      return
    }
    setError(''); onPreview()
  }
  return <main className="editor-page"><div className="ambient ambient-one" /><div className="ambient ambient-two" /><Header />
    <section className="intro shell"><div className="eyebrow"><span className="eyebrow-line" /> SEBUAH HADIAH DARI HATI <span className="eyebrow-line" /></div><h1>Setiap kenangan<br /><em>punya ceritanya.</em></h1><p>Rangkai momen-momen kecil menjadi perjalanan yang akan selalu diingat oleh seseorang yang berarti bagimu.</p><div className="intro-decoration" aria-hidden="true">✦ <span>✧</span> ✦</div></section>
    <section className="workbench shell" aria-label="Buat cerita kenangan">
      <div className="workbench-head"><div><span className="section-kicker">01 / TULIS CERITAMU</span><h2>Mulai dari sebuah nama</h2><p>Siapa orang istimewa yang akan menerima perjalanan ini?</p></div><div className="step-pill"><span>1</span> dari 3 langkah</div></div>
      <div className="recipient-field"><label htmlFor="recipient">NAMA PENERIMA</label><div className="recipient-input"><Heart size={20} /><input id="recipient" maxLength={80} placeholder="Tuliskan nama orang tersayang..." value={journey.recipient} onChange={event => setJourney(previous => ({ ...previous, recipient: event.target.value }))} /></div><small>Namanya akan muncul di awal kisah spesial ini.</small></div>
      <div className="chapter-heading"><div><span className="section-kicker">02 / RANGKAI MOMEN</span><h2>Tiga bab tentang kalian</h2></div><p>Pilih tiga kenangan yang paling ingin kamu ceritakan.</p></div>
      <div className="chapter-tabs" role="tablist" aria-label="Pilih memori">{journey.memories.map((item, index) => <button type="button" role="tab" aria-selected={active === index} className={`chapter-tab ${active === index ? 'selected' : ''}`} key={index} onClick={() => { setActive(index); setError('') }}><span className="tab-number">0{index + 1}</span><span><strong>Memori {index + 1}</strong><small>{item.title || chapters[index]}</small></span></button>)}</div>
      <div className="memory-editor" role="tabpanel"><div className="memory-editor-top"><div><span className="section-kicker">BAB 0{active + 1}</span><h3>{chapters[active]}</h3></div><span className="moment-count">{memory.moments.length} / 3 momen</span></div>
        <label className="field-label" htmlFor="memory-title">JUDUL MEMORI</label><input id="memory-title" className="text-input" maxLength={100} placeholder="Contoh: Pertemuan yang tak terduga" value={memory.title} onChange={event => updateMemory({ title: event.target.value })} />
        <div className="moments-list">{memory.moments.map((moment, index) => <div className="moment-editor" key={index}><div className="moment-top"><span><span className="moment-spark">✦</span> MOMEN 0{index + 1}</span>{memory.moments.length > 1 && <button type="button" className="text-action" onClick={() => updateMemory({ moments: memory.moments.filter((_, i) => i !== index) })}><Trash2 size={14} /> Hapus momen</button>}</div><div className="moment-grid"><PhotoInput label={`Foto momen ${index + 1} memori ${active + 1}`} image={moment.image} onChange={image => updateMoment(index, { image })} /><div><label className="field-label" htmlFor={`description-${active}-${index}`}>CERITA DI BALIK FOTO</label><textarea id={`description-${active}-${index}`} className="text-input" rows="5" maxLength={1200} placeholder="Ceritakan bagaimana momen ini terjadi, apa yang kamu rasakan, dan mengapa ia begitu berarti..." value={moment.description} onChange={event => updateMoment(index, { description: event.target.value })} /><small className="char-count">{moment.description.length} / 1200</small></div></div></div>)}</div>
        {memory.moments.length < 3 && <button type="button" className="add-moment" onClick={() => updateMemory({ moments: [...memory.moments, newMoment()] })}><Plus size={18} /> Tambah foto & cerita <span>hingga 3 momen per memori</span></button>}
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="editor-footer"><div className="privacy-note"><Sparkles size={18} /><span>Ceritamu disimpan sebagai halaman pribadi yang dapat dibuka melalui tautan.</span></div><button type="button" className="primary-button" onClick={preview}>Lihat perjalanan kita <ArrowRight size={17} /></button></div>
    </section><footer className="editor-bottom">Dibuat untuk hal-hal kecil yang terasa begitu besar. <Heart size={13} fill="currentColor" /></footer>
  </main>
}

function Story({ journey, onFinish, onBack, shared = false }) {
  const reduceMotion = useReducedMotion()
  const [chapter, setChapter] = useState(-1)
  const [moment, setMoment] = useState(0)
  const atEnd = chapter === 3
  const currentMemory = chapter >= 0 && chapter < 3 ? journey.memories[chapter] : null
  const currentMoment = currentMemory?.moments[moment]
  function next() {
    if (chapter < 0) setChapter(0)
    else if (chapter < 3 && moment < journey.memories[chapter].moments.length - 1) setMoment(moment + 1)
    else { setChapter(chapter + 1); setMoment(0) }
  }
  function previous() {
    if (atEnd) { setChapter(2); setMoment(journey.memories[2].moments.length - 1) }
    else if (moment > 0) setMoment(moment - 1)
    else if (chapter > 0) { setChapter(chapter - 1); setMoment(journey.memories[chapter - 1].moments.length - 1) }
    else if (chapter === 0) setChapter(-1)
    else onBack?.()
  }
  const total = journey.memories.reduce((sum, item) => sum + item.moments.length, 0)
  const progress = chapter < 0 ? 0 : atEnd ? 100 : ((journey.memories.slice(0, chapter).reduce((sum, item) => sum + item.moments.length, 0) + moment + 1) / total) * 100
  return <main className="story-page"><div className="story-grain" /><header className="story-header"><Brand /><span className="story-header-center">SEBUAH CERITA UNTUK {journey.recipient.toUpperCase()}</span><button type="button" className="story-close" onClick={onBack || (() => window.location.assign('/'))}>{shared ? 'Buat ceritamu' : 'Kembali'}</button></header><div className="story-progress"><span style={{ width: `${progress}%` }} /></div>
    <AnimatePresence mode="wait"><motion.div key={`${chapter}-${moment}`} className="story-stage" initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -20 }} transition={{ duration: reduceMotion ? .2 : .65, ease: 'easeOut' }}>
      {chapter < 0 && <div className="story-opening"><div className="story-sun">✦</div><p className="story-overline">UNTUK SESEORANG YANG BERARTI</p><h1>Hai, <em>{journey.recipient}.</em></h1><p>Ada beberapa kenangan yang ingin kusimpan lebih lama. Dan semuanya selalu membawaku kembali kepadamu.</p><span className="opening-small">Ini cerita kecil tentang kita.</span></div>}
      {currentMemory && <div className="story-chapter"><div className="story-photo-frame"><img src={currentMoment.image} alt={`${currentMemory.title}, momen ${moment + 1}`} /><div className="photo-shade" /></div><div className="story-copy"><span className="story-overline">BAB 0{chapter + 1} <span>·</span> {chapters[chapter].toUpperCase()}</span><h1>{currentMemory.title}</h1><div className="story-divider"><span>✦</span></div><p>{currentMoment.description}</p><div className="story-moment-indicator">MOMEN {moment + 1} DARI {currentMemory.moments.length}</div></div></div>}
      {atEnd && <div className="story-ending"><div className="ending-hearts">♥ <span>♥</span> ♥</div><p className="story-overline">DAN CERITANYA MASIH BERLANJUT</p><h1>Terima kasih sudah menjadi<br /><em>bagian dari ceritaku.</em></h1><p>Semoga perjalanan kecil ini mengingatkanmu betapa berharganya setiap momen yang kita punya.</p><div className="ending-sign">Untukmu, {journey.recipient} <Heart size={17} fill="currentColor" /></div></div>}
    </motion.div></AnimatePresence>
    <nav className="story-nav" aria-label="Navigasi cerita"><button type="button" className="nav-back" onClick={previous}><ArrowLeft size={17} /> Sebelumnya</button><div className="story-dots">{journey.memories.map((_, i) => <span key={i} className={chapter === i ? 'active' : ''} />)}</div>{atEnd ? <button type="button" className="nav-next" onClick={onFinish || (() => window.location.assign('/'))}>{shared ? 'Buat ceritamu' : 'Lihat ringkasan'} <ArrowRight size={17} /></button> : <button type="button" className="nav-next" onClick={next}>{chapter < 0 ? 'Mulai cerita' : 'Lanjutkan'} <ArrowRight size={17} /></button>}</nav>
  </main>
}

function Summary({ journey, onEdit, onReplay }) {
  const [shareUrl, setShareUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const photos = journey.memories.flatMap(memory => memory.moments.map(moment => moment.image))
  async function createLink() {
    if (shareUrl) return shareUrl
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/journeys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(journey) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Cerita belum berhasil disimpan.')
      const url = `${window.location.origin}/j/${result.id}`
      setShareUrl(url)
      return url
    } catch (caught) { setError(caught.message || 'Gagal membuat tautan. Coba lagi.'); return '' }
    finally { setBusy(false) }
  }
  async function copyLink() {
    const url = await createLink()
    if (!url) return
    try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2500) }
    catch { setError('Salin tautan yang muncul di bawah secara manual.') }
  }
  return <main className="summary-page"><Header /><div className="summary-shell shell"><div className="summary-heading"><span className="eyebrow"><span className="eyebrow-line" /> CERITAMU SUDAH SIAP <span className="eyebrow-line" /></span><h1>Sebuah perjalanan<br /><em>untuk {journey.recipient}.</em></h1><p>Tiga bab. {photos.length} momen. Satu cerita yang layak dikenang.</p></div><div className="summary-layout"><div className="summary-card"><div className="summary-card-label">SEBUAH CERITA UNTUK <strong>{journey.recipient.toUpperCase()}</strong></div><div className="summary-collage">{photos.slice(0, 3).map((photo, index) => <img src={photo} alt={`Kenangan ${index + 1}`} key={index} />)}</div><div className="summary-chapters">{journey.memories.map((memory, index) => <div key={index}><span>0{index + 1}</span><strong>{memory.title}</strong><small>{memory.moments.length} momen</small></div>)}</div></div><div className="summary-actions"><div className="summary-icon"><Heart size={23} fill="currentColor" /></div><h2>Siap membuat mereka tersenyum?</h2><p>Lihat kembali ceritamu, lalu bagikan tautannya kepada seseorang yang paling berarti.</p><button className="primary-button full" type="button" onClick={copyLink} disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : copied ? <Check size={18} /> : <Link2 size={18} />}{busy ? 'Menyimpan cerita...' : copied ? 'Tautan tersalin!' : 'Buat & salin tautan'}</button>{shareUrl && <div className="share-result"><label htmlFor="share-url">TAUTAN CERITAMU</label><div><input id="share-url" value={shareUrl} readOnly onFocus={event => event.target.select()} /><button type="button" onClick={copyLink} aria-label="Salin tautan"><Copy size={16} /></button></div></div>}{error && <p className="form-error" role="alert">{error}</p>}<div className="summary-secondary"><button type="button" onClick={onReplay}>Putar lagi <ArrowRight size={15} /></button><button type="button" onClick={onEdit}>Ubah cerita</button></div><small className="summary-fineprint">Siapa pun yang memiliki tautan dapat melihat cerita dan fotonya.</small></div></div></div></main>
}

export default function App() {
  const sharedId = window.location.pathname.match(/^\/j\/([a-f0-9-]{36})\/?$/)?.[1]
  const [journey, setJourney] = useState(getDraft)
  const [screen, setScreen] = useState(sharedId ? 'loading' : 'editor')
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    if (!sharedId) return
    fetch(`/api/journeys/${sharedId}`).then(async response => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Cerita tidak ditemukan.')
      setJourney(result); setScreen('shared')
    }).catch(caught => { setLoadError(caught.message); setScreen('error') })
  }, [sharedId])
  useEffect(() => {
    if (sharedId) return
    try { localStorage.setItem('memory-journey-draft', JSON.stringify(journey)) } catch { /* Photo drafts can exceed browser storage. */ }
  }, [journey, sharedId])
  if (screen === 'loading' || screen === 'error') return <main className="status-page"><span className="brand-mark">✳</span><h1>{screen === 'loading' ? 'Membuka ceritamu...' : 'Cerita belum ditemukan'}</h1><p>{screen === 'error' ? loadError : 'Sebentar, kenangan indah sedang disiapkan.'}</p><a className="primary-button" href="/">Buat cerita baru <ArrowRight size={16} /></a></main>
  if (screen === 'shared') return <Story journey={journey} shared />
  if (screen === 'preview') return <Story journey={journey} onBack={() => setScreen('editor')} onFinish={() => setScreen('summary')} />
  if (screen === 'summary') return <Summary journey={journey} onEdit={() => setScreen('editor')} onReplay={() => setScreen('preview')} />
  return <Editor journey={journey} setJourney={setJourney} onPreview={() => setScreen('preview')} />
}
