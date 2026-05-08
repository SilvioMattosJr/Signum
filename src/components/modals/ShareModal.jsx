import { useState } from 'react'
import { X, Link2, Check, Download, Upload, AlertCircle, ExternalLink } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { buildShareUrl, copyToClipboard } from '../../utils/shareLink.js'

export default function ShareModal({ onClose }) {
  const { state, loadShare } = useApp()
  const [copied,   setCopied]   = useState(false)
  const [importing, setImporting] = useState(false)
  const [importText, setImportText] = useState('')
  const [importErr, setImportErr] = useState('')
  const [tab, setTab] = useState('share') // 'share' | 'import'

  const url = buildShareUrl(state)

  const handleCopy = async () => {
    const ok = await copyToClipboard(url)
    if (ok) { setCopied(true); setTimeout(()=>setCopied(false), 2500) }
  }

  const handleImport = () => {
    setImportErr('')
    try {
      // Parse from pasted URL or raw JSON
      let data = null
      const trimmed = importText.trim()

      if (trimmed.startsWith('http')) {
        // It's a URL — extract the param
        const u = new URL(trimmed)
        const encoded = u.searchParams.get('sig')
        if (!encoded) throw new Error('Parâmetro "sig" não encontrado na URL.')
        data = JSON.parse(decodeURIComponent(atob(encoded)))
      } else if (trimmed.startsWith('{')) {
        // Raw JSON
        data = JSON.parse(trimmed)
      } else {
        // Try as raw base64
        data = JSON.parse(decodeURIComponent(atob(trimmed)))
      }

      if (!data?.v) throw new Error('Formato inválido — versão não reconhecida.')

      loadShare({
        companyName:      data.companyName      || '',
        serviceDate:      data.serviceDate       || new Date().toISOString().split('T')[0],
        openMilvus:       data.openMilvus        || false,
        startService:     data.startService      || false,
        trainHelpdesk:    data.trainHelpdesk     || false,
        trainMaintenance: data.trainMaintenance  || false,
        trainUpdates:     data.trainUpdates      || false,
        writeReport:      data.writeReport       || false,
        collectClientSig: data.collectClientSig  || false,
        collectTechSig:   data.collectTechSig    || false,
        closeCall:        data.closeCall         || false,
        checkSatisfaction:data.checkSatisfaction || false,
        observations:     data.observations      || '',
        clientName:       data.clientName        || '',
        technicians:      data.technicians?.length ? data.technicians : [{id:`tech-import`,name:'',signature:null}],
        customFields:     data.customFields      || [],
        customFieldValues:data.customFieldValues || {},
        machines:         (data.machines||[]).map(m=>({...m, photos:[]})),
        infrastructures:  (data.infrastructures||[]).map(i=>({...i, photos:[]})),
        pdfMargins:       data.pdfMargins        || {top:18,bottom:18,left:18,right:18},
      })
      onClose()
    } catch(e) {
      setImportErr(e.message || 'Falha ao importar. Verifique o link ou JSON.')
    }
  }

  const TabBtn = ({id, label}) => (
    <button
      onClick={()=>setTab(id)}
      style={{
        flex:1, padding:'8px 0', fontFamily:'var(--font)', fontSize:'.845rem', fontWeight:600,
        border:'none', borderBottom:`2px solid ${tab===id?'var(--cyan)':'transparent'}`,
        background:'transparent', color:tab===id?'var(--cyan)':'var(--t3)',
        cursor:'pointer', transition:'all .15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            <Link2 size={17} color="var(--cyan)"/>
            Compartilhar / Importar
          </div>
          <button className="btn btn-ghost btn-icon hide-on-mobile" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid var(--glass-border)', padding:'0 22px'}}>
          <TabBtn id="share"  label="📤 Compartilhar link"/>
          <TabBtn id="import" label="📥 Importar link"/>
        </div>

        <div className="modal-body">
          {tab==='share' && (
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div className="warn-card">
                <ExternalLink size={15} color="var(--cyan)"/>
                <div style={{fontSize:'.8rem'}}>
                  Gera um link com todos os campos preenchidos (exceto fotos e assinaturas — pesadas demais para URL).
                  Quem abrir o link com a ferramenta terá o formulário preenchido automaticamente.
                </div>
              </div>

              <div>
                <label className="label" style={{marginBottom:6}}>Link gerado</label>
                <div style={{
                  padding:'10px 13px', background:'var(--glass-1)',
                  border:'1px solid var(--glass-border)', borderRadius:'var(--r-md)',
                  fontSize:'.75rem', fontFamily:'var(--mono)', color:'var(--t2)',
                  wordBreak:'break-all', lineHeight:1.5, maxHeight:90, overflow:'auto',
                }}>
                  {url}
                </div>
              </div>

              <div style={{display:'flex', gap:8}}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleCopy}
                  style={{flex:1, gap:5, justifyContent:'center'}}
                >
                  {copied ? <><Check size={13}/> Copiado!</> : <><Link2 size={13}/> Copiar link</>}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.open(url,'_blank')}
                  style={{gap:5}}
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={13}/>
                </button>
              </div>

              <div style={{fontSize:'.75rem', color:'var(--t3)', lineHeight:1.5}}>
                💡 <strong style={{color:'var(--t2)'}}>Dica:</strong> Para compartilhar o relatório completo (com fotos),
                use a exportação <strong style={{color:'var(--t2)'}}>JSON</strong> no modal de geração de relatório.
              </div>
            </div>
          )}

          {tab==='import' && (
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div className="warn-card">
                <Download size={15} color="var(--cyan)"/>
                <div style={{fontSize:'.8rem'}}>
                  Cole um link compartilhado ou um JSON exportado para restaurar o formulário.
                  O formulário atual será substituído.
                </div>
              </div>

              <div>
                <label className="label" style={{marginBottom:6}}>Cole aqui o link ou JSON</label>
                <textarea
                  className="textarea"
                  placeholder="https://... ou cole o conteúdo JSON"
                  value={importText}
                  onChange={e=>{setImportText(e.target.value);setImportErr('')}}
                  style={{minHeight:110, fontFamily:'var(--mono)', fontSize:'.8rem'}}
                />
              </div>

              {importErr && (
                <div style={{
                  display:'flex', alignItems:'flex-start', gap:7,
                  padding:'9px 12px', background:'var(--red-bg)',
                  border:'1px solid rgba(255,77,109,.25)', borderRadius:10,
                  fontSize:'.8rem', color:'var(--red)',
                }}>
                  <AlertCircle size={14} style={{flexShrink:0, marginTop:1}}/>
                  {importErr}
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                onClick={handleImport}
                disabled={!importText.trim()}
                style={{gap:5, justifyContent:'center'}}
              >
                <Upload size={13}/> Importar e carregar
              </button>
            </div>
          )}
        </div>

        <div className="modal-foot hide-on-mobile">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
