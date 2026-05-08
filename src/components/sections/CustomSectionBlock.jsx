import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  GripVertical, Trash2, Settings2, ChevronDown, ChevronUp, Pencil, Check, Eye, EyeOff,
  LayoutTemplate, ClipboardList, Wrench, BarChart2, Folder, FileText, Search,
  Lightbulb, Building, Monitor, Smartphone, Globe, Lock, Package, PenTool
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppDispatch } from '../../context/AppContext.jsx'
import { memo } from 'react'
import CustomFieldModal from '../modals/CustomFieldModal.jsx'
import { isFieldVisible } from '../../utils/conditionEngine.js'
import OptimizedInput from '../ui/OptimizedInput.jsx'


const ICON_OPTIONS = [
  'LayoutTemplate', 'ClipboardList', 'Wrench', 'Settings2', 'BarChart2', 'Folder',
  'FileText', 'Search', 'Lightbulb', 'Building', 'Monitor',
  'Smartphone', 'Globe', 'Lock', 'Package', 'PenTool'
]

const ICON_MAP = {
  LayoutTemplate, ClipboardList, Wrench, Settings2, BarChart2, Folder,
  FileText, Search, Lightbulb, Building, Monitor,
  Smartphone, Globe, Lock, Package, PenTool
}

const CustomFieldValue = memo(function CustomFieldValue({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
          borderRadius: 10, cursor: 'pointer', userSelect: 'none', border: '1px solid',
          borderColor: value ? 'var(--cyan-dim)' : 'var(--glass-border)',
          background: value ? 'var(--glass-3)' : 'transparent',
          transition: 'all .15s',
        }}
        onClick={() => onChange(!value)}
      >
        <div style={{
          width: 17, height: 17, borderRadius: 5, flexShrink: 0,
          border: `2px solid ${value ? 'var(--cyan)' : 'var(--cyan-border)'}`,
          background: value ? 'var(--cyan)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
        }}>
          {value && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="#05090f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
        <span style={{ fontSize: '.88rem', color: value ? 'var(--t1)' : 'var(--t2)' }}>{field.label}</span>
        {field.required && <span style={{ color: 'var(--cyan)', marginLeft: 'auto', fontSize: '.75rem' }}>*</span>}
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <div className="form-group">
        <label className="label">{field.label}{field.required && <span className="req">*</span>}</label>
        <select className="select" value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Selecione…</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }
  if (field.type === 'textarea') {
    return (
      <div className="form-group">
        <label className="label">{field.label}{field.required && <span className="req">*</span>}</label>
        <OptimizedInput isTextArea className="textarea" placeholder={field.placeholder || ''}
          value={value || ''} onChange={val => onChange(val)} style={{ minHeight: 72 }} />
      </div>
    )
  }
  if (field.type === 'date') {
    return (
      <div className="form-group">
        <label className="label">{field.label}{field.required && <span className="req">*</span>}</label>
        <input type="date" className="input" value={value || ''} onChange={e => onChange(e.target.value)} />
      </div>
    )
  }
  if (field.type === 'boolean') {
    return (
      <div className="form-group">
        <label className="label">{field.label}{field.required && <span className="req">*</span>}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: true, l: 'Sim', c: 'var(--green)', bg: 'var(--green-bg)', b: 'rgba(0,255,163,.2)' },
            { v: false, l: 'Não', c: 'var(--red)', bg: 'var(--red-bg)', b: 'rgba(255,77,109,.2)' },
          ].map(opt => {
            const active = value === opt.v
            return (
              <button key={opt.l} onClick={() => onChange(opt.v)}
                style={{
                  flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer', border: '1px solid',
                  fontSize: '.82rem', fontWeight: 600, transition: 'all .15s',
                  borderColor: active ? opt.b : 'var(--glass-border)',
                  background: active ? opt.bg : 'transparent',
                  color: active ? opt.c : 'var(--t3)',
                }}>
                {opt.l}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  // text / number
  return (
    <div className="form-group">
      <label className="label">{field.label}{field.required && <span className="req">*</span>}</label>
      <OptimizedInput type={field.type === 'number' ? 'number' : 'text'} className="input"
        placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}…`}
        value={value || ''} onChange={val => onChange(val)} />
    </div>
  )
})

const CustomSectionBlock = memo(function CustomSectionBlock({ section }) {
  const { updCustomSection, delCustomSection, setSectionValue } = useAppDispatch()
  const [cfOpen, setCfOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [editTitle, setEditTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(section.title)
  const [emojiPicker, setEmojiPicker] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
  const pickerBtnRef = useRef(null)

  const togglePicker = () => {
    if (!emojiPicker && pickerBtnRef.current) {
      const rect = pickerBtnRef.current.getBoundingClientRect()
      // Position below the button
      setPickerPos({ 
        top: rect.bottom + window.scrollY + 6, 
        left: rect.left + window.scrollX 
      })
    }
    setEmojiPicker(v => !v)
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  }

  const handleSaveTitle = () => {
    if (titleDraft.trim()) updCustomSection(section.id, { title: titleDraft.trim() })
    setEditTitle(false)
  }

  const handleDelete = () => {
    if (window.confirm(`Remover seção "${section.title}"? Os dados preenchidos serão perdidos.`))
      delCustomSection(section.id)
  }

  return (
    <>
      <div ref={setNodeRef} style={{ ...dndStyle, marginBottom: 14 }}>
        <div className="card sec-card">
          {/* Header */}
          <div className="sec-head" style={{ gap: 10 }}>
            {/* Drag handle */}
            <div
              className="drag-handle"
              {...attributes} {...listeners}
              title="Arrastar para reordenar"
              style={{ cursor: 'grab', color: 'var(--t3)', display: 'flex', flexShrink: 0 }}
            >
              <GripVertical size={17} />
            </div>

            {/* Emoji picker */}
            <div style={{ flexShrink: 0 }}>
              <button
                ref={pickerBtnRef}
                onClick={togglePicker}
                style={{
                  background: 'var(--glass-1)', border: '1px solid var(--glass-border)',
                  borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: '1.1rem',
                  lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 38, minHeight: 38
                }}
              >
                {(() => {
                  const IconComponent = ICON_MAP[section.icon]
                  return IconComponent ? <IconComponent size={18} color="var(--cyan)" /> : (section.icon || '📋')
                })()}
              </button>
              {emojiPicker && createPortal(
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1999 }} onClick={() => setEmojiPicker(false)} />
                  <div style={{
                    position: 'absolute', 
                    top: pickerPos.top, 
                    left: Math.min(pickerPos.left, window.innerWidth - 200), 
                    zIndex: 2000,
                    background: 'var(--dropdown-bg)', border: '1px solid var(--dropdown-border)',
                    borderRadius: 12, padding: 10,
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4,
                    boxShadow: '0 8px 30px rgba(0,0,0,.3)', width: 180,
                    animation: 'slideUp .2s var(--spring)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  }}>
                    {ICON_OPTIONS.map(iconName => {
                      const IconComp = ICON_MAP[iconName]
                      return (
                        <button key={iconName} onClick={() => { updCustomSection(section.id, { icon: iconName }); setEmojiPicker(false) }}
                          style={{
                            background: section.icon === iconName ? 'var(--glass-3)' : 'transparent',
                            border: '1px solid',
                            borderColor: section.icon === iconName ? 'var(--cyan-border)' : 'transparent',
                            borderRadius: 7, padding: '8px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .1s', color: 'var(--cyan)'
                          }}>
                          <IconComp size={18} />
                        </button>
                      )
                    })}
                  </div>
                </>,
                document.body
              )}
            </div>

            {/* Title (editable) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editTitle ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    className="input"
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditTitle(false) }}
                    autoFocus
                    style={{ padding: '4px 10px', fontSize: '.9rem', height: 'auto' }}
                  />
                  <button className="btn btn-primary btn-icon" onClick={handleSaveTitle} style={{ width: 28, height: 28 }}>
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="sec-title" style={{ flex: 1 }}>{section.title}</span>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setTitleDraft(section.title); setEditTitle(true) }}
                    style={{ width: 26, height: 26, flexShrink: 0 }} title="Renomear">
                    <Pencil size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <button className="btn btn-ghost btn-icon" title={section.showInPdf ? 'Exibir no PDF: Ligado' : 'Exibir no PDF: Desligado'}
                onClick={() => updCustomSection(section.id, { showInPdf: !section.showInPdf })} style={{ width: 28, height: 28 }}>
                {section.showInPdf ? <Eye size={13} color="var(--cyan)" /> : <EyeOff size={13} color="var(--t3)" />}
              </button>
              <button className="btn btn-ghost btn-icon" title="Configurar campos"
                onClick={() => setCfOpen(true)} style={{ width: 28, height: 28 }}>
                <Settings2 size={13} color="var(--cyan)" />
              </button>
              <button className="btn btn-ghost btn-icon" title={collapsed ? 'Expandir' : 'Recolher'}
                onClick={() => setCollapsed(v => !v)} style={{ width: 28, height: 28 }}>
                {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </button>
              <button className="btn btn-danger btn-icon" onClick={handleDelete}
                style={{ width: 28, height: 28 }} title="Remover seção">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Body */}
          {!collapsed && (
            <div className="sec-body">
              {(!section.fields || section.fields.length === 0) ? (
                <div style={{
                  textAlign: 'center', padding: '18px 0', color: 'var(--t3)',
                  border: '1px dashed var(--glass-border)', borderRadius: 10,
                }}>
                  <Settings2 size={24} style={{ opacity: .25, marginBottom: 6 }} />
                  <div style={{ fontSize: '.8rem' }}>Nenhum campo nesta seção.</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCfOpen(true)}
                    style={{ marginTop: 8, gap: 5, color: 'var(--cyan)' }}>
                    <Settings2 size={12} /> Adicionar campos
                  </button>
                </div>
              ) : (
                section.fields.map(field => {
                  if (!isFieldVisible(field, section.values || {})) return null
                  return (
                    <CustomFieldValue
                      key={field.id}
                      field={field}
                      value={(section.values || {})[field.id]}
                      onChange={val => setSectionValue(section.id, field.id, val)}
                    />
                  )
                })
              )}

              <button className="btn btn-ghost btn-sm" onClick={() => setCfOpen(true)}
                style={{ gap: 5, alignSelf: 'flex-start', fontSize: '.72rem', marginTop: 2 }}>
                <Settings2 size={12} color="var(--cyan)" />
                <span style={{ color: 'var(--cyan)' }}>+ Campo personalizado</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {cfOpen && (
        <CustomFieldModal
          sectionId={section.id}
          onClose={() => setCfOpen(false)}
        />
      )}
    </>
  )
})

export default CustomSectionBlock
