import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { PenLine, Trash2, Check, X, User, Plus } from 'lucide-react'
import { useAppState, useAppDispatch } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { useThemeCtx } from '../../context/ThemeContext.jsx'
import { Field, SecCard, OptimizedInput } from '../ui/index.jsx'
import { memo } from 'react'

// ── Signature canvas modal ────────────────────────────────────────────────────
function SigCanvas({ title, onSave, onClose }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const lastPos   = useRef({ x: 0, y: 0 })
  const rafRef    = useRef(null)
  const { primaryColor } = useThemeCtx()

  // Setup canvas size and context
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    ctx.strokeStyle = primaryColor || '#00d4ff'
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Use native listeners to ensure non-passive behavior for preventDefault
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect()
      const src = e.touches ? e.touches[0] : e
      return { x: src.clientX - r.left, y: src.clientY - r.top }
    }

    const start = (e) => {
      if (e.cancelable) e.preventDefault()
      drawing.current = true
      const p = getPos(e)
      lastPos.current = p
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
    }

    const move = (e) => {
      if (!drawing.current) return
      if (e.cancelable) e.preventDefault()
      
      const p = getPos(e)
      
      // Use requestAnimationFrame for smoother drawing
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
        lastPos.current = p
      })
    }

    const stop = () => {
      drawing.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', stop)
    canvas.addEventListener('mouseleave', stop)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', stop)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', stop)
      canvas.removeEventListener('mouseleave', stop)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', stop)
    }
  }, [primaryColor])

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  
  const save = () => {
    if (!canvasRef.current) return
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><PenLine size={16} color="var(--cyan)" />{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '.78rem', color: 'var(--t3)', marginBottom: 12, textAlign: 'center' }}>
            Desenhe sua assinatura abaixo (otimizado para touch)
          </p>
          <div className="sig-canvas-wrap" style={{ height: 180 }}>
            <canvas 
              ref={canvasRef} 
              style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', background: 'var(--glass-2)', borderRadius: 12 }} 
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-danger btn-sm" onClick={clear}><Trash2 size={12} /> Limpar</button>
          <button className="btn btn-primary btn-sm" onClick={save}><Check size={12} /> Salvar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Single technician column ──────────────────────────────────────────────────
const TechColumn = memo(function TechColumn({ tech, index, canDelete }) {
  const { updTech, delTech } = useAppDispatch()
  const { v } = useValidation()
  const [open, setOpen] = useState(false)

  const nameErr = !!v.errors[`tech_${tech.id}_name`]
  const sigErr  = !!v.errors[`tech_${tech.id}_sig`]

  return (
    <div className="sig-col">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:7}}>
        <div style={{display:'flex',alignItems:'center',gap:7,fontWeight:700,fontSize:'.875rem'}}>
          <User size={14} color="var(--cyan)"/>
          Técnico {index+1}
        </div>
        {canDelete && (
          <button className="btn btn-danger btn-icon"
            onClick={()=>window.confirm(`Remover Técnico ${index+1}?`)&&delTech(tech.id)}>
            <X size={14}/>
          </button>
        )}
      </div>

      {/* Signature preview */}
      <div className="sig-preview"
        style={{borderColor:sigErr?'rgba(255,77,109,.42)':undefined}}
        onClick={()=>setOpen(true)}>
        {tech.signature
          ? <div style={{
              width: '100%',
              height: 80,
              backgroundColor: 'var(--cyan)',
              WebkitMask: `url("${tech.signature}") center/contain no-repeat`,
              mask: `url("${tech.signature}") center/contain no-repeat`,
            }} />
          : <span style={{fontSize:'.75rem',color:'var(--t3)'}}>Clique para assinar</span>}
      </div>
      {sigErr && <div className="err-msg" style={{marginTop:-8}}>Assinatura obrigatória</div>}

      <div style={{display:'flex',gap:7}}>
        <button className="btn btn-primary btn-sm" onClick={()=>setOpen(true)}
          style={{flex:1,justifyContent:'center'}}>
          <PenLine size={12}/>{tech.signature?'Reassinar':'Assinar'}
        </button>
        {tech.signature && (
          <button className="btn btn-danger btn-icon btn-sm"
            onClick={()=>updTech(tech.id,{signature:null})}>
            <Trash2 size={12}/>
          </button>
        )}
      </div>

      <Field label={`Nome do Técnico ${index+1}`} required error={nameErr&&'Campo obrigatório'}>
        <OptimizedInput className={`input ${nameErr?'err':''}`}
          placeholder="Nome completo do técnico"
          value={tech.name}
          onChange={val=>updTech(tech.id,{name:val})}/>
      </Field>

      {open && (
        <SigCanvas
          title={`Assinatura — Técnico ${index+1}`}
          onSave={data=>{updTech(tech.id,{signature:data});setOpen(false)}}
          onClose={()=>setOpen(false)}/>
      )}
    </div>
  )
})

// ── Client signature column ───────────────────────────────────────────────────
const ClientColumn = memo(function ClientColumn({ clientName, clientSignature }) {
  const { set, setSig } = useAppDispatch()
  const { v } = useValidation()
  const [open, setOpen] = useState(false)
  const nameErr = !!v.errors.clientName
  const sigErr  = !!v.errors.clientSig

  return (
    <div className="sig-col">
      <div style={{display:'flex',alignItems:'center',gap:7,fontWeight:700,fontSize:'.875rem'}}>
        <User size={14} color="var(--cyan)"/>
        Responsável / Cliente
      </div>
      <div className="sig-preview"
        style={{borderColor:sigErr?'rgba(255,77,109,.42)':undefined}}
        onClick={()=>setOpen(true)}>
        {clientSignature
          ? <div style={{
              width: '100%',
              height: 80,
              backgroundColor: 'var(--cyan)',
              WebkitMask: `url("${clientSignature}") center/contain no-repeat`,
              mask: `url("${clientSignature}") center/contain no-repeat`,
            }} />
          : <span style={{fontSize:'.75rem',color:'var(--t3)'}}>Clique para assinar</span>}
      </div>
      {sigErr && <div className="err-msg" style={{marginTop:-8}}>Assinatura obrigatória</div>}
      <div style={{display:'flex',gap:7}}>
        <button className="btn btn-primary btn-sm" onClick={()=>setOpen(true)} style={{flex:1,justifyContent:'center'}}>
          <PenLine size={12}/>{clientSignature?'Reassinar':'Assinar'}
        </button>
        {clientSignature && (
          <button className="btn btn-danger btn-icon btn-sm" onClick={()=>setSig('clientSignature',null)}>
            <Trash2 size={12}/>
          </button>
        )}
      </div>
      <Field label="Nome do responsável" required error={nameErr&&'Campo obrigatório'}>
        <OptimizedInput className={`input ${nameErr?'err':''}`}
          placeholder="Nome completo do responsável"
          value={clientName}
          onChange={val=>set('clientName',val)}/>
      </Field>
      {open && (
        <SigCanvas
          title="Assinatura do Responsável"
          onSave={data=>{setSig('clientSignature',data);setOpen(false)}}
          onClose={()=>setOpen(false)}/>
      )}
    </div>
  )
})

// ── Main section ─────────────────────────────────────────────────────────────
const SignatureSection = memo(function SignatureSection({ dragHandleProps }) {
  const state = useAppState()
  const { addTech } = useAppDispatch()
  const techs = state.technicians || []

  return (
    <SecCard icon={<PenLine size={17}/>} title="Assinaturas" dragHandleProps={dragHandleProps}>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'flex-start'}}>
        <ClientColumn clientName={state.clientName} clientSignature={state.clientSignature}/>
        {techs.map((t,i) => (
          <TechColumn key={t.id} tech={t} index={i} canDelete={techs.length>1}/>
        ))}
      </div>
      {/* Add technician button */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={addTech}
        style={{gap:5,alignSelf:'flex-start'}}
      >
        <Plus size={13}/> Adicionar técnico
      </button>
    </SecCard>
  )
})

export default SignatureSection
