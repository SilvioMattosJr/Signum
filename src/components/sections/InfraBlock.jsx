import { useState } from 'react'
import { Camera, Plus, Settings2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { Field, SecCard, SubTitle } from '../ui/index.jsx'
import SortablePhotoList from './SortablePhotoList.jsx'
import CustomFieldRenderer from './CustomFieldRenderer.jsx'
import CustomFieldModal from '../modals/CustomFieldModal.jsx'

export default function InfraBlock({ infra, dragHandleProps }) {
  const { updInfra, delInfra, addPhoto } = useApp()
  const { v } = useValidation()
  const [cfOpen, setCfOpen] = useState(false)
  const id = infra.id
  const e  = k => v.errors[`i_${id}_${k}`] && 'Campo obrigatório'
  const u  = upd => updInfra(id, upd)

  return (
    <>
      <SecCard icon={<Camera size={17}/>} title={`Infraestrutura ${infra.number}`}
        onRemove={()=>window.confirm(`Remover Infraestrutura ${infra.number}?`)&&delInfra(id)}
        dragHandleProps={dragHandleProps}>
        <Field label="Descrição do item" required error={e('desc')}>
          <input className={`input ${e('desc')?'err':''}`} type="text"
            placeholder="Ex: Roteador, Câmera, Modem, Switch…"
            value={infra.description} onChange={ev=>u({description:ev.target.value})}/>
        </Field>
        <Field label="Localização" required error={e('loc')}>
          <input className={`input ${e('loc')?'err':''}`} type="text"
            placeholder="Onde está instalado este item"
            value={infra.location} onChange={ev=>u({location:ev.target.value})}/>
        </Field>
        <Field label="Observações" required error={e('obs')}>
          <textarea className={`textarea ${e('obs')?'err':''}`}
            placeholder="Anotações sobre este item de infraestrutura…"
            value={infra.observations} onChange={ev=>u({observations:ev.target.value})}/>
        </Field>

        <CustomFieldRenderer section="infra" itemType="infra" itemId={id}/>
        <button className="btn btn-ghost btn-sm" onClick={()=>setCfOpen(true)}
          style={{gap:5,alignSelf:'flex-start',fontSize:'.72rem'}}>
          <Settings2 size={12} color="var(--cyan)"/>
          <span style={{color:'var(--cyan)'}}>+ Campo personalizado</span>
        </button>

        <SubTitle icon={<Plus size={12}/>}>Documentação Fotográfica</SubTitle>
        <SortablePhotoList photos={infra.photos} itemType="infra" itemId={id}/>
        <button className="btn btn-secondary btn-sm" onClick={()=>addPhoto('infra',id)}
          style={{width:'100%',justifyContent:'center',padding:10}}>
          <Plus size={13}/> Adicionar Foto
        </button>
      </SecCard>

      {cfOpen && <CustomFieldModal section="infra" onClose={()=>setCfOpen(false)}/>}
    </>
  )
}
