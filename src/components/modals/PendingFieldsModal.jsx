import { AlertCircle, Lock, AlertTriangle, X, ChevronRight } from 'lucide-react'
import { useValidation } from '../../hooks/useValidation.js'

export default function PendingFieldsModal({ onClose }) {
  const { v } = useValidation()
  const hasHard = v.hardMissing.length > 0
  const hasSoft = v.softMissing.length > 0

  const renderGroup = (title, sectionsObj, color, borderColor, icon) => {
    const entries = Object.entries(sectionsObj)
    if (!entries.length) return null
    return (
      <div style={{ marginBottom:12 }}>
        <div style={{
          display:'flex', alignItems:'center', gap:6, marginBottom:8,
          fontSize:'.75rem', fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.07em',
        }}>
          {icon}{title}
        </div>
        {entries.map(([sec, fields]) => (
          <div key={sec} style={{
            background: color==='var(--red)' ? 'var(--red-bg)' : 'var(--amber-bg)',
            border:`1px solid ${borderColor}`, borderRadius:10, overflow:'hidden', marginBottom:6,
          }}>
            <div style={{
              padding:'9px 13px', borderBottom:`1px solid ${borderColor}`,
              display:'flex', alignItems:'center', gap:5,
              fontWeight:700, fontSize:'.8rem', color,
            }}>
              <ChevronRight size={12}/>{sec}
            </div>
            <div style={{ padding:'8px 13px', display:'flex', flexDirection:'column', gap:4 }}>
              {fields.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.8rem', color:'var(--t2)' }}>
                  <div style={{ width:4, height:4, borderRadius:'50%', background:color, flexShrink:0 }}/>
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const hardSecs = v.hardMissing.reduce((acc,{section,field})=>{;(acc[section]=acc[section]||[]).push(field);return acc},{})
  const softSecs = v.softMissing.reduce((acc,{section,field})=>{;(acc[section]=acc[section]||[]).push(field);return acc},{})

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <AlertCircle size={17} color="var(--red)"/>
            Pendências do relatório
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {hasHard && (
            <div style={{
              padding:'10px 13px', marginBottom:10,
              background:'var(--red-bg)', border:'1px solid rgba(255,77,109,.25)',
              borderRadius:10, fontSize:'.82rem', color:'var(--t2)', lineHeight:1.5,
            }}>
              <strong style={{color:'var(--red)'}}>Bloqueios ({v.hardMissing.length})</strong> — campos obrigatórios que
              <strong style={{color:'var(--t1)'}}> impedem</strong> a geração do relatório.
            </div>
          )}
          {renderGroup('Bloqueios — obrigatórios', hardSecs, 'var(--red)', 'rgba(255,77,109,.2)', <Lock size={12}/>)}
          {hasSoft && renderGroup('Avisos — opcionais', softSecs, 'var(--amber)', 'rgba(255,184,48,.2)', <AlertTriangle size={12}/>)}
          {!hasHard && !hasSoft && (
            <p style={{textAlign:'center', color:'var(--t3)', padding:'16px 0'}}>Nenhuma pendência!</p>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary btn-sm" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  )
}
