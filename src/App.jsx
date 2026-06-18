import React, { useState, useEffect, useRef, useCallback } from 'react'
import { fetchRecordsFromNotion, createRecordInNotion } from './notionApi.js'

const ASSESSORS = [
  { code: 'A73614', name: 'Bruno Bruel',           squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A26347', name: 'Guilherme Monticelli',  squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A38636', name: 'Hellen Carvalho',       squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A38548', name: 'Igor Bairros',          squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A96379', name: 'Leonardo Vacca',        squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A51532', name: 'Nicolas Mallmann',      squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A26305', name: 'Pedro Couto',           squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A27267', name: 'Rodrigo Lisboa',        squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A27321', name: 'Vitória Vidor',         squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A42881', name: 'Ygor Walter',           squad: 'Alavancados',        squadColor: '#1d4ed8', emoji: '🔵' },
  { code: 'A98897', name: 'Daniel Mendonça',       squad: 'Los Hermanos',       squadColor: '#a16207', emoji: '🟤' },
  { code: 'A73851', name: 'Eduardo Freitas',       squad: 'Los Hermanos',       squadColor: '#a16207', emoji: '🟤' },
  { code: 'A98943', name: 'Israel Gusso',          squad: 'Los Hermanos',       squadColor: '#a16207', emoji: '🟤' },
  { code: 'A97096', name: 'Júlia Mendonça',        squad: 'Los Hermanos',       squadColor: '#a16207', emoji: '🟤' },
  { code: 'A39869', name: 'Fernando Parisotto',    squad: 'Advisors',           squadColor: '#7c3aed', emoji: '🟣' },
  { code: 'A20680', name: 'Francisco Dall Agnol',  squad: 'Advisors',           squadColor: '#7c3aed', emoji: '🟣' },
  { code: 'A50655', name: 'Paulo Bortolini',       squad: 'Advisors',           squadColor: '#7c3aed', emoji: '🟣' },
  { code: 'A1998',  name: 'Icaro Piacini',         squad: 'Outliers',           squadColor: '#c2410c', emoji: '🟠' },
  { code: 'A42105', name: 'Joceane Lenhart',       squad: 'Outliers',           squadColor: '#c2410c', emoji: '🟠' },
  { code: 'A59147', name: 'Lucas Bach',            squad: 'Outliers',           squadColor: '#c2410c', emoji: '🟠' },
  { code: 'A47707', name: 'Mateus Brandão',        squad: 'Outliers',           squadColor: '#c2410c', emoji: '🟠' },
  { code: 'A56902', name: 'Daniel Mastalir',       squad: 'Anywhere',           squadColor: '#065f46', emoji: '🟢' },
  { code: 'A56903', name: 'Leonardo Dutra',        squad: 'Anywhere',           squadColor: '#065f46', emoji: '🟢' },
  { code: 'A54287', name: 'Bruno Giacomuzzi',      squad: 'Áreas Operacionais', squadColor: '#6b7280', emoji: '⚙️' },
  { code: 'A22616', name: 'Enzo Hejazi',           squad: 'Áreas Operacionais', squadColor: '#6b7280', emoji: '⚙️' },
  { code: 'A61852', name: 'Gabriel Berté',         squad: 'Áreas Operacionais', squadColor: '#6b7280', emoji: '⚙️' },
  { code: 'A22038', name: 'José Colling',          squad: 'Áreas Operacionais', squadColor: '#6b7280', emoji: '⚙️' },
  { code: 'A20557', name: 'Milena Portela',        squad: 'Áreas Operacionais', squadColor: '#6b7280', emoji: '⚙️' },
  { code: 'A33788', name: 'Nicolas Gotz',          squad: 'Áreas Operacionais', squadColor: '#6b7280', emoji: '⚙️' },
]

const POINTS  = { R1: 30, R2: 50, Venda: 100 }
const META    = { R1: 4,  R2: 4,  Venda: 2 }
const PREMIO  = { bronze: 150, prata: 300, ouro: 500 }
const REFRESH = 5

// Normaliza registros Notion para o formato interno
function normalizeNotionRecords(raw) {
  return raw.map(r => {
    const found = ASSESSORS.find(
      a => a.name.toLowerCase().trim() === r.name.toLowerCase().trim()
    )
    return found ? { ...r, code: found.code, squad: found.squad } : r
  }).filter(r => ASSESSORS.find(a => a.code === r.code))
}

function computeRanking(records) {
  const map = {}
  ASSESSORS.forEach(a => { map[a.code] = { ...a, R1: 0, R2: 0, Venda: 0, pts: 0 } })
  records.forEach(r => {
    if (map[r.code]) { map[r.code][r.type]++; map[r.code].pts += POINTS[r.type] }
  })
  return Object.values(map).sort((a, b) => b.pts - a.pts || b.Venda - a.Venda || b.R2 - a.R2)
}

function getPremio(a) {
  if (a.R1 >= 4 && a.R2 >= 4 && a.Venda >= 2) return { label: '🥇 Ouro',   color: '#d4af37', val: PREMIO.ouro }
  if (a.R1 >= 4 && a.R2 >= 4)                  return { label: '🥈 Prata',  color: '#c0c0c0', val: PREMIO.prata }
  if (a.R1 >= 4)                                return { label: '🥉 Bronze', color: '#cd7f32', val: PREMIO.bronze }
  return null
}

function burst(canvas, big) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const count = big ? 200 : 80
  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: big ? Math.random() * canvas.height * 0.3 : canvas.height * 0.5,
    r: Math.random() * 7 + 3, g: Math.random() * 5 + 3,
    color: ['#d4af37','#fff','#10b981','#3b82f6','#f59e0b','#ec4899'][Math.floor(Math.random() * 6)],
    rot: Math.random() * 360, rs: (Math.random() - 0.5) * 8, vx: (Math.random() - 0.5) * 6,
  }))
  let raf
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
      ctx.fillStyle = p.color; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore()
      p.y += p.g; p.x += p.vx; p.rot += p.rs
    })
    if (pieces.some(p => p.y < canvas.height + 50)) raf = requestAnimationFrame(draw)
    else ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  draw()
  return () => cancelAnimationFrame(raf)
}

function MeteorBg() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    const meteors = Array.from({ length: 16 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      len: 60 + Math.random() * 120, spd: 0.8 + Math.random() * 1.5,
      op: 0.1 + Math.random() * 0.25, w: 1 + Math.random() * 1.5,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      meteors.forEach(m => {
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len)
        g.addColorStop(0, `rgba(212,175,55,${m.op})`); g.addColorStop(1, 'rgba(212,175,55,0)')
        ctx.strokeStyle = g; ctx.lineWidth = m.w
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len); ctx.stroke()
        m.x += m.spd; m.y += m.spd
        if (m.x > c.width + 120 || m.y > c.height + 120) { m.x = Math.random() * c.width - 100; m.y = -60 }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

function LiveBadge({ countdown, onRefresh, loading }) {
  const pct = ((REFRESH - countdown) / REFRESH) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#10b98118', border: '1px solid #10b98144', borderRadius: 20, padding: '4px 10px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'livePulse 1.2s ease-in-out infinite' }} />
        <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>AO VIVO · NOTION</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52 }}>
        <span style={{ color: '#555', fontSize: 10 }}>atualiza em</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 36, height: 4, background: '#ffffff0f', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#d4af37', borderRadius: 4, transition: 'width 1s linear' }} />
          </div>
          <span style={{ color: '#d4af37', fontSize: 11, fontWeight: 700, minWidth: 20 }}>{countdown}s</span>
        </div>
      </div>
      <button onClick={onRefresh} disabled={loading}
        style={{ background: loading ? '#ffffff06' : '#ffffff0f', border: '1px solid #ffffff18', borderRadius: 8, color: loading ? '#444' : '#888', fontSize: 13, padding: '4px 10px', cursor: loading ? 'default' : 'pointer' }}>
        {loading ? '⏳' : '↻'}
      </button>
    </div>
  )
}

function Avatar({ name, size = 56, border = '#444', glow = false }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['#1d4ed8','#7c3aed','#c2410c','#065f46','#a16207','#0e7490']
  const bg = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      border: `3px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
      boxShadow: glow ? `0 0 18px ${border}88, 0 0 36px ${border}44` : 'none',
    }}>{initials}</div>
  )
}

function ProgBar({ val, max, color }) {
  const pct = Math.min(100, (val / max) * 100)
  return (
    <div style={{ background: '#ffffff18', borderRadius: 4, height: 6, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function Toast({ msg, ok }) {
  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: ok ? '#10b981' : '#ef4444', color: '#fff', padding: '12px 28px',
      borderRadius: 12, fontWeight: 600, fontSize: 15, zIndex: 9999, boxShadow: '0 8px 32px #0008',
    }}>{msg}</div>
  )
}

const S = {
  page:     { minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card:     { background: '#111', border: '1px solid #1f1f1f', borderRadius: 16, padding: 24 },
  label:    { display: 'block', color: '#888', fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  input:    { width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none' },
  dropdown: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  dropItem: { display: 'flex', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s' },
  btn:      { width: '100%', padding: '14px', background: '#d4af37', border: 'none', borderRadius: 10, color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer', letterSpacing: 1 },
  btnSm:    { padding: '8px 14px', border: 'none', borderRadius: 8, color: '#ccc', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
}

// ── Hook: dados em tempo real do Notion ────────────────────────────────────────
function useNotionRealtime() {
  const [records, setRecords]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [countdown, setCountdown]   = useState(REFRESH)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const raw    = await fetchRecordsFromNotion()
      const normal = normalizeNotionRecords(raw)
      setRecords(normal)
      setLastUpdate(new Date())
      setCountdown(REFRESH)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), REFRESH * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const tick = setInterval(() => setCountdown(p => p <= 1 ? REFRESH : p - 1), 1000)
    return () => clearInterval(tick)
  }, [])

  const addOptimistic = useCallback(async (user, type) => {
    const temp = { code: user.code, name: user.name, squad: user.squad, type, ts: Date.now() }
    setRecords(prev => [...prev, temp])
    setCountdown(REFRESH)
    await createRecordInNotion({ user, type })
    setTimeout(() => fetchData(true), 2000)
  }, [fetchData])

  return { records, loading, error, countdown, lastUpdate, fetchData, addOptimistic }
}

// ─────────────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [q, setQ]     = useState('')
  const [sel, setSel] = useState(null)
  const [err, setErr] = useState('')
  const filtered = q.length >= 1
    ? ASSESSORS.filter(a =>
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.code.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 8)
    : []
  const pick = (a) => { setSel(a); setQ(a.name); setErr('') }
  const go   = () => { if (!sel) { setErr('Selecione um assessor da lista'); return } onLogin(sel) }
  return (
    <div style={S.page}>
      <MeteorBg />
      <div style={{ ...S.card, maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#d4af37', letterSpacing: 2, margin: 0 }}>INSURANCE DAY</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 6, letterSpacing: 1 }}>CAMPANHA 4-4-2 · JUNHO & JULHO 2026</p>
        </div>
        <label style={S.label}>Seu código XP ou nome</label>
        <input style={S.input} placeholder="Ex: A98943 ou Israel Gusso"
          value={q} onChange={e => { setQ(e.target.value); setSel(null) }}
          onKeyDown={e => e.key === 'Enter' && go()} autoFocus />
        {filtered.length > 0 && (
          <div style={S.dropdown}>
            {filtered.map(a => (
              <div key={a.code} style={S.dropItem} onClick={() => pick(a)}
                onMouseEnter={e => e.currentTarget.style.background = '#ffffff18'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Avatar name={a.name} size={36} border={a.squadColor} />
                <div style={{ marginLeft: 12 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{a.code} · {a.emoji} {a.squad}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {sel && (
          <div style={{ ...S.card, background: '#ffffff0a', border: `1px solid ${sel.squadColor}44`, padding: 16, marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={sel.name} size={48} border={sel.squadColor} glow={true} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700 }}>{sel.name}</div>
              <div style={{ color: '#888', fontSize: 12 }}>{sel.code} · {sel.emoji} {sel.squad}</div>
            </div>
          </div>
        )}
        {err && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{err}</div>}
        <button style={{ ...S.btn, marginTop: 24 }} onClick={go}>Entrar no Insurance Day →</button>
      </div>
    </div>
  )
}

function RegisterScreen({ user, records, onAdd, onGoRanking, onLogout, saving }) {
  const [toast, setToast] = useState(null)
  const confRef = useRef(null)
  const myRecs  = records.filter(r => r.code === user.code)
  const myR1    = myRecs.filter(r => r.type === 'R1').length
  const myR2    = myRecs.filter(r => r.type === 'R2').length
  const myVenda = myRecs.filter(r => r.type === 'Venda').length
  const myPts   = myR1 * 30 + myR2 * 50 + myVenda * 100
  const premio  = getPremio({ R1: myR1, R2: myR2, Venda: myVenda })
  const showToast = (msg, ok) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500) }
  const register = async (type) => {
    try {
      await onAdd(user, type)
      if (confRef.current) burst(confRef.current, type === 'Venda')
      showToast('✅ ' + type + ' salvo no Notion!', true)
    } catch (e) {
      showToast('❌ Erro: ' + e.message, false)
    }
  }
  const btnTypes = [
    { type: 'R1',    label: 'R1',    sub: 'Reunião Agendada',  pts: '+30 pts',  color: '#3b82f6', icon: '📅' },
    { type: 'R2',    label: 'R2',    sub: 'Reunião Realizada', pts: '+50 pts',  color: '#eab308', icon: '✅' },
    { type: 'Venda', label: 'VENDA', sub: 'Fechamento',        pts: '+100 pts', color: '#10b981', icon: '💰' },
  ]
  const cw = window.innerWidth, ch = window.innerHeight
  return (
    <div style={S.page}>
      <MeteorBg />
      <canvas ref={confRef} style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', width: '100%', height: '100%' }} width={cw} height={ch} />
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user.name} size={44} border={user.squadColor} glow={true} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{user.name}</div>
              <div style={{ color: '#888', fontSize: 12 }}>{user.emoji} {user.squad}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...S.btnSm, background: '#ffffff18' }} onClick={onGoRanking}>🏆 Ranking</button>
            <button style={{ ...S.btnSm, background: '#ef444422', color: '#ef4444' }} onClick={onLogout}>Sair</button>
          </div>
        </div>
        <div style={{ ...S.card, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888', letterSpacing: 1, marginBottom: 4 }}>SEUS PONTOS</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#d4af37', lineHeight: 1 }}>{myPts}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>pts acumulados</div>
          {premio && (
            <div style={{ marginTop: 12, padding: '6px 16px', background: premio.color + '22', border: '1px solid ' + premio.color, borderRadius: 20, display: 'inline-block', color: premio.color, fontWeight: 700, fontSize: 13 }}>
              {premio.label} · R$ {premio.val}
            </div>
          )}
        </div>
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#888', letterSpacing: 1, marginBottom: 14 }}>PROGRESSO DA META 4-4-2</div>
          {[
            { type: 'R1',    val: myR1,    color: '#3b82f6', icon: '📅', pts: 30 },
            { type: 'R2',    val: myR2,    color: '#eab308', icon: '✅',  pts: 50 },
            { type: 'Venda', val: myVenda, color: '#10b981', icon: '💰',  pts: 100, max: 2 },
          ].map(m => (
            <div key={m.type} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: '#ccc', fontSize: 13 }}>{m.icon} {m.type} <span style={{ color: '#555', fontSize: 11 }}>+{m.pts}pts</span></span>
                <span style={{ color: m.color, fontWeight: 700, fontSize: 14 }}>{m.val} / {m.max || META[m.type]}</span>
              </div>
              <ProgBar val={m.val} max={m.max || META[m.type]} color={m.color} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#888', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>REGISTRAR NOVA REUNIÃO</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {btnTypes.map(b => (
            <button key={b.type} disabled={saving} onClick={() => register(b.type)}
              style={{ flex: 1, padding: '20px 8px', borderRadius: 16, background: b.color + '22', border: '2px solid ' + b.color, color: '#fff', cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: saving ? 0.5 : 1 }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = b.color + '44'; e.currentTarget.style.transform = 'scale(1.04)' } }}
              onMouseLeave={e => { e.currentTarget.style.background = b.color + '22'; e.currentTarget.style.transform = 'scale(1)' }}>
              <span style={{ fontSize: 28 }}>{saving ? '⏳' : b.icon}</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: b.color }}>{b.label}</span>
              <span style={{ fontSize: 11, color: '#888' }}>{b.sub}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.pts}</span>
            </button>
          ))}
        </div>
        {myRecs.length > 0 && (
          <div style={S.card}>
            <div style={{ fontSize: 12, color: '#888', letterSpacing: 1, marginBottom: 12 }}>REGISTROS DA CAMPANHA</div>
            {[...myRecs].sort((a,b) => b.ts - a.ts).slice(0, 8).map((r, i) => {
              const b = btnTypes.find(x => x.type === r.type)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ffffff0d' }}>
                  <span style={{ color: b?.color || '#fff', fontSize: 13 }}>{b?.icon} {r.type}</span>
                  <span style={{ color: '#555', fontSize: 11 }}>{new Date(r.ts).toLocaleDateString('pt-BR')}</span>
                  <span style={{ color: '#d4af37', fontWeight: 700, fontSize: 12 }}>+{POINTS[r.type]} pts</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function RankingScreen({ user, records, loading, error, countdown, lastUpdate, onSync, onGoRegister, onLogout }) {
  const confRef = useRef(null)
  const ranking = computeRanking(records)
  const top5    = ranking.slice(0, 5)
  const myRank  = user ? ranking.findIndex(a => a.code === user.code) + 1 : null
  const myData  = user ? ranking.find(a => a.code === user.code) : null
  const totalPts = ranking.reduce((s, a) => s + a.pts, 0)
  const totalR1  = ranking.reduce((s, a) => s + a.R1,  0)
  const totalR2  = ranking.reduce((s, a) => s + a.R2,  0)
  const totalV   = ranking.reduce((s, a) => s + a.Venda, 0)

  useEffect(() => {
    if (confRef.current && ranking[0]?.pts > 0) burst(confRef.current, true)
  }, []) // eslint-disable-line

  const medalBorder = ['#d4af37','#c0c0c0','#cd7f32','#444','#444']
  const medalGlow   = [true, false, false, false, false]
  const medalLabel  = ['🥇 1º','🥈 2º','🥉 3º','4º','5º']
  const podiumOrder = [1, 0, 2]
  const podiumSize  = [72, 96, 72]
  const podiumPad   = ['32px 0 0','48px 0 0','16px 0 0']
  const cw = window.innerWidth, ch = window.innerHeight
  const updStr = lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '--'

  return (
    <div style={S.page}>
      <MeteorBg />
      <canvas ref={confRef} style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', width: '100%', height: '100%' }} width={cw} height={ch} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#d4af37', letterSpacing: 2 }}>🛡️ INSURANCE DAY</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#555', letterSpacing: 1 }}>CAMPANHA 4-4-2 · JUNHO & JULHO 2026</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {user && <button style={{ ...S.btnSm, background: '#3b82f622', color: '#3b82f6' }} onClick={onGoRegister}>+ Registrar</button>}
            <button style={{ ...S.btnSm, background: '#ffffff18' }} onClick={onLogout}>Sair</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '8px 14px', background: '#ffffff06', borderRadius: 10, border: '1px solid #ffffff0a' }}>
          <LiveBadge countdown={countdown} onRefresh={onSync} loading={loading} />
          <span style={{ color: '#333', fontSize: 11 }}>atualizado às {updStr}</span>
        </div>

        {error && (
          <div style={{ background: '#ef444418', border: '1px solid #ef444444', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
            ⚠️ Erro ao buscar Notion: {error} — <button onClick={onSync} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}>tentar novamente</button>
          </div>
        )}

        {loading && records.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>⏳ Carregando dados do Notion...</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'TOTAL PONTOS',  val: totalPts, color: '#d4af37' },
            { label: 'R1 AGENDADAS',  val: totalR1,  color: '#3b82f6' },
            { label: 'R2 REALIZADAS', val: totalR2,  color: '#eab308' },
            { label: 'VENDAS',        val: totalV,   color: '#10b981' },
          ].map(m => (
            <div key={m.label} style={{ ...S.card, textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ fontSize: 10, color: '#666', letterSpacing: 1, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
            </div>
          ))}
        </div>

        {user && myData && (
          <div style={{ ...S.card, background: '#d4af3718', border: '1px solid #d4af3744', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d4af37', minWidth: 40 }}>{myRank}º</div>
            <Avatar name={user.name} size={44} border={user.squadColor} glow={true} />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700 }}>{user.name}</div>
              <div style={{ color: '#888', fontSize: 12 }}>{user.emoji} {user.squad}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#d4af37', fontWeight: 800, fontSize: 22 }}>{myData.pts}</div>
              <div style={{ color: '#555', fontSize: 11 }}>pts</div>
            </div>
          </div>
        )}

        <div style={{ fontSize: 12, color: '#888', letterSpacing: 2, textAlign: 'center', marginBottom: 20 }}>🏆 TOP 5 ASSESSORES</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 24 }}>
          {podiumOrder.map((idx, vi) => {
            const a = top5[idx]; if (!a) return null
            const isMe = user && a.code === user.code
            return (
              <div key={a.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: podiumPad[vi], flex: vi === 1 ? '0 0 180px' : '0 0 148px' }}>
                <div style={{ fontSize: 13, color: medalBorder[idx], fontWeight: 700, marginBottom: 8 }}>{medalLabel[idx]}</div>
                <div style={{ position: 'relative', animation: vi === 1 ? 'pulse 2.5s ease-in-out infinite' : 'none' }}>
                  <Avatar name={a.name} size={podiumSize[vi]} border={medalBorder[idx]} glow={medalGlow[idx]} />
                  {isMe && <div style={{ position: 'absolute', top: -4, right: -4, background: '#d4af37', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>★</div>}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: vi === 1 ? 15 : 13, marginTop: 10, textAlign: 'center' }}>{a.name.split(' ')[0]}</div>
                <div style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>{a.emoji} {a.squad}</div>
                <div style={{ textAlign: 'center', background: '#ffffff0a', borderRadius: 10, padding: '8px 16px', width: '100%' }}>
                  <div style={{ color: '#d4af37', fontWeight: 800, fontSize: vi === 1 ? 24 : 18 }}>{a.pts}</div>
                  <div style={{ color: '#555', fontSize: 10 }}>pts</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6, fontSize: 11 }}>
                    <span style={{ color: '#3b82f6' }}>R1·{a.R1}</span>
                    <span style={{ color: '#eab308' }}>R2·{a.R2}</span>
                    <span style={{ color: '#10b981' }}>V·{a.Venda}</span>
                  </div>
                </div>
                {getPremio(a) && <div style={{ marginTop: 8, fontSize: 11, color: getPremio(a).color, fontWeight: 700 }}>{getPremio(a).label} · R${getPremio(a).val}</div>}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[3, 4].map(idx => {
            const a = top5[idx]; if (!a) return null
            const isMe = user && a.code === user.code
            return (
              <div key={a.code} style={{ ...S.card, flex: 1, display: 'flex', alignItems: 'center', gap: 12, border: isMe ? '1px solid #d4af37' : '1px solid #ffffff12' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#444', minWidth: 28 }}>{idx + 1}º</div>
                <Avatar name={a.name} size={44} border={medalBorder[idx]} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  <div style={{ color: '#666', fontSize: 11 }}>{a.emoji} {a.squad}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#d4af37', fontWeight: 800, fontSize: 18 }}>{a.pts}</div>
                  <div style={{ color: '#555', fontSize: 10 }}>pts</div>
                </div>
              </div>
            )
          })}
        </div>

        <details style={S.card}>
          <summary style={{ color: '#888', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>📋 Ver todos os {ranking.length} assessores</summary>
          <div style={{ marginTop: 14 }}>
            {ranking.slice(5).map((a, i) => {
              const isMe = user && a.code === user.code
              return (
                <div key={a.code} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #ffffff08', background: isMe ? '#d4af3710' : 'transparent', borderRadius: 4 }}>
                  <span style={{ color: '#444', fontSize: 12, minWidth: 28, textAlign: 'center' }}>{i + 6}º</span>
                  <Avatar name={a.name} size={32} border={a.squadColor} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#ccc', fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{a.emoji} {a.squad}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span style={{ color: '#3b82f6' }}>R1·{a.R1}</span>
                    <span style={{ color: '#eab308' }}>R2·{a.R2}</span>
                    <span style={{ color: '#10b981' }}>V·{a.Venda}</span>
                  </div>
                  <div style={{ color: '#d4af37', fontWeight: 700, fontSize: 14, minWidth: 50, textAlign: 'right' }}>{a.pts} pts</div>
                </div>
              )
            })}
          </div>
        </details>
        <div style={{ textAlign: 'center', marginTop: 20, color: '#333', fontSize: 11 }}>
          🏅 Bronze R$150 · 🥈 Prata R$300 · 🥇 Ouro R$500
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('login')
  const [user,   setUser]   = useState(null)
  const [saving, setSaving] = useState(false)
  const { records, loading, error, countdown, lastUpdate, fetchData, addOptimistic } = useNotionRealtime()

  const handleLogin  = (assessor) => { setUser(assessor); setScreen('register') }
  const handleLogout = ()         => { setUser(null); setScreen('login') }

  const handleAdd = async (u, type) => {
    setSaving(true)
    try { await addOptimistic(u, type) }
    finally { setSaving(false) }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
      `}</style>
      {screen === 'login'    && <LoginScreen onLogin={handleLogin} />}
      {screen === 'register' && <RegisterScreen user={user} records={records} onAdd={handleAdd} saving={saving} onGoRanking={() => setScreen('ranking')} onLogout={handleLogout} />}
      {screen === 'ranking'  && <RankingScreen user={user} records={records} loading={loading} error={error} countdown={countdown} lastUpdate={lastUpdate} onSync={() => fetchData(false)} onGoRegister={() => setScreen('register')} onLogout={handleLogout} />}
    </>
  )
}
