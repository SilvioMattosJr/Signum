import { useState, memo } from 'react'
import { MonitorSmartphone, Settings, Plus, Settings2 } from 'lucide-react'
import { useAppDispatch } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { CheckRow, Field, RadioGroup, SecCard, SubTitle, OptimizedInput } from '../ui/index.jsx'
import SortablePhotoList from './SortablePhotoList.jsx'
import CustomFieldRenderer from './CustomFieldRenderer.jsx'
import CustomFieldModal from '../modals/CustomFieldModal.jsx'

const PROCESSES = [
  {k:'checkUpdates',  l:'Verificar Windows Update'},
  {k:'checkPrograms', l:'Verificar programas instalados'},
  {k:'installMilvus', l:'Instalar Milvus'},
  {k:'updateBrowsers',l:'Atualizar Navegadores'},
  {k:'installOffice', l:'Verificar/Instalar Pacote Office'},
  {k:'installAdobe',  l:'Instalar Adobe Reader'},
  {k:'installWinrar', l:'Instalar WinRAR'},
  {k:'runAida',       l:'Passar o AIDA'},
]

const MachineBlock = memo(function MachineBlock({ machine, dragHandleProps }) {
  const { updMachine, delMachine, addPhoto } = useAppDispatch()
  const { v } = useValidation()
  const [cfOpen, setCfOpen] = useState(false)
  const id = machine.id
  const e  = k => v.errors[`m_${id}_${k}`] && 'Campo obrigatório'
  const u  = upd => updMachine(id, upd)

  return (
    <>
      <SecCard icon={<MonitorSmartphone size={17}/>} title={`Máquina ${machine.number}`}
        onRemove={() => window.confirm(`Remover Máquina ${machine.number}?`) && delMachine(id)}
        dragHandleProps={dragHandleProps}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:11, className:"machine-grid-2"}}>
          <Field label="Nome da máquina" required error={e('name')} style={{gridColumn:'1/-1'}}>
            <OptimizedInput className={`input ${e('name')?'err':''}`} placeholder="Ex: Desktop Recepção"
              value={machine.name} onChange={val=>u({name:val})}/>
          </Field>
          <Field label="Sistema operacional" required error={e('os')}>
            <OptimizedInput className={`input ${e('os')?'err':''}`} placeholder="Ex: Windows 11 Pro"
              value={machine.os} onChange={val=>u({os:val})}/>
          </Field>
          <Field label="Armazenamento" required error={e('storage')}>
            <OptimizedInput className={`input ${e('storage')?'err':''}`} placeholder="Ex: SSD 480GB"
              value={machine.storage} onChange={val=>u({storage:val})}/>
          </Field>
          <Field label="Memória RAM" required error={e('ram')}>
            <OptimizedInput className={`input ${e('ram')?'err':''}`} placeholder="Ex: 8GB DDR4"
              value={machine.ram} onChange={val=>u({ram:val})}/>
          </Field>
          <Field label="ID do AnyDesk" required error={e('anydesk')}>
            <OptimizedInput className={`input ${e('anydesk')?'err':''}`} placeholder="Ex: 123 456 789"
              value={machine.anydesk} onChange={val=>u({anydesk:val})}/>
          </Field>
        </div>

        <div style={{background:'rgba(255,255,255,.02)',border:'1px solid var(--glass-border)',borderRadius:'var(--r-md)',padding:13}}>
          <RadioGroup label="Windows está ativado"
            value={machine.windowsActivated===null?'':machine.windowsActivated?'sim':'nao'}
            onChange={val=>u({windowsActivated:val==='sim'})}
            options={[{value:'sim',label:'Sim'},{value:'nao',label:'Não'}]}/>
        </div>

        {machine.windowsActivated===false && (
          <div className="win-panel">
            <div style={{fontSize:'.78rem',fontWeight:700,color:'var(--amber)',marginBottom:4}}>⚠️ Procedimento de ativação</div>
            <CheckRow checked={machine.useWindowsMas} onChange={()=>u({useWindowsMas:!machine.useWindowsMas})} label="Utilizar MAS_1.0_CRC32_1D90323C.cmd"/>
            <CheckRow checked={machine.useWindowsCmd} onChange={()=>u({useWindowsCmd:!machine.useWindowsCmd})} label="Executar: irm https://get.activated.win | iex"/>
          </div>
        )}

        <hr className="divider"/>
        <SubTitle icon={<Settings size={12}/>}>Processos de Manutenção</SubTitle>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:3}}>
          {PROCESSES.map(({k,l})=>(
            <CheckRow key={k} checked={machine[k]} onChange={()=>u({[k]:!machine[k]})} label={l}/>
          ))}
        </div>

        <Field label="Observações da máquina" required error={e('obs')}>
          <OptimizedInput isTextArea className={`textarea ${e('obs')?'err':''}`}
            placeholder="Registre observações técnicas específicas desta máquina…"
            value={machine.observations} onChange={val=>u({observations:val})}/>
        </Field>

        {/* Custom fields for machine section */}
        <CustomFieldRenderer section="machine" itemType="machine" itemId={id}/>
        <button className="btn btn-ghost btn-sm" onClick={()=>setCfOpen(true)}
          style={{gap:5,alignSelf:'flex-start',fontSize:'.72rem'}}>
          <Settings2 size={12} color="var(--cyan)"/>
          <span style={{color:'var(--cyan)'}}>+ Campo personalizado</span>
        </button>

        <hr className="divider"/>
        <SubTitle icon={<Plus size={12}/>}>Documentação Fotográfica</SubTitle>
        <SortablePhotoList photos={machine.photos} itemType="machine" itemId={id}/>
        <button className="btn btn-secondary btn-sm" onClick={()=>addPhoto('machine',id)}
          style={{width:'100%',justifyContent:'center',padding:10}}>
          <Plus size={13}/> Adicionar Foto
        </button>
      </SecCard>

      {cfOpen && <CustomFieldModal section="machine" onClose={()=>setCfOpen(false)}/>}
    </>
  )
})

export default MachineBlock
