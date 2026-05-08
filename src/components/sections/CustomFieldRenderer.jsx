import { useRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { compressImage } from '../../utils/imageCompression.js'
import { isFieldVisible } from '../../utils/conditionEngine.js'

/**
 * Renders custom fields for a given section, respecting conditional visibility.
 * - Global sections (arrival/training/closure): itemType=null, itemId=null
 * - Machine/infra: pass itemType + itemId
 */
export default function CustomFieldRenderer({ section, itemType = null, itemId = null }) {
  const { state, setCustomValue, setItemCustomValue } = useApp()
  const { v } = useValidation()
  const fileRefs = useRef({})

  const fields = (state.customFields || []).filter(f => f.section === section)
  if (!fields.length) return null

  // Flat values map for condition evaluation
  const getAllValues = () => {
    if (itemType && itemId) {
      const item = itemType === 'machine'
        ? state.machines.find(m => m.id === itemId)
        : state.infrastructures.find(i => i.id === itemId)
      return item?.customFieldValues || {}
    }
    return state.customFieldValues || {}
  }

  const getValue = (fieldId) => {
    const vals = getAllValues()
    return vals[fieldId] ?? ''
  }

  const setValue = (fieldId, value) => {
    if (itemType && itemId) {
      setItemCustomValue(itemType, itemId, fieldId, value)
    } else {
      setCustomValue(fieldId, value)
    }
  }

  const handlePhoto = async (fieldId, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async e => {
      const compressed = await compressImage(e.target.result)
      setValue(`${fieldId}_photo`, compressed)
    }
    reader.readAsDataURL(file)
  }

  const allValues = getAllValues()

  return (
    <>
      {fields.map(field => {
        // ── Evaluate conditional visibility ──────────────────────
        const visible = isFieldVisible(field, allValues)
        if (!visible) {
          // Show a subtle "hidden by condition" hint only in edit mode
          return (
            <div key={field.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 7,
              background: 'transparent',
              border: '1px dashed rgba(255,255,255,.06)',
              opacity: 0.4,
            }}>
              <EyeOff size={11} color="var(--t3)" />
              <span style={{ fontSize: '.72rem', color: 'var(--t3)', fontStyle: 'italic' }}>
                "{field.label}" — oculto por condição
              </span>
            </div>
          )
        }

        // ── Error key ─────────────────────────────────────────────
        const errKey = itemType && itemId
          ? `cf_${itemType[0]}_${itemId}_${field.id}`
          : `cf_${field.id}`
        const hasErr  = !!v.errors[errKey]
        const val     = getValue(field.id)
        const photoVal = getValue(`${field.id}_photo`)

        return (
          <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Label (skip for checkbox — label is inline) */}
            {field.type !== 'checkbox' && (
              <label className="label">
                {field.label}
                {field.required && <span className="req">*</span>}
              </label>
            )}

            {/* Text */}
            {field.type === 'text' && (
              <input
                className={`input ${hasErr ? 'err' : ''}`}
                placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}...`}
                value={val}
                onChange={e => setValue(field.id, e.target.value)}
              />
            )}

            {/* Textarea */}
            {field.type === 'textarea' && (
              <textarea
                className={`textarea ${hasErr ? 'err' : ''}`}
                placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}...`}
                value={val}
                onChange={e => setValue(field.id, e.target.value)}
                style={{ minHeight: 70 }}
              />
            )}

            {/* Checkbox */}
            {field.type === 'checkbox' && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
                  borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                  border: `1px solid ${val ? 'var(--cyan-dim)' : 'var(--glass-border)'}`,
                  background: val ? 'var(--glass-3)' : 'transparent',
                  transition: 'all .15s',
                }}
                onClick={() => setValue(field.id, !val)}
              >
                <div style={{
                  width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${val ? 'var(--cyan)' : 'var(--cyan-border)'}`,
                  background: val ? 'var(--cyan)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  {val && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L4 7L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '.88rem', color: val ? 'var(--t1)' : 'var(--t2)' }}>
                  {field.label}
                </span>
                {field.required && <span style={{ color: 'var(--cyan)', marginLeft: 'auto', fontSize: '.75rem' }}>*</span>}
              </div>
            )}

            {/* Select */}
            {field.type === 'select' && (
              <select
                className={`select ${hasErr ? 'err' : ''}`}
                value={val}
                onChange={e => setValue(field.id, e.target.value)}
              >
                <option value="">Selecione {field.label.toLowerCase()}...</option>
                {(field.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {/* Number */}
            {field.type === 'number' && (
              <input
                type="number"
                className={`input ${hasErr ? 'err' : ''}`}
                placeholder={field.placeholder || '0'}
                value={val}
                onChange={e => setValue(field.id, e.target.value)}
              />
            )}

            {/* Date */}
            {field.type === 'date' && (
              <input
                type="date"
                className={`input ${hasErr ? 'err' : ''}`}
                value={val}
                onChange={e => setValue(field.id, e.target.value)}
              />
            )}
            
            {/* Boolean (Sim/Não) */}
            {field.type === 'boolean' && (
              <div style={{display:'flex', gap:6}}>
                {[
                  { v:true,  l:'Sim', c:'var(--green)', bg:'var(--green-bg)', b:'rgba(0,255,163,.2)' },
                  { v:false, l:'Não', c:'var(--red)',   bg:'var(--red-bg)',   b:'rgba(255,77,109,.2)' },
                ].map(opt => {
                  const active = val === opt.v
                  return (
                    <button key={opt.l} onClick={()=>setValue(field.id, opt.v)}
                      style={{
                        flex:1, padding:'8px', borderRadius:8, cursor:'pointer', border:'1px solid',
                        fontSize:'.82rem', fontWeight:600, transition:'all .15s',
                        borderColor: active ? opt.b : 'var(--glass-border)',
                        background:  active ? opt.bg : 'transparent',
                        color:       active ? opt.c  : 'var(--t3)',
                      }}>
                      {opt.l}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Error message */}
            {hasErr && <div className="err-msg">Campo obrigatório</div>}

            {/* Optional photo */}
            {field.hasPhoto && (
              <div>
                <label className="label" style={{ marginBottom: 5, fontSize: '.68rem' }}>
                  Foto — {field.label}
                </label>
                <div
                  style={{
                    width: '100%', aspectRatio: '16/9', maxHeight: 140,
                    background: 'var(--glass-3)',
                    border: `1.5px dashed ${photoVal ? 'var(--cyan-glow)' : 'var(--cyan-border)'}`,
                    borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}
                  onClick={() => fileRefs.current[field.id]?.click()}
                >
                  {photoVal
                    ? <img src={photoVal} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>Clique para adicionar foto</span>
                  }
                </div>
                <input
                  ref={el => fileRefs.current[field.id] = el}
                  type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && handlePhoto(field.id, e.target.files[0])}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
