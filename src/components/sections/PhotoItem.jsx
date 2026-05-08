import { useRef, useState, useCallback } from 'react'
import { 
  Camera, Trash2, Image, GripVertical, ChevronDown, 
  CheckCircle2, Wrench, AlertCircle, RefreshCw, 
  Download, Settings, Beaker, X
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { compressImage } from '../../utils/imageCompression.js'

const STATUS_OPTS = [
  { value:'operacional', label:'Operacional',     icon: <CheckCircle2 size={14}/> },
  { value:'manutencao',  label:'Em Manutenção',   icon: <Wrench size={14}/> },
  { value:'defeito',     label:'Com Defeito',     icon: <AlertCircle size={14}/> },
  { value:'substituido', label:'Substituído',     icon: <RefreshCw size={14}/> },
  { value:'instalado',   label:'Instalado',       icon: <Download size={14}/> },
  { value:'configurado', label:'Configurado',     icon: <Settings size={14}/> },
  { value:'testado',     label:'Testado',         icon: <Beaker size={14}/> },
]

export default function PhotoItem({ photo, itemType, itemId, index }) {
  const { updPhoto, delPhoto } = useApp()
  const { v } = useValidation()
  const fileRef   = useRef(null)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const [camOpen, setCamOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const statusErr = v.errors[`p_${photo.id}_status`]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({id:photo.id})
  const dndStyle = { transform:CSS.Transform.toString(transform), transition, opacity:isDragging?.5:1, zIndex:isDragging?50:'auto' }

  const loadFile = async (file) => {
    const reader = new FileReader()
    reader.onload = async e => {
      const compressed = await compressImage(e.target.result)
      updPhoto(itemType, itemId, photo.id, { dataUrl: compressed })
    }
    reader.readAsDataURL(file)
  }

  const openCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{width:{ideal:1920},height:{ideal:1080},facingMode:'environment'},
      })
      streamRef.current = stream
      setCamOpen(true)
      setTimeout(()=>{if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play()}},80)
    } catch(e) {
      const msgs={NotAllowedError:'Permissão negada.',NotFoundError:'Câmera não encontrada.'}
      alert(msgs[e.name]||'Erro ao acessar câmera.')
    }
  }

  const closeCam = useCallback(()=>{streamRef.current?.getTracks().forEach(t=>t.stop());setCamOpen(false)},[])

  const capture = () => {
    const vid=videoRef.current; if(!vid) return
    const canvas=document.createElement('canvas')
    canvas.width=vid.videoWidth; canvas.height=vid.videoHeight
    canvas.getContext('2d').drawImage(vid,0,0)
    canvas.toBlob(async blob=>{
      const reader=new FileReader()
      reader.onload=async e=>{
        const compressed=await compressImage(e.target.result)
        updPhoto(itemType,itemId,photo.id,{dataUrl:compressed})
        closeCam()
      }
      reader.readAsDataURL(blob)
    },'image/jpeg',0.92)
  }

  return (
    <>
      <div ref={setNodeRef} style={{
        ...dndStyle, display:'flex', flexDirection:'column', gap:8,
        background:'var(--glass-2)', border:'1.5px solid var(--cyan-border)',
        borderRadius:12, padding:10, minWidth:0,
      }}>
        {/* Top row */}
        <div style={{display:'flex',alignItems:'center',gap:5}}>
          <div className="drag-handle" {...attributes} {...listeners} title="Arrastar" style={{cursor:'grab',color:'var(--t3)',display:'flex',flexShrink:0}}>
            <GripVertical size={13}/>
          </div>
          <span style={{fontSize:'.67rem',color:'var(--t3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',flex:1}}>
            Foto {index+1}
          </span>
          <button onClick={()=>{if(window.confirm('Remover foto?'))delPhoto(itemType,itemId,photo.id)}}
            title="Remover"
            style={{width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,77,109,.12)',border:'1px solid rgba(255,77,109,.28)',borderRadius:6,cursor:'pointer',color:'var(--red)',flexShrink:0,transition:'all .15s'}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,77,109,.22)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,77,109,.12)'}>
            <Trash2 size={11}/>
          </button>
        </div>

        {/* Preview */}
        <div onClick={()=>fileRef.current?.click()} style={{
          width:'100%',aspectRatio:'4/3',background:'var(--glass-3)',
          border:photo.dataUrl?'1.5px solid var(--cyan-border-strong)':'1.5px dashed var(--cyan-border)',
          borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:4,
          cursor:'pointer',overflow:'hidden',position:'relative',transition:'border-color .18s',
        }}>
          {photo.dataUrl?(
            <>
              <img src={photo.dataUrl} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'flex-end',justifyContent:'flex-end',padding:4}}>
                <div onClick={e=>{e.stopPropagation();fileRef.current?.click()}}
                  style={{background:'rgba(0,0,0,.65)',border:'1px solid rgba(255,255,255,.2)',borderRadius:5,padding:'2px 7px',fontSize:'.62rem',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
                  <Image size={9}/> Trocar
                </div>
              </div>
            </>
          ):(
            <>
              <Image size={20} color="var(--cyan-border)"/>
              <span style={{fontSize:'.65rem',color:'var(--t3)',textAlign:'center',lineHeight:1.3}}>Clique para<br/>escolher</span>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>e.target.files[0]&&loadFile(e.target.files[0])}/>

        {/* Camera */}
        <button onClick={openCam} style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:5,padding:'5px 8px',width:'100%',
          background:'var(--glass-1)',border:'1px solid var(--glass-border)',borderRadius:7,cursor:'pointer',
          color:'var(--t2)',fontSize:'.7rem',fontFamily:'var(--font)',fontWeight:500,transition:'all .15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--cyan-border-strong)';e.currentTarget.style.color='var(--t1)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--glass-border)';e.currentTarget.style.color='var(--t2)'}}>
          <Camera size={11}/> Câmera
        </button>

        {/* Caption */}
        <textarea placeholder="Legenda da foto…" value={photo.caption}
          onChange={e=>updPhoto(itemType,itemId,photo.id,{caption:e.target.value})}
          style={{width:'100%',padding:'6px 8px',resize:'none',height:52,fontFamily:'var(--font)',fontSize:'.72rem',color:'var(--t1)',background:'var(--glass-1)',border:'1px solid var(--glass-border)',borderRadius:7,outline:'none',transition:'border-color .15s'}}
          onFocus={e=>e.target.style.borderColor='var(--cyan-border-strong)'}
          onBlur={e=>e.target.style.borderColor='var(--glass-border)'}/>

        {/* Status */}
        <div style={{ position: 'relative' }}>
          <label style={{fontSize:'.62rem',fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em',display:'block',marginBottom:4}}>
            Status <span style={{color:'var(--cyan)'}}>*</span>
          </label>
          
          <button 
            type="button"
            onClick={() => setStatusOpen(v => !v)}
            className={`select ${statusErr ? 'err' : ''}`}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '.75rem', padding: '7px 12px', background: 'var(--glass-1)',
              textAlign: 'left', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {photo.status ? (
                <>
                  <span style={{ color: 'var(--cyan)' }}>
                    {STATUS_OPTS.find(o => o.value === photo.status)?.icon}
                  </span>
                  <span style={{ color: 'var(--t1)' }}>
                    {STATUS_OPTS.find(o => o.value === photo.status)?.label}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--t3)' }}>Selecione o status</span>
              )}
            </div>
            <ChevronDown size={14} style={{ 
              color: 'var(--cyan)', 
              transition: 'transform .2s',
              transform: statusOpen ? 'rotate(180deg)' : 'none'
            }} />
          </button>

          {statusOpen && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 199 }} 
                onClick={() => setStatusOpen(false)} 
              />
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                zIndex: 200, background: 'var(--dropdown-bg)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--dropdown-border)', borderRadius: 12,
                boxShadow: '0 10px 30px rgba(0,0,0,.3)', overflow: 'hidden',
                animation: 'slideUp .2s var(--spring)'
              }}>
                {STATUS_OPTS.map(opt => (
                  <button 
                    key={opt.value}
                    onClick={() => { updPhoto(itemType, itemId, photo.id, { status: opt.value }); setStatusOpen(false) }}
                    style={{
                      width: '100%', padding: '10px 14px', background: 'transparent',
                      border: 'none', borderBottom: '1px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', gap: 10,
                      color: photo.status === opt.value ? 'var(--cyan)' : 'var(--t1)',
                      fontSize: '.8rem', cursor: 'pointer', textAlign: 'left',
                      transition: 'background .15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: 'var(--cyan)', display: 'flex' }}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
          
          {statusErr && <div style={{fontSize:'.65rem',color:'var(--red)',marginTop:3}}>Obrigatório quando há foto</div>}
        </div>
      </div>

      {camOpen && (
        <div className="camera-overlay" onClick={closeCam}>
          <div className="camera-modal" onClick={e=>e.stopPropagation()}>
            <div className="sec-head" style={{padding:'12px 16px'}}>
              <div className="sec-title" style={{fontSize:'.9rem'}}><Camera size={15} color="var(--cyan)"/> Câmera</div>
              <button className="btn btn-secondary btn-sm" onClick={closeCam}>Fechar</button>
            </div>
            <video ref={videoRef} autoPlay playsInline muted/>
            <div style={{padding:14,display:'flex',justifyContent:'center'}}>
              <button className="btn btn-primary" onClick={capture} style={{gap:7}}><Camera size={15}/> Capturar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
