import { X, CheckCircle2, XCircle, AlertCircle, AlertTriangle, ChevronRight, FileText, Lock } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { RadioGroup } from '../ui/index.jsx'

function ReviewRow({ label, value, ok, soft }) {
  const bg     = ok ? 'var(--green-bg)' : soft ? 'var(--amber-bg)' : 'var(--red-bg)'
  const border = ok ? 'rgba(0,255,163,.14)' : soft ? 'rgba(255,184,48,.2)' : 'rgba(255,77,109,.14)'
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'7px 12px', borderRadius:8,
      background: bg, border: `1px solid ${border}`,
    }}>
      <span style={{ fontSize:'.83rem', color:'var(--t2)' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {value && <span style={{ fontSize:'.78rem', color:'var(--t1)', fontWeight:600 }}>{value}</span>}
        {ok
          ? <CheckCircle2 size={14} color="var(--green)"/>
          : soft
            ? <AlertTriangle size={14} color="var(--amber)"/>
            : <XCircle size={14} color="var(--red)"/>
        }
      </div>
    </div>
  )
}

function SectionBlock({ title, items }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{
        fontSize:'.72rem', fontWeight:700, color:'var(--t3)',
        textTransform:'uppercase', letterSpacing:'.1em',
        marginBottom:6, display:'flex', alignItems:'center', gap:5,
      }}>
        <ChevronRight size={12} color="var(--cyan)"/>{title}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {items.map((item, i) => <ReviewRow key={i} {...item}/>)}
      </div>
    </div>
  )
}

export default function ReviewModal({ onClose, onGenerate }) {
  const { state, set } = useApp()
  const { v }          = useValidation()

  const arrival = [
    { label:'Nome da empresa', value:state.companyName||'—', ok:!!state.companyName?.trim() },
    { label:'Chamado aberto no Milvus', ok:state.openMilvus },
    { label:'Atendimento iniciado',     ok:state.startService },
  ]

  const training = [
    { label:'Demonstração Helpdesk',          ok:state.trainHelpdesk },
    { label:'Procedimentos de manutenção',    ok:state.trainMaintenance },
    { label:'Orientação sobre atualizações',  ok:state.trainUpdates },
  ]

  const machines = state.machines.map((m, i) => ({
    label: `Máquina ${i+1}: ${m.name||'sem nome'}`,
    value: [m.os, m.ram].filter(Boolean).join(' • ') || undefined,
    ok:    !!(m.name && m.os && m.storage && m.ram && m.anydesk && m.observations),
  }))

  const infras = state.infrastructures.map((inf, i) => ({
    label: `Infraestrutura ${i+1}: ${inf.description||'sem nome'}`,
    value: inf.location || undefined,
    ok:    !!(inf.description && inf.location && inf.observations),
  }))

  const sigs = [
    { label:`Responsável: ${state.clientName||'—'}`, ok:!!(state.clientName && state.clientSignature) },
    ...(state.technicians||[]).map((t, i) => ({
      label:`Técnico ${i+1}: ${t.name||'—'}`, ok:!!(t.name && t.signature),
    })),
  ]

  const photoCount = state.machines.reduce((s,m)=>s+m.photos.filter(p=>p.dataUrl).length,0)
                   + state.infrastructures.reduce((s,i)=>s+i.photos.filter(p=>p.dataUrl).length,0)

  const hasHard = v.hardMissing.length > 0
  const hasSoft = v.softMissing.length > 0

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:560 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <FileText size={17} color="var(--cyan)"/>
            Revisão do relatório
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        <div className="modal-body">
          {/* Summary bar */}
          <div style={{
            display:'flex', gap:10, flexWrap:'wrap', marginBottom:16,
            padding:'12px 14px', background:'var(--glass-3)',
            border:'1px solid var(--cyan-border)', borderRadius:12,
          }}>
            {[
              { label:'Máquinas',  value: state.machines.length },
              { label:'Infraest.', value: state.infrastructures.length },
              { label:'Fotos',     value: photoCount },
              { label:'Técnicos',  value: state.technicians?.length||0 },
              { label:'Bloqueios', value: v.hardMissing.length, warn: v.hardMissing.length > 0 },
            ].map(({ label, value, warn }) => (
              <div key={label} style={{ textAlign:'center', flex:1, minWidth:50 }}>
                <div style={{
                  fontSize:'1.2rem', fontWeight:800,
                  color: warn && value > 0 ? 'var(--red)' : 'var(--cyan)',
                  fontFamily:'var(--mono)',
                }}>{value}</div>
                <div style={{ fontSize:'.65rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.06em' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Hard block: campos obrigatórios não preenchidos */}
          {hasHard && (
            <div style={{
              marginBottom:14, padding:'12px 14px',
              background:'var(--red-bg)', border:'1px solid rgba(255,77,109,.3)',
              borderRadius:12, display:'flex', gap:10, alignItems:'flex-start',
            }}>
              <Lock size={16} color="var(--red)" style={{ flexShrink:0, marginTop:1 }}/>
              <div>
                <div style={{ fontWeight:700, color:'var(--red)', fontSize:'.875rem', marginBottom:4 }}>
                  {v.hardMissing.length} campo{v.hardMissing.length!==1?'s':''} obrigatório{v.hardMissing.length!==1?'s':''} pendente{v.hardMissing.length!==1?'s':''}
                </div>
                <div style={{ fontSize:'.78rem', color:'var(--t2)', lineHeight:1.5 }}>
                  Esses campos <strong style={{color:'var(--t1)'}}>bloqueiam a geração</strong> do relatório.
                  Volte e preencha-os antes de continuar.
                </div>
                {/* List hard missing grouped */}
                <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:3 }}>
                  {Object.entries(v.hardSections).map(([sec, fields]) => (
                    <div key={sec} style={{ fontSize:'.75rem', color:'var(--red)' }}>
                      <strong>{sec}:</strong> {fields.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PDF order (if custom sections exist) */}
          {(state.customSections||[]).length > 0 && (
            <div style={{
              marginBottom:14, background:'var(--glass-1)',
              padding:'12px 14px', borderRadius:10, border:'1px solid var(--glass-border)',
            }}>
              <RadioGroup
                label="Ordem no PDF"
                value={state.pdfOrder || 'default'}
                onChange={val => set('pdfOrder', val)}
                options={[
                  { value:'default', label:'Padrão (seções extras no final)' },
                  { value:'custom',  label:'Seguir ordem visual da tela' },
                ]}
              />
            </div>
          )}

          {/* Review checklist */}
          <SectionBlock title="Chegada"        items={arrival}/>
          <SectionBlock title="Treinamento"    items={training}/>
          <SectionBlock title="Máquinas"       items={machines.length ? machines : [{ label:'Nenhuma máquina adicionada', ok:false }]}/>
          {state.infrastructures.length > 0 && <SectionBlock title="Infraestrutura" items={infras}/>}
          <SectionBlock title="Assinaturas"    items={sigs}/>

          {/* Custom sections review */}
          {(state.customSections||[]).filter(s => s.fields?.length > 0).map(sec => {
            const secItems = (sec.fields||[]).map(f => ({
              label: f.label,
              value: String((sec.values||{})[f.id] ?? '').slice(0, 30) || undefined,
              ok: !f.required || !!((sec.values||{})[f.id]),
            }))
            return <SectionBlock key={sec.id} title={sec.title} items={secItems}/>
          })}
        </div>

        <div className="modal-foot">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Voltar e corrigir
          </button>
          <button
            className={`btn btn-sm ${hasHard ? 'btn-secondary' : 'btn-primary'}`}
            onClick={hasHard ? undefined : onGenerate}
            disabled={hasHard}
            style={{ gap:5, cursor: hasHard ? 'not-allowed' : 'pointer' }}
            title={hasHard ? 'Preencha os campos obrigatórios antes de gerar' : ''}
          >
            <FileText size={13}/>
            {hasHard ? 'Corrija os bloqueios' : 'Gerar relatório'}
          </button>
        </div>
      </div>
    </div>
  )
}
