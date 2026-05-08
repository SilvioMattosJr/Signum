import { useState } from 'react'
import { UserCheck, Users, CheckCircle2, FileText, Settings2 } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { CheckRow, Field, SecCard } from '../ui/index.jsx'
import CustomFieldRenderer from './CustomFieldRenderer.jsx'
import CustomFieldModal from '../modals/CustomFieldModal.jsx'

function AddFieldButton({ section }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        style={{ gap:5, alignSelf:'flex-start', marginTop:2, fontSize:'.72rem' }}
      >
        <Settings2 size={12} color="var(--cyan)"/>
        <span style={{color:'var(--cyan)'}}>+ Campo personalizado</span>
      </button>
      {open && <CustomFieldModal section={section} onClose={() => setOpen(false)}/>}
    </>
  )
}

export function ArrivalSection({ dragHandleProps }) {
  const { state, set, toggle } = useApp()
  const { v } = useValidation()
  return (
    <SecCard icon={<UserCheck size={17}/>} title="Ao Chegar no Cliente" dragHandleProps={dragHandleProps}>
      <Field label="Nome da empresa" required error={v.errors.companyName && 'Campo obrigatório'}>
        <input className={`input ${v.errors.companyName?'err':''}`} type="text"
          placeholder="Digite o nome da empresa"
          value={state.companyName} onChange={e => set('companyName', e.target.value)}/>
      </Field>

      <Field label="Data do atendimento">
        <input className="input" type="date"
          value={state.serviceDate || new Date().toISOString().split('T')[0]}
          onChange={e => set('serviceDate', e.target.value)}/>
      </Field>

      <div style={{display:'flex', flexDirection:'column', gap:3}}>
        <CheckRow checked={state.openMilvus} onChange={() => toggle('openMilvus')}
          label="Abrir chamado no Milvus" required invalid={!!v.errors.openMilvus}/>
        <CheckRow checked={state.startService} onChange={() => toggle('startService')}
          label="Iniciar atendimento" required invalid={!!v.errors.startService}/>
      </div>

      <CustomFieldRenderer section="arrival"/>
      <AddFieldButton section="arrival"/>
    </SecCard>
  )
}

export function TrainingSection({ dragHandleProps }) {
  const { state, toggle } = useApp()
  const { v } = useValidation()
  return (
    <SecCard icon={<Users size={17}/>} title="Treinamento" dragHandleProps={dragHandleProps}>
      <div style={{display:'flex', flexDirection:'column', gap:3}}>
        <CheckRow checked={state.trainHelpdesk} onChange={() => toggle('trainHelpdesk')}
          label="Demonstrar como abrir chamado via Client Core Helpdesk" required invalid={!!v.errors.trainHelpdesk}/>
        <CheckRow checked={state.trainMaintenance} onChange={() => toggle('trainMaintenance')}
          label="Explicar procedimentos básicos de manutenção" required invalid={!!v.errors.trainMaintenance}/>
        <CheckRow checked={state.trainUpdates} onChange={() => toggle('trainUpdates')}
          label="Orientar sobre: Sempre manter o sistema atualizado" required invalid={!!v.errors.trainUpdates}/>
      </div>
      <CustomFieldRenderer section="training"/>
      <AddFieldButton section="training"/>
    </SecCard>
  )
}

export function ObservationsSection({ dragHandleProps }) {
  const { state, set } = useApp()
  return (
    <SecCard icon={<FileText size={17}/>} title="Observações Técnicas" dragHandleProps={dragHandleProps}>
      <Field label="Registro de observações e recomendações">
        <textarea className="textarea"
          placeholder="Registre observações técnicas gerais, recomendações e notas sobre o atendimento..."
          value={state.observations}
          onChange={e => set('observations', e.target.value)}
          style={{minHeight:100}}/>
      </Field>
    </SecCard>
  )
}

export function ClosureSection({ dragHandleProps }) {
  const { state, toggle } = useApp()
  return (
    <SecCard icon={<CheckCircle2 size={17}/>} title="Encerramento" dragHandleProps={dragHandleProps}>
      <div style={{display:'flex', flexDirection:'column', gap:3}}>
        {[
          ['writeReport',      'Escrever relatório no Milvus'],
          ['collectClientSig', 'Coletar assinatura do responsável'],
          ['collectTechSig',   'Coletar assinatura do técnico'],
          ['closeCall',        'Encerrar chamado na frente do responsável'],
          ['checkSatisfaction','Verificar satisfação do cliente'],
        ].map(([k, label]) => (
          <CheckRow key={k} checked={state[k]} onChange={() => toggle(k)} label={label}/>
        ))}
      </div>
      <CustomFieldRenderer section="closure"/>
      <AddFieldButton section="closure"/>
    </SecCard>
  )
}
