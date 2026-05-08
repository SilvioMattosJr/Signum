import { useState, useRef } from 'react'
import { X, Download, Upload, CheckCircle, AlertCircle, FileJson, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useThemeCtx } from '../../context/ThemeContext.jsx'
import { exportTemplate, parseTemplateFile } from '../../utils/templateManager.js'

export default function TemplateModal({ onClose }) {
  const { state, loadTemplate } = useApp()
  const { primaryColor, updatePrimaryColor } = useThemeCtx()
  const [tab,       setTab]       = useState('export')  // 'export' | 'import'
  const [tmplName,  setTmplName]  = useState('Meu Modelo')
  const [importing, setImporting] = useState(false)
  const [imported,  setImported]  = useState(null)
  const [importErr, setImportErr] = useState('')
  const [done,      setDone]      = useState(false)
  const [colorChoice, setColorChoice] = useState('keep') // 'keep' | 'apply'
  const fileRef = useRef(null)

  const cfCount  = state.customFields?.length || 0
  const csCount  = state.customSections?.length || 0
  const hasStructure = cfCount > 0 || csCount > 0

  const handleExport = () => {
    exportTemplate(state, tmplName, primaryColor)
    setDone(true)
    setTimeout(() => setDone(false), 2500)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportErr('')
    setImporting(true)
    const result = await parseTemplateFile(file)
    setImporting(false)
    if (!result.ok) {
      setImportErr(result.error)
      return
    }
    setImported(result.template)
    if (result.template.primaryColor && result.template.primaryColor !== primaryColor) {
      setColorChoice('apply')
    } else {
      setColorChoice('keep')
    }
  }

  const handleConfirmImport = () => {
    if (!imported) return
    if (!window.confirm(
      `Carregar modelo "${imported.name}"?\n\nIsso substituirá os campos personalizados e seções atuais. Os dados preenchidos serão mantidos, mas pode haver incompatibilidade.`
    )) return

    if (colorChoice === 'apply' && imported.primaryColor) {
      updatePrimaryColor(imported.primaryColor)
    }

    loadTemplate(imported)
    onClose()
  }

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      flex:1, padding:'8px 0', fontFamily:'var(--font)', fontSize:'.845rem', fontWeight:600,
      border:'none', borderBottom:`2px solid ${tab===id?'var(--cyan)':'transparent'}`,
      background:'transparent', color:tab===id?'var(--cyan)':'var(--t3)',
      cursor:'pointer', transition:'all .15s',
    }}>{label}</button>
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <FileJson size={17} color="var(--cyan)"/>
            Modelos de Formulário
          </div>
          <button className="btn btn-ghost btn-icon hide-on-mobile" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid var(--glass-border)', padding:'0 22px', flexShrink: 0}}>
          <TabBtn id="export" label="📤 Exportar modelo"/>
          <TabBtn id="import" label="📥 Importar modelo"/>
        </div>

        <div className="modal-body">

          {/* ── Export tab ── */}
          {tab === 'export' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div className="warn-card">
                <FileJson size={15} color="var(--cyan)"/>
                <div style={{fontSize:'.8rem'}}>
                  Exporta a <strong style={{color:'var(--t1)'}}>estrutura</strong> do formulário:
                  campos personalizados, seções criadas, tipos, opções e regras.{' '}
                  <strong style={{color:'var(--t1)'}}>Não</strong> exporta dados preenchidos.
                </div>
              </div>

              {/* Conteúdo do modelo */}
              <div style={{
                background:'var(--glass-1)', border:'1px solid var(--glass-border)',
                borderRadius:12, padding:14, display:'flex', flexDirection:'column', gap:8,
              }}>
                <div style={{fontSize:'.78rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:2}}>
                  Conteúdo do modelo atual
                </div>
                {[
                  { label:`Campos personalizados em seções fixas`, value: cfCount, ok: cfCount>0 },
                  { label:`Seções personalizadas (com campos)`,   value: csCount, ok: csCount>0 },
                ].map(({ label, value, ok }) => (
                  <div key={label} style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8}}>
                    <span style={{fontSize:'.83rem', color:'var(--t2)', flex:1, lineHeight:1.3}}>{label}</span>
                    <span style={{
                      fontSize:'.83rem', fontWeight:700,
                      color: ok ? 'var(--cyan)' : 'var(--t3)',
                      fontFamily:'var(--mono)', marginTop:2,
                    }}>{value}</span>
                  </div>
                ))}
              </div>

              {!hasStructure && (
                <div style={{
                  padding:'12px 14px', background:'var(--amber-bg)',
                  border:'1px solid rgba(255,184,48,.25)', borderRadius:10,
                  fontSize:'.8rem', color:'var(--amber)',
                }}>
                  ⚠️ Nenhum campo ou seção personalizada encontrada. Crie campos antes de exportar o modelo.
                </div>
              )}

              <div className="form-group">
                <label className="label" style={{marginBottom:5}}>Nome do modelo</label>
                <input className="input" placeholder="Ex: Modelo Empresa ABC"
                  value={tmplName} onChange={e=>setTmplName(e.target.value)}/>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={!hasStructure || !tmplName.trim()}
                style={{gap:7, justifyContent:'center'}}
              >
                {done
                  ? <><CheckCircle size={15} color="var(--green)"/> Exportado!</>
                  : <><Download size={15}/> Exportar modelo (.json)</>
                }
              </button>
            </div>
          )}

          {/* ── Import tab ── */}
          {tab === 'import' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div className="warn-card">
                <Upload size={15} color="var(--cyan)"/>
                <div style={{fontSize:'.8rem'}}>
                  Importe um arquivo <code style={{background:'var(--glass-1)',padding:'1px 5px',borderRadius:4}}>.json</code>{' '}
                  de modelo Signum. A estrutura será restaurada. Os dados que você já preencheu são mantidos.
                </div>
              </div>

              {/* File drop zone */}
              <label style={{
                display:'block', border:'2px dashed var(--cyan-border)',
                borderRadius:14, padding:24, textAlign:'center', cursor:'pointer',
                background: imported ? 'var(--green-bg)' : 'var(--glass-3)',
                borderColor: imported ? 'rgba(0,255,163,.4)' : 'var(--cyan-border)',
                transition:'all .2s',
              }}>
                <input ref={fileRef} type="file" accept=".json,application/json"
                  style={{display:'none'}} onChange={handleFileSelect}/>
                {importing ? (
                  <div style={{color:'var(--cyan)', fontSize:'.875rem'}}>Lendo arquivo…</div>
                ) : imported ? (
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                    <CheckCircle size={28} color="var(--green)"/>
                    <div style={{fontWeight:700, color:'var(--green)', fontSize:'.9rem'}}>{imported.name}</div>
                    <div style={{fontSize:'.75rem', color:'var(--t3)'}}>
                      {imported.customFields?.length||0} campos · {imported.customSections?.length||0} seções ·{' '}
                      criado em {new Date(imported.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{fontSize:'.72rem', color:'var(--t3)', marginTop:2}}>Clique para trocar o arquivo</div>
                  </div>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8}}>
                    <Upload size={28} color="var(--cyan-glow)"/>
                    <div style={{fontSize:'.875rem', color:'var(--t2)', fontWeight:500}}>
                      Clique para escolher arquivo
                    </div>
                    <div style={{fontSize:'.72rem', color:'var(--t3)'}}>
                      Aceita arquivos <strong>.json</strong> exportados pelo Signum
                    </div>
                  </div>
                )}
              </label>

              {importErr && (
                <div style={{
                  display:'flex', gap:7, padding:'10px 13px',
                  background:'var(--red-bg)', border:'1px solid rgba(255,77,109,.25)',
                  borderRadius:10, fontSize:'.8rem', color:'var(--red)',
                }}>
                  <AlertCircle size={14} style={{flexShrink:0, marginTop:1}}/>
                  {importErr}
                </div>
              )}

              {imported && (
                <div style={{
                  background:'var(--glass-1)', border:'1px solid var(--glass-border)',
                  borderRadius:12, padding:14,
                }}>
                  <div style={{fontSize:'.78rem', fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8}}>
                    O que será restaurado
                  </div>
                  {[
                    {label:'Campos em seções fixas',    v:imported.customFields?.length||0},
                    {label:'Seções personalizadas',      v:imported.customSections?.length||0},
                  ].map(({label,v})=>(
                    <div key={label} style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                      <span style={{fontSize:'.83rem', color:'var(--t2)'}}>{label}</span>
                      <span style={{fontSize:'.83rem', color:'var(--cyan)', fontFamily:'var(--mono)', fontWeight:700}}>{v}</span>
                    </div>
                  ))}

                  {/* Color decision */}
                  {imported.primaryColor && (
                    <div style={{marginTop:12, paddingTop:12, borderTop:'1px dashed var(--glass-border)'}}>
                      <div style={{fontSize:'.75rem', fontWeight:600, color:'var(--t3)', marginBottom:8, textTransform:'uppercase'}}>
                        Paleta de cores do modelo
                      </div>
                      <div style={{display:'flex', gap:8}}>
                        <button
                          onClick={() => setColorChoice('keep')}
                          style={{
                            flex:1, padding:'8px', borderRadius:8, border:'1px solid', fontSize:'.75rem', fontWeight:600, cursor:'pointer',
                            borderColor: colorChoice === 'keep' ? 'var(--cyan)' : 'var(--glass-border)',
                            background: colorChoice === 'keep' ? 'var(--glass-3)' : 'transparent',
                            color: colorChoice === 'keep' ? 'var(--cyan)' : 'var(--t2)',
                            transition: 'all .15s'
                          }}
                        >
                          Manter atual
                        </button>
                        <button
                          onClick={() => setColorChoice('apply')}
                          style={{
                            flex:1, padding:'8px', borderRadius:8, border:'1px solid', fontSize:'.75rem', fontWeight:600, cursor:'pointer',
                            borderColor: colorChoice === 'apply' ? (imported.primaryColor) : 'var(--glass-border)',
                            background: colorChoice === 'apply' ? `${imported.primaryColor}1a` : 'transparent',
                            color: colorChoice === 'apply' ? (imported.primaryColor) : 'var(--t2)',
                            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                            transition: 'all .15s'
                          }}
                        >
                          <div style={{width:10, height:10, borderRadius:'50%', background:imported.primaryColor}}/>
                          Aplicar do modelo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-foot">
          {tab === 'import' && imported && (
            <button className="btn btn-primary btn-sm" onClick={handleConfirmImport} style={{gap:5}}>
              <Upload size={13}/> Carregar modelo
            </button>
          )}
          <button className="btn btn-secondary btn-sm hide-on-mobile" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
