import { useState, memo } from 'react'
import { UserCheck, Users, CheckCircle2, FileText, Settings2 } from 'lucide-react'
import { useAppDispatch } from '../../context/AppContext.jsx'
import { useValidation } from '../../hooks/useValidation.js'
import { CheckRow, Field, SecCard, OptimizedInput } from '../ui/index.jsx'
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

export const ArrivalSection = memo(function ArrivalSection({ dragHandleProps, companyName, serviceDate, openMilvus, startService }) {
  const { set, toggle } = useAppDispatch()
  const { v } = useValidation()
  return (
    <SecCard icon={<UserCheck size={17}/>} title="Ao Chegar no Cliente" dragHandleProps={dragHandleProps}>
      <Field label="Nome da empresa" required error={v.errors.companyName && 'Campo obrigatório'}>
        <OptimizedInput className={`input ${v.errors.companyName?'err':''}`}
          placeholder="Digite o nome da empresa"
          value={companyName} onChange={val => set('companyName', val)}/>
      </Field>

      <Field label="Data do atendimento">
        <input className="input" type="date"
          value={serviceDate || new Date().toISOString().split('T')[0]}
          onChange={e => set('serviceDate', e.target.value)}/>
      </Field>

      <div style={{display:'flex', flexDirection:'column', gap:3}}>
        <CheckRow checked={openMilvus} onChange={() => toggle('openMilvus')}
          label="Abrir chamado no Milvus" required invalid={!!v.errors.openMilvus}/>
        <CheckRow checked={startService} onChange={() => toggle('startService')}
          label="Iniciar atendimento" required invalid={!!v.errors.startService}/>
      </div>

      <CustomFieldRenderer section="arrival"/>
      <AddFieldButton section="arrival"/>
    </SecCard>
  )
})

export const TrainingSection = memo(function TrainingSection({ dragHandleProps, trainHelpdesk, trainMaintenance, trainUpdates }) {
  const { toggle } = useAppDispatch()
  const { v } = useValidation()
  return (
    <SecCard icon={<Users size={17}/>} title="Treinamento" dragHandleProps={dragHandleProps}>
      <div style={{display:'flex', flexDirection:'column', gap:3}}>
        <CheckRow checked={trainHelpdesk} onChange={() => toggle('trainHelpdesk')}
          label="Demonstrar como abrir chamado via Client Core Helpdesk" required invalid={!!v.errors.trainHelpdesk}/>
        <CheckRow checked={trainMaintenance} onChange={() => toggle('trainMaintenance')}
          label="Explicar procedimentos básicos de manutenção" required invalid={!!v.errors.trainMaintenance}/>
        <CheckRow checked={trainUpdates} onChange={() => toggle('trainUpdates')}
          label="Orientar sobre: Sempre manter o sistema atualizado" required invalid={!!v.errors.trainUpdates}/>
      </div>
      <CustomFieldRenderer section="training"/>
      <AddFieldButton section="training"/>
    </SecCard>
  )
})

export const ObservationsSection = memo(function ObservationsSection({ dragHandleProps, observations }) {
  const { set } = useAppDispatch()
  return (
    <SecCard icon={<FileText size={17}/>} title="Observações Técnicas" dragHandleProps={dragHandleProps}>
      <Field label="Registro de observações e recomendações">
        <OptimizedInput isTextArea className="textarea"
          placeholder="Registre observações técnicas gerais, recomendações e notas sobre o atendimento..."
          value={observations}
          onChange={val => set('observations', val)}
          style={{minHeight:100}}/>
      </Field>
    </SecCard>
  )
})

export const ClosureSection = memo(function ClosureSection({ dragHandleProps, writeReport, collectClientSig, collectTechSig, closeCall, checkSatisfaction }) {
  const { toggle } = useAppDispatch()
  const data = { writeReport, collectClientSig, collectTechSig, closeCall, checkSatisfaction }
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
          <CheckRow key={k} checked={data[k]} onChange={() => toggle(k)} label={label}/>
        ))}
      </div>
      <CustomFieldRenderer section="closure"/>
      <AddFieldButton section="closure"/>
    </SecCard>
  )
})
