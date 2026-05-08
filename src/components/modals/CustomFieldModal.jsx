import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Plus, Trash2, Settings2, AlertCircle, GitBranch,
  Image, Type, ToggleLeft, List, Hash, Calendar, FileText,
  ChevronDown, ChevronUp, Eye, EyeOff,
} from 'lucide-react'
import { useApp, createCustomField } from '../../context/AppContext.jsx'
import {
  OPERATORS, OPERATORS_WITH_VALUE, createCondition,
} from '../../utils/conditionEngine.js'

const SECTION_LABELS = {
  arrival:  'Ao Chegar no Cliente',
  training: 'Treinamento',
  machine:  'Máquinas (todos os blocos)',
  infra:    'Infraestrutura (todos os blocos)',
  closure:  'Encerramento',
}

const TYPE_OPTIONS = [
  { value:'text',     label:'Texto curto',       icon:<Type size={12}/> },
  { value:'textarea', label:'Texto longo',        icon:<Type size={12}/> },
  { value:'checkbox', label:'Checkbox',           icon:<ToggleLeft size={12}/> },
  { value:'select',   label:'Lista',              icon:<List size={12}/> },
  { value:'number',   label:'Número',             icon:<Hash size={12}/> },
  { value:'date',     label:'Data',               icon:<Calendar size={12}/> },
  { value:'boolean',  label:'Sim / Não',          icon:<ToggleLeft size={12}/> },
]

function ToggleChip({ active, onToggle, icon, label, activeColor='var(--cyan)', activeBg='var(--glass-3)', activeBorder }) {
  return (
    <label style={{
      display:'flex', alignItems:'center', gap:6, cursor:'pointer',
      padding:'5px 11px', borderRadius:7,
      border:'1px solid', fontSize:'.78rem', fontWeight:600,
      borderColor: active ? (activeBorder||activeColor) : 'var(--glass-border)',
      background:  active ? activeBg : 'transparent',
      color:       active ? activeColor : 'var(--t3)',
      transition:'all .15s', userSelect:'none',
    }}>
      <input type="checkbox" checked={!!active} onChange={e=>onToggle(e.target.checked)} style={{display:'none'}}/>
      {icon}{label}
    </label>
  )
}

// ── Condition editor for a single condition ──────────────────────────────────
function ConditionRow({ condition, index, allFields, onChange, onDelete }) {
  const needsValue = OPERATORS_WITH_VALUE.includes(condition.operator)
  const targetField = allFields.find(f => f.id === condition.fieldId)

  return (
    <div style={{
      display:'flex', flexDirection:'column', gap:6,
      padding:10, borderRadius:9,
      background:'var(--cyan-dim)', border:'1px solid var(--glass-border)',
    }}>
      {/* Logic connector (not shown for first) */}
      {index > 0 && (
        <div style={{display:'flex', gap:5, marginBottom:2}}>
          {['and','or'].map(logic => (
            <button key={logic} onClick={()=>onChange({logic})}
              style={{
                padding:'3px 12px', borderRadius:6, cursor:'pointer',
                border:'1px solid', fontSize:'.72rem', fontWeight:700, textTransform:'uppercase',
                borderColor: condition.logic===logic ? 'var(--cyan)' : 'var(--glass-border)',
                background:  condition.logic===logic ? 'var(--glass-3)' : 'transparent',
                color:       condition.logic===logic ? 'var(--cyan)' : 'var(--t3)',
              }}>
              {logic === 'and' ? 'E' : 'OU'}
            </button>
          ))}
        </div>
      )}

      <div style={{display:'flex', gap:6, alignItems:'flex-end', flexWrap:'wrap'}}>
        {/* Field selector */}
        <div style={{flex:'1 1 120px', minWidth:0}}>
          <label className="label" style={{marginBottom:4, fontSize:'.65rem'}}>Campo</label>
          <select className="select" value={condition.fieldId} onChange={e=>onChange({fieldId:e.target.value})}
            style={{padding:'6px 30px 6px 8px', fontSize:'.78rem'}}>
            <option value="">Selecione…</option>
            {allFields.map(f => <option key={f.id} value={f.id}>{f.label||'(sem nome)'}</option>)}
          </select>
        </div>

        {/* Operator / Value for Boolean/Checkbox */}
        {(targetField?.type === 'boolean' || targetField?.type === 'checkbox') ? (
          <div style={{flex:'1 1 180px', display:'flex', gap:6, alignItems:'flex-end'}}>
            <div style={{flex:1, minWidth:0}}>
              <label className="label" style={{marginBottom:4, fontSize:'.65rem'}}>Valor é</label>
              <div style={{display:'flex', gap:4}}>
                {[
                  { v:'true',  l:'Sim' },
                  { v:'false', l:'Não' },
                ].map(opt => {
                  const active = String(condition.value) === opt.v
                  return (
                    <button key={opt.l} onClick={()=>onChange({operator:'eq', value:opt.v})}
                      style={{
                        flex:1, padding:'6px', borderRadius:7, cursor:'pointer', border:'1px solid',
                        fontSize:'.75rem', fontWeight:600, transition:'all .1s',
                        borderColor: active ? 'var(--cyan)' : 'var(--glass-border)',
                        background:  active ? 'var(--glass-3)' : 'transparent',
                        color:       active ? 'var(--cyan)'  : 'var(--t3)',
                      }}>
                      {opt.l}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Operator */}
            <div style={{flex:'1 1 120px', minWidth:0}}>
              <label className="label" style={{marginBottom:4, fontSize:'.65rem'}}>Condição</label>
              <select className="select" value={condition.operator} onChange={e=>onChange({operator:e.target.value})}
                style={{padding:'6px 30px 6px 8px', fontSize:'.78rem'}}>
                {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
              </select>
            </div>

            {/* Value (only if operator needs it) */}
            {needsValue && (
              <div style={{flex:'1 1 100px', minWidth:0}}>
                <label className="label" style={{marginBottom:4, fontSize:'.65rem'}}>Valor</label>
                {targetField?.type === 'select' && targetField.options?.length ? (
                  <select className="select" value={condition.value} onChange={e=>onChange({value:e.target.value})}
                    style={{padding:'6px 30px 6px 8px', fontSize:'.78rem'}}>
                    <option value="">Selecione…</option>
                    {targetField.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input className="input" placeholder="Valor…" value={condition.value}
                    onChange={e=>onChange({value:e.target.value})}
                    style={{padding:'6px 8px', fontSize:'.78rem'}}/>
                )}
              </div>
            )}
          </>
        )}

        {/* Delete */}
        <button className="btn btn-danger btn-icon" onClick={onDelete}
          style={{width:28,height:28,flexShrink:0}} title="Remover condição">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  )
}

// ── Full conditions panel ────────────────────────────────────────────────────
function ConditionsPanel({ field, onChange, allFields }) {
  const [open, setOpen] = useState(false)
  const conditions = field.conditions || []
  const hasConditions = conditions.length > 0

  const addCond   = () => onChange({ conditions:[...conditions, createCondition()] })
  const updCond   = (id, u) => onChange({ conditions:conditions.map(c=>c.id===id?{...c,...u}:c) })
  const delCond   = (id)    => onChange({ conditions:conditions.filter(c=>c.id!==id) })

  return (
    <div style={{
      border:'1px solid', borderRadius:10, overflow:'hidden',
      borderColor: hasConditions ? 'var(--cyan-border)' : 'var(--glass-border)',
      background: hasConditions ? 'var(--cyan-dim)' : 'transparent',
    }}>
      {/* Toggle header */}
      <button
        onClick={()=>setOpen(v=>!v)}
        style={{
          width:'100%', padding:'8px 12px', background:'transparent', border:'none',
          display:'flex', alignItems:'center', gap:7, cursor:'pointer',
          color: hasConditions ? 'var(--cyan)' : 'var(--t3)',
          fontFamily:'var(--font)', fontSize:'.78rem', fontWeight:600,
          transition:'color .15s',
        }}>
        <GitBranch size={13}/>
        <span>
          {hasConditions
            ? `${conditions.length} condição${conditions.length!==1?'ões':''} configurada${conditions.length!==1?'s':''}`
            : 'Adicionar condições (mostrar/ocultar)'}
        </span>
        {open ? <ChevronUp size={13} style={{marginLeft:'auto'}}/> : <ChevronDown size={13} style={{marginLeft:'auto'}}/>}
      </button>

      {open && (
        <div style={{padding:'8px 12px 12px', display:'flex', flexDirection:'column', gap:8,
          borderTop:'1px solid var(--glass-border)'}}>

          <p style={{fontSize:'.75rem', color:'var(--t2)', lineHeight:1.5, marginBottom:4}}>
            Define quando este campo aparece ou é ocultado, com base no valor de outros campos da mesma seção.
          </p>

          {/* Mode: show when / hide when */}
          {conditions.length > 0 && (
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:4}}>
              <span style={{fontSize:'.75rem', color:'var(--t2)', fontWeight:600}}>Este campo:</span>
              {[
                { value:'show', label:'Mostrar quando', icon:<Eye size={13}/> },
                { value:'hide', label:'Ocultar quando', icon:<EyeOff size={13}/> },
              ].map(opt=>(
                <button key={opt.value} onClick={()=>onChange({conditionMode:opt.value})}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'4px 11px', borderRadius:6, cursor:'pointer',
                    border:'1px solid', fontSize:'.75rem', fontWeight:600,
                    borderColor: (field.conditionMode||'show')===opt.value ? 'var(--cyan)' : 'var(--glass-border)',
                    background:  (field.conditionMode||'show')===opt.value ? 'var(--glass-3)' : 'transparent',
                    color:       (field.conditionMode||'show')===opt.value ? 'var(--cyan)' : 'var(--t3)',
                    transition:'all .15s',
                  }}>
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
              {conditions.length > 1 && (
                <>
                  <span style={{fontSize:'.75rem', color:'var(--t3)'}}>usando lógica:</span>
                  {['and','or'].map(logic=>(
                    <button key={logic} onClick={()=>onChange({conditionLogic:logic})}
                      style={{
                        padding:'4px 11px', borderRadius:6, cursor:'pointer',
                        border:'1px solid', fontSize:'.75rem', fontWeight:700,
                        borderColor:(field.conditionLogic||'and')===logic?'var(--amber)':'var(--glass-border)',
                        background: (field.conditionLogic||'and')===logic?'var(--amber-bg)':'transparent',
                        color:      (field.conditionLogic||'and')===logic?'var(--amber)':'var(--t3)',
                      }}>
                      {logic==='and'?'TODAS (E)':'QUALQUER (OU)'}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Condition rows */}
          {conditions.map((cond,idx)=>(
            <ConditionRow
              key={cond.id}
              condition={cond}
              index={idx}
              allFields={allFields.filter(f=>f.id!==field.id)} // exclude self
              onChange={u=>updCond(cond.id,u)}
              onDelete={()=>delCond(cond.id)}
            />
          ))}

          <button className="btn btn-secondary btn-sm" onClick={addCond}
            style={{gap:5, alignSelf:'flex-start'}}>
            <Plus size={12}/> Adicionar condição
          </button>
        </div>
      )}
    </div>
  )
}

// ── Field editor (single field) ──────────────────────────────────────────────
function FieldEditor({ field, onChange, onDelete, allFields }) {
  const [newOption, setNewOption] = useState('')
  const addOption = () => {
    if (!newOption.trim()) return
    onChange({ options:[...(field.options||[]), newOption.trim()] })
    setNewOption('')
  }
  const removeOption = i => onChange({ options:field.options.filter((_,idx)=>idx!==i) })

  return (
    <div style={{
      background:'var(--glass-1)', border:'1px solid var(--glass-border)',
      borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:11,
    }}>
      {/* Name + delete */}
      <div style={{display:'flex', gap:8, alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <label className="label" style={{marginBottom:5}}>Nome do campo <span className="req">*</span></label>
          <input className="input" placeholder="Ex: Número de série, CNPJ..."
            value={field.label} onChange={e=>onChange({label:e.target.value})}/>
        </div>
        <button className="btn btn-danger btn-icon" onClick={onDelete}
          style={{marginTop:22, flexShrink:0}} title="Remover campo">
          <Trash2 size={13}/>
        </button>
      </div>

      {/* Type selector */}
      <div>
        <label className="label" style={{marginBottom:6}}>Tipo de campo</label>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5}}>
          {TYPE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={()=>onChange({type:opt.value})}
              style={{
                padding:'6px 8px', borderRadius:8, cursor:'pointer', border:'1px solid',
                borderColor:field.type===opt.value?'var(--cyan)':'var(--glass-border)',
                background: field.type===opt.value?'var(--glass-3)':'transparent',
                color:      field.type===opt.value?'var(--cyan)':'var(--t2)',
                fontFamily:'var(--font)', fontSize:'.7rem', fontWeight:600,
                display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                transition:'all .15s',
              }}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select options */}
      {field.type==='select' && (
        <div>
          <label className="label" style={{marginBottom:6}}>Opções da lista</label>
          <div style={{display:'flex', flexDirection:'column', gap:4, marginBottom:8}}>
            {(field.options||[]).map((opt,i)=>(
              <div key={i} style={{display:'flex', gap:6, alignItems:'center'}}>
                <span style={{flex:1, fontSize:'.82rem', color:'var(--t1)', padding:'4px 10px',
                  background:'var(--glass-1)', border:'1px solid var(--glass-border)', borderRadius:7}}>
                  {opt}
                </span>
                <button className="btn btn-danger btn-icon" style={{width:26,height:26}} onClick={()=>removeOption(i)}>
                  <X size={11}/>
                </button>
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:6}}>
            <input className="input" placeholder="Nova opção..." value={newOption}
              onChange={e=>setNewOption(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&addOption()} style={{flex:1}}/>
            <button className="btn btn-secondary btn-sm" onClick={addOption} style={{gap:4}}>
              <Plus size={12}/> Add
            </button>
          </div>
        </div>
      )}

      {/* Placeholder */}
      {['text','textarea','number'].includes(field.type) && (
        <div>
          <label className="label" style={{marginBottom:5}}>Placeholder</label>
          <input className="input" placeholder="Texto de dica no campo vazio"
            value={field.placeholder||''} onChange={e=>onChange({placeholder:e.target.value})}/>
        </div>
      )}

      {/* Toggles */}
      <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
        <ToggleChip
          active={field.required}
          onToggle={v=>onChange({required:v})}
          icon={<AlertCircle size={12}/>}
          label="Obrigatório"
          activeColor="var(--red)"
          activeBg="var(--red-bg)"
          activeBorder="rgba(255,77,109,.4)"
        />
        <ToggleChip
          active={field.hasPhoto}
          onToggle={v=>onChange({hasPhoto:v})}
          icon={<Image size={12}/>}
          label="Com foto"
        />
        <ToggleChip
          active={field.showInPdf ?? true}
          onToggle={v=>onChange({showInPdf:v})}
          icon={<FileText size={12}/>}
          label="No PDF"
          activeColor="var(--green)"
          activeBg="var(--green-bg)"
          activeBorder="rgba(0,255,163,.3)"
        />
      </div>

      {/* Conditions */}
      <ConditionsPanel
        field={field}
        onChange={onChange}
        allFields={allFields}
      />
    </div>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function CustomFieldModal({ section, sectionId, onClose }) {
  const { state, addCustomField, updCustomField, delCustomField, updCustomSection } = useApp()

  const isCustomSection = !!sectionId
  const csec = isCustomSection ? state.customSections.find(s=>s.id===sectionId) : null

  const fields = isCustomSection
    ? (csec?.fields || [])
    : (state.customFields||[]).filter(f=>f.section===section)

  const sectionLabel = isCustomSection
    ? (csec?.title || 'Seção personalizada')
    : (SECTION_LABELS[section] || section)

  // All fields in the same scope (for condition selectors)
  const allScopeFields = fields

  const handleAdd = () => {
    const newField = { ...createCustomField(isCustomSection ? 'custom' : section), showInPdf:true }
    if (isCustomSection) {
      updCustomSection(sectionId, { fields:[...(csec?.fields||[]), newField] })
    } else {
      addCustomField(newField)
    }
  }

  const handleChange = (id, updates) => {
    if (isCustomSection) {
      updCustomSection(sectionId, { fields:(csec?.fields||[]).map(f=>f.id===id?{...f,...updates}:f) })
    } else {
      updCustomField(id, updates)
    }
  }

  const handleDelete = id => {
    if (!window.confirm('Remover este campo?')) return
    if (isCustomSection) {
      updCustomSection(sectionId, { fields:(csec?.fields||[]).filter(f=>f.id!==id) })
    } else {
      delCustomField(id)
    }
  }

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <Settings2 size={17} color="var(--cyan)"/>
            Campos — {sectionLabel}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        <div className="modal-body" style={{display:'flex', flexDirection:'column', gap:12}}>
          <p style={{fontSize:'.8rem', color:'var(--t2)', lineHeight:1.5}}>
            <strong style={{color:'var(--red)'}}>Obrigatório</strong> → bloqueia o relatório se vazio.{' '}
            <strong style={{color:'var(--green)'}}>No PDF</strong> → aparece no relatório gerado.{' '}
            <strong style={{color:'var(--cyan)'}}>Condições</strong> → mostrar/ocultar baseado em outros campos.
          </p>

          {fields.length===0 && (
            <div style={{textAlign:'center', padding:'22px 0', color:'var(--t3)',
              border:'1px dashed var(--glass-border)', borderRadius:12}}>
              <Settings2 size={26} style={{opacity:.3, marginBottom:8}}/>
              <div style={{fontSize:'.83rem'}}>Nenhum campo ainda.</div>
              <div style={{fontSize:'.75rem', marginTop:4}}>Clique em "+ Adicionar campo".</div>
            </div>
          )}

          {fields.map(field=>(
            <FieldEditor
              key={field.id}
              field={field}
              onChange={u=>handleChange(field.id,u)}
              onDelete={()=>handleDelete(field.id)}
              allFields={allScopeFields}
            />
          ))}
        </div>

        <div className="modal-foot">
          <button className="btn btn-secondary btn-sm" onClick={handleAdd} style={{gap:5}}>
            <Plus size={13}/> Adicionar campo
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Concluído</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
