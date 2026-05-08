import { useState } from 'react'
import {
  FileText, Download, Copy, X, Upload, CheckCircle,
  File, Code, Settings2, RotateCcw, Printer, Link2, QrCode,
} from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { DEFAULT_MARGINS } from '../../context/AppContext.jsx'
import { buildReportText, exportPDF, exportTXT, exportJSON } from '../../utils/pdfGenerator.js'
import { buildShareUrl, copyToClipboard } from '../../utils/shareLink.js'
import { useThemeCtx } from '../../context/ThemeContext.jsx'

// ── Template formats accepted ────────────────────────────────────────────────
const TEMPLATE_ACCEPT = [
  'image/jpeg','image/png','image/webp','image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',') + ',.doc,.docx'

function typeLabel(type) {
  if (type==='pdf') return '📄 PDF'
  if (type==='doc') return '📝 DOC/DOCX'
  return '🖼️ Imagem'
}
function detectType(file) {
  const n=file.name.toLowerCase()
  if(file.type==='application/pdf'||n.endsWith('.pdf')) return 'pdf'
  if(file.type==='application/msword'||
     file.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'||
     n.endsWith('.doc')||n.endsWith('.docx')) return 'doc'
  return 'image'
}

// ── Margin field ─────────────────────────────────────────────────────────────
function MarginField({ label, value, onChange }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5,flex:1,minWidth:60}}>
      <label style={{fontSize:'.68rem',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',textAlign:'center'}}>
        {label}
      </label>
      <div style={{position:'relative'}}>
        <input type="number" min="0" max="50" step="0.5" value={value}
          onChange={e=>onChange(parseFloat(e.target.value)||0)}
          style={{
            width:'100%',padding:'8px 28px 8px 10px',
            fontFamily:'var(--mono)',fontSize:'.88rem',fontWeight:700,
            color:'var(--cyan)',textAlign:'center',
            background:'var(--glass-3)',border:'1px solid var(--cyan-border)',
            borderRadius:'var(--r-md)',outline:'none',transition:'all .18s var(--ease)',
            appearance:'textfield',
          }}
          onFocus={e=>Object.assign(e.target.style,{borderColor:'var(--cyan-border-strong)',boxShadow:'0 0 0 3px var(--cyan-dim)'})}
          onBlur={e=>Object.assign(e.target.style,{borderColor:'var(--cyan-border)',boxShadow:'none'})}
        />
        <span style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:'.62rem',color:'var(--t3)',fontWeight:600,pointerEvents:'none'}}>mm</span>
      </div>
    </div>
  )
}

// ── Margins panel ────────────────────────────────────────────────────────────
function MarginsPanel() {
  const { state, setMargins } = useApp()
  const m = state.pdfMargins || DEFAULT_MARGINS
  const upd = (k,v) => setMargins({[k]:v})
  const reset = () => setMargins({...DEFAULT_MARGINS})
  return (
    <div style={{background:'var(--glass-2)',border:'1px solid var(--cyan-dim)',borderRadius:'var(--r-lg)',padding:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:7}}>
          <Settings2 size={14} color="var(--cyan)"/>
          <span style={{fontSize:'.78rem',fontWeight:700,color:'var(--t2)',textTransform:'uppercase',letterSpacing:'.07em'}}>Margens do PDF</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reset} style={{gap:5,fontSize:'.72rem',padding:'4px 9px'}}>
          <RotateCcw size={11}/> Padrão
        </button>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginBottom:14}}>
        <MarginField label="Início (Topo)" value={m.top} onChange={v=>upd('top',v)}/>
        <div style={{display:'flex',alignItems:'center',gap:10,width:'100%'}}>
          <MarginField label="Esquerda" value={m.left} onChange={v=>upd('left',v)}/>
          <div style={{flex:0,width:48,height:62,background:'rgba(12,26,48,.8)',border:'1px solid var(--cyan-dim)',borderRadius:4,position:'relative',flexShrink:0}}>
            <div style={{position:'absolute',top:`${(m.top/297)*100}%`,bottom:`${(m.bottom/297)*100}%`,left:`${(m.left/210)*100}%`,right:`${(m.right/210)*100}%`,background:'var(--cyan-dim)',border:'1px solid var(--cyan-glow)',borderRadius:1,minHeight:4,minWidth:4}}/>
          </div>
          <MarginField label="Direita" value={m.right} onChange={v=>upd('right',v)}/>
        </div>
        <MarginField label="Fim (Rodapé)" value={m.bottom} onChange={v=>upd('bottom',v)}/>
      </div>
      <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap'}}>
        {[
          {label:'Carta (25mm)', v:{top:25,bottom:25,left:25,right:25}},
          {label:'Estreito (12mm)', v:{top:12,bottom:12,left:12,right:12}},
          {label:'ABNT (30/20)', v:{top:30,bottom:20,left:30,right:20}},
          {label:'Modelo imagem', v:{top:14.17,bottom:14.17,left:9.82,right:9.82}},
        ].map(({label,v})=>(
          <button key={label} className="btn btn-ghost btn-sm" onClick={()=>setMargins(v)}
            style={{fontSize:'.68rem',padding:'3px 9px',color:'var(--t3)'}}>{label}</button>
        ))}
      </div>
    </div>
  )
}

// ── QR Code generator ────────────────────────────────────────────────────────
async function generateQRDataUrl(text) {
  if (!window.QRCode) {
    await new Promise((res, rej) => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
      s.onload = res; s.onerror = rej
      document.head.appendChild(s)
    })
  }
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;top:-9999px;left:-9999px'
  document.body.appendChild(div)
  return new Promise(res => {
    new window.QRCode(div, {
      text, width:200, height:200,
      colorDark:'#000000', colorLight:'#ffffff',
      correctLevel: window.QRCode.CorrectLevel.M,
    })
    setTimeout(() => {
      const img = div.querySelector('img') || div.querySelector('canvas')
      const dataUrl = img?.tagName==='CANVAS' ? img.toDataURL() : img?.src || null
      document.body.removeChild(div)
      res(dataUrl)
    }, 300)
  })
}

// ── Print handler ────────────────────────────────────────────────────────────
function handlePrint(reportText) {
  const w = window.open('','_blank','width=900,height=700')
  w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Signum — Relatório</title>
<style>
  @page { margin: 18mm 18mm 14mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #111; background: #fff; }
  pre { white-space: pre-wrap; word-break: break-word; font-family: 'Courier New', monospace; font-size: 10px; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<pre>${reportText.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>
<script>window.onload=()=>{ window.print(); window.onafterprint=()=>window.close(); }<\/script>
</body>
</html>`)
  w.document.close()
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function ReportModal({ onClose }) {
  const { state, setTemplate, saveToHistory } = useApp()
  const { primaryColor } = useThemeCtx()
  const [view,      setView]      = useState('options')
  const [preview,   setPreview]   = useState('')
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [busy,      setBusy]      = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [linkCopied,setLinkCopied]= useState(false)

  const handlePreview = async () => {
    const text = await buildReportText(state)
    setPreview(text)
    // Generate QR for company + date
    const qrText = `Signum | ${state.companyName||'—'} | ${state.serviceDate||new Date().toLocaleDateString('pt-BR')} | ${window.location.origin}`
    try { const url = await generateQRDataUrl(qrText); setQrDataUrl(url) } catch {}
    setView('preview')
  }

  const handlePDF = async () => {
    setBusy(true)
    try { saveToHistory(); await exportPDF(state, qrDataUrl, primaryColor); onClose() }
    catch(e) { console.error(e); alert('Erro ao gerar PDF.') }
    setBusy(false)
  }

  const handleTXT  = () => { saveToHistory(); exportTXT(state);  onClose() }
  const handleJSON = () => { saveToHistory(); exportJSON(state); onClose() }

  const handleCopyText = () => {
    copyToClipboard(preview).then(ok => { if(ok){setCopied(true);setTimeout(()=>setCopied(false),2200)} })
  }

  const handleCopyLink = () => {
    const url = buildShareUrl(state)
    copyToClipboard(url).then(ok => { if(ok){setLinkCopied(true);setTimeout(()=>setLinkCopied(false),2500)} })
  }

  const handleTemplate = e => {
    const file=e.target.files[0]; if(!file) return
    const type=detectType(file)
    const reader=new FileReader()
    reader.onload=ev=>setTemplate({name:file.name,dataUrl:ev.target.result,type})
    reader.readAsDataURL(file)
    e.target.value=''
  }

  const tmpl = state.pdfTemplate
  const photos = state.machines.reduce((s,m)=>s+m.photos.filter(p=>p.dataUrl).length,0)
               + state.infrastructures.reduce((s,i)=>s+i.photos.filter(p=>p.dataUrl).length,0)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:view==='preview'?700:580}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div className="modal-title">
            <FileText size={17} color="var(--cyan)"/>
            {view==='preview' ? 'Prévia do Relatório' : 'Exportar Relatório'}
          </div>
          <button className="btn btn-ghost btn-icon"
            onClick={view==='preview'?()=>setView('options'):onClose}>
            {view==='preview'
              ? <span style={{fontSize:'.78rem',color:'var(--t2)'}}>← Voltar</span>
              : <X size={14}/>}
          </button>
        </div>

        {/* ── Options view ── */}
        {view==='options' && (
          <>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:16}}>
              {/* Info */}
              <div className="warn-card">
                <div className="warn-icon"><FileText size={15}/></div>
                <div>
                  <strong style={{color:'var(--t1)'}}>Relatório para: </strong>
                  <span style={{color:'var(--cyan)',fontWeight:600}}>{state.companyName||'Empresa não informada'}</span>
                  <br/>
                  <span style={{fontSize:'.77rem'}}>
                    {state.machines.length} máquina(s) · {state.infrastructures.length} infra(s) · {photos} foto(s) · {state.technicians?.length||0} técnico(s)
                  </span>
                </div>
              </div>

              {/* Margins */}
              <MarginsPanel/>

              {/* Template upload */}
              <div>
                <div className="label" style={{marginBottom:8}}>
                  Modelo de PDF <span style={{color:'var(--t3)',fontWeight:400,textTransform:'none',letterSpacing:0}}>(opcional)</span>
                </div>
                <label className={`template-drop ${tmpl?'has-file':''}`} style={{display:'block'}}>
                  <input type="file" accept={TEMPLATE_ACCEPT} style={{display:'none'}} onChange={handleTemplate}/>
                  {tmpl ? (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5}}>
                      <CheckCircle size={26} color="var(--green)"/>
                      <div style={{fontSize:'.855rem',color:'var(--green)',fontWeight:600}}>{tmpl.name}</div>
                      <div style={{fontSize:'.72rem',color:'var(--t3)'}}>{typeLabel(tmpl.type)} · Clique para trocar</div>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
                      <Upload size={26} color="var(--cyan-glow)"/>
                      <div style={{fontSize:'.875rem',color:'var(--t2)',fontWeight:500}}>Escolher arquivo de modelo</div>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center'}}>
                        {[{icon:'🖼️',label:'JPG/PNG/WEBP'},{icon:'📄',label:'PDF'},{icon:'📝',label:'DOC/DOCX'}].map(({icon,label})=>(
                          <span key={label} style={{fontSize:'.6rem',fontWeight:600,background:'var(--glass-2)',border:'1px solid var(--cyan-border)',color:'var(--cyan)',padding:'2px 10px',borderRadius:20}}>
                            {icon} {label}
                          </span>
                        ))}
                      </div>
                      <div style={{fontSize:'.72rem',color:'var(--t3)',textAlign:'center'}}>Será usado como fundo do relatório gerado</div>
                    </div>
                  )}
                </label>
                {tmpl && (
                  <button className="btn btn-ghost btn-sm" onClick={()=>setTemplate(null)}
                    style={{marginTop:6,width:'100%',justifyContent:'center',gap:5}}>
                    <X size={11}/> Remover modelo
                  </button>
                )}
                {tmpl?.type==='doc' && (
                  <div style={{marginTop:8,padding:'9px 13px',background:'var(--amber-bg)',border:'1px solid rgba(255,184,48,.22)',borderRadius:10,fontSize:'.75rem',color:'var(--amber)',lineHeight:1.5}}>
                    ⚠️ Arquivos .doc/.docx são renderizados como imagem. Para máxima fidelidade, prefira PDF ou imagem.
                  </div>
                )}
              </div>

              {/* Share link */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="btn btn-secondary btn-sm" onClick={handleCopyLink} style={{gap:5,flex:1,justifyContent:'center'}}>
                  {linkCopied?<><CheckCircle size={12} color="var(--green)"/>Link copiado!</>:<><Link2 size={12}/>Copiar link de compartilhamento</>}
                </button>
              </div>
            </div>

            <div className="modal-foot" style={{flexWrap:'wrap'}}>
              <button className="btn btn-secondary btn-sm" onClick={handlePreview} style={{gap:5}}>
                <File size={13}/> Prévia + QR
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleJSON} style={{gap:5}}>
                <Code size={13}/> JSON
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleTXT} style={{gap:5}}>
                <Download size={13}/> TXT
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePDF} disabled={busy} style={{gap:5}}>
                <FileText size={13}/>{busy?'Gerando…':'Salvar PDF'}
              </button>
            </div>
          </>
        )}

        {/* ── Preview view ── */}
        {view==='preview' && (
          <>
            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:14}}>
              {/* QR Code */}
              {qrDataUrl && (
                <div style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',background:'var(--glass-3)',border:'1px solid var(--cyan-border)',borderRadius:12}}>
                  <img src={qrDataUrl} alt="QR Code" style={{width:72,height:72,borderRadius:6,border:'2px solid var(--cyan-border)',background:'#fff',padding:3}}/>
                  <div>
                    <div style={{fontSize:'.82rem',fontWeight:700,color:'var(--t1)',marginBottom:3}}>QR Code do atendimento</div>
                    <div style={{fontSize:'.75rem',color:'var(--t2)',lineHeight:1.4}}>
                      Será incluído no PDF. Contém empresa, data e link da ferramenta.
                    </div>
                  </div>
                </div>
              )}
              <pre className="report-pre">{preview}</pre>
            </div>
            <div className="modal-foot" style={{flexWrap:'wrap'}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>handlePrint(preview)} style={{gap:5}}>
                <Printer size={13}/> Imprimir
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleCopyText} style={{gap:5}}>
                {copied?<><CheckCircle size={13} color="var(--green)"/>Copiado!</>:<><Copy size={13}/>Copiar</>}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleTXT} style={{gap:5}}>
                <Download size={13}/> TXT
              </button>
              <button className="btn btn-primary btn-sm" onClick={handlePDF} disabled={busy} style={{gap:5}}>
                <FileText size={13}/>{busy?'Gerando…':'PDF'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
