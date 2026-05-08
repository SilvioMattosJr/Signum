import { useState, useEffect } from 'react'
import { Info, FileText, Plus, Layout, MonitorSmartphone } from 'lucide-react'
import { AppProvider, useAppState, useAppDispatch } from './context/AppContext.jsx'
import { ThemeProvider, useThemeCtx } from './context/ThemeContext.jsx'
import { useValidation } from './hooks/useValidation.js'
import { useBreakpoint } from './hooks/useBreakpoint.js'
import { readShareParam, clearShareParam } from './utils/shareLink.js'
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import Header         from './components/layout/Header.jsx'
import BottomNav      from './components/layout/BottomNav.jsx'
import {
  ArrivalSection, TrainingSection,
  ObservationsSection, ClosureSection,
} from './components/sections/StaticSections.jsx'
import MachineBlock       from './components/sections/MachineBlock.jsx'
import InfraBlock         from './components/sections/InfraBlock.jsx'
import SignatureSection   from './components/sections/SignatureSection.jsx'
import CustomSectionBlock from './components/sections/CustomSectionBlock.jsx'
import ReportModal        from './components/modals/ReportModal.jsx'
import PendingFieldsModal from './components/modals/PendingFieldsModal.jsx'
import HistoryModal       from './components/modals/HistoryModal.jsx'
import ReviewModal        from './components/modals/ReviewModal.jsx'
import ShareModal         from './components/modals/ShareModal.jsx'
import TemplateModal      from './components/modals/TemplateModal.jsx'
import ColorPickerModal   from './components/modals/ColorPickerModal.jsx'
import SortableWrapper    from './components/ui/SortableWrapper.jsx'
import './styles/global.css'

function InnerApp() {
  const state = useAppState()
  const {
    addMachine, addInfra, newReport, loadShare,
    addCustomSection, setSectionOrder,
  } = useAppDispatch()
  const { v }            = useValidation()
  const { isDark, primaryColor } = useThemeCtx()
  const { useBottomNav, isMobile } = useBreakpoint()

  const [reportOpen,   setReportOpen]   = useState(false)
  const [pendingOpen,  setPendingOpen]  = useState(false)
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const [reviewOpen,   setReviewOpen]   = useState(false)
  const [shareOpen,    setShareOpen]    = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [paletteOpen,  setPaletteOpen]  = useState(false)

  // Handle incoming share link
  useEffect(() => {
    const shared = readShareParam()
    if (!shared) return
    if (window.confirm('Carregar relatório compartilhado? O formulário atual será substituído.')) {
      loadShare({
        companyName:       shared.companyName       || '',
        serviceDate:       shared.serviceDate        || new Date().toISOString().split('T')[0],
        openMilvus:        shared.openMilvus         || false,
        startService:      shared.startService       || false,
        trainHelpdesk:     shared.trainHelpdesk      || false,
        trainMaintenance:  shared.trainMaintenance   || false,
        trainUpdates:      shared.trainUpdates       || false,
        writeReport:       shared.writeReport        || false,
        collectClientSig:  shared.collectClientSig   || false,
        collectTechSig:    shared.collectTechSig     || false,
        closeCall:         shared.closeCall          || false,
        checkSatisfaction: shared.checkSatisfaction  || false,
        observations:      shared.observations       || '',
        clientName:        shared.clientName         || '',
        technicians:       shared.technicians?.length ? shared.technicians : [{ id:'tech-import-1', name:'', signature:null }],
        customFields:      shared.customFields       || [],
        customFieldValues: shared.customFieldValues  || {},
        customSections:    shared.customSections     || [],
        machines:          (shared.machines||[]).map(m => ({ ...m, photos:[] })),
        infrastructures:   (shared.infrastructures||[]).map(i => ({ ...i, photos:[] })),
        pdfMargins:        shared.pdfMargins         || { top:18, bottom:18, left:18, right:18 },
      })
    }
    clearShareParam()
  }, []) // eslint-disable-line

  const handleGenerate        = () => setReviewOpen(true)
  const handleConfirmGenerate = () => { setReviewOpen(false); setReportOpen(true) }
  const handleNew             = () => { if (window.confirm('Iniciar novo relatório? O preenchimento será limpo.')) newReport() }

  // DnD for custom sections reorder
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 180, tolerance: 6 } }),
  )
  const handleSectionDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = state.sectionOrder.indexOf(active.id)
    const newIdx = state.sectionOrder.indexOf(over.id)
    if (oldIdx !== -1 && newIdx !== -1) {
      setSectionOrder(arrayMove(state.sectionOrder, oldIdx, newIdx))
    }
  }

  // Loading
  if (state.loadStatus === 'loading') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16, color:'var(--t2)' }}>
        <div style={{ width:40, height:40, border:'3px solid var(--cyan-dim)', borderTop:'3px solid var(--cyan)', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ fontSize:'.875rem' }}>Carregando dados…</span>
      </div>
    )
  }

  const customSections = state.customSections || []

  return (
    <>
      <Header
        onAddMachine={addMachine}
        onAddInfra={addInfra}
        onHistory={() => setHistoryOpen(true)}
        onNew={handleNew}
        onShare={() => setShareOpen(true)}
        onTemplate={() => setTemplateOpen(true)}
        onPalette={() => setPaletteOpen(true)}
      />

      <main style={{ maxWidth:960, margin:'0 auto', padding:`18px ${isMobile?12:16}px ${useBottomNav?88:80}px` }}>

        <div style={{ marginBottom:14 }}>
          <h1 style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:isMobile?'1.1rem':'1.35rem', color:'var(--t1)', letterSpacing:'-.02em', marginBottom:3 }}>
            Manutenção Preventiva
          </h1>
          <p style={{ fontSize:'.8rem', color:'var(--t3)' }}>Preencha todas as seções para liberar a exportação</p>
        </div>

        <div className="warn-card" style={{ marginBottom:14 }}>
          <div className="warn-icon"><Info size={15}/></div>
          <p>
            <strong style={{ color:'var(--t1)' }}>Atenção:</strong>{' '}
            Adicione <strong style={{ color:'var(--cyan)' }}>pelo menos uma máquina ou infraestrutura</strong> e colete as assinaturas.
          </p>
        </div>

        {/* Empty state warning if no machines/infras */}
        {state.machines.length === 0 && state.infrastructures.length === 0 && (
          <div className="empty-state" style={{
            border:`1px dashed ${v.errors.noItems?'var(--red)':'var(--cyan-border)'}`,
            background:v.errors.noItems?'var(--red-bg)':'var(--glass-3)', marginBottom:14,
          }}>
            <div style={{ marginBottom: 10, opacity: 0.3, color: v.errors.noItems ? 'var(--red)' : 'var(--cyan)' }}>
              <MonitorSmartphone size={42} />
            </div>
            <div style={{ fontWeight:700, fontSize:'.9rem', color:v.errors.noItems?'var(--red)':'var(--t2)' }}>
              {v.errors.noItems ? 'Adicione pelo menos uma máquina ou infraestrutura' : 'Nenhum equipamento adicionado ainda'}
            </div>
            <div style={{ fontSize:'.78rem', color:'var(--t3)' }}>
              {useBottomNav ? <>Toque em <strong style={{color:'var(--cyan)'}}>+</strong> no menu</> : <>Use <strong style={{color:'var(--cyan)'}}>+ Adicionar</strong> no topo</>}
            </div>
          </div>
        )}

        {/* ── Dynamic Sections with DnD ── */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
          <SortableContext items={state.sectionOrder} strategy={verticalListSortingStrategy}>
            {state.sectionOrder.map(id => {
              if (id === 'arrival') return (
                <SortableWrapper key={id} id={id}>
                  <ArrivalSection 
                    companyName={state.companyName} 
                    serviceDate={state.serviceDate} 
                    openMilvus={state.openMilvus} 
                    startService={state.startService} 
                  />
                </SortableWrapper>
              )
              if (id === 'training') return (
                <SortableWrapper key={id} id={id}>
                  <TrainingSection 
                    trainHelpdesk={state.trainHelpdesk} 
                    trainMaintenance={state.trainMaintenance} 
                    trainUpdates={state.trainUpdates} 
                  />
                </SortableWrapper>
              )
              if (id === 'observations') return (
                <SortableWrapper key={id} id={id}>
                  <ObservationsSection observations={state.observations} />
                </SortableWrapper>
              )
              if (id === 'signatures') return <SortableWrapper key={id} id={id}><SignatureSection/></SortableWrapper>
              if (id === 'closure') return (
                <SortableWrapper key={id} id={id}>
                  <ClosureSection 
                    writeReport={state.writeReport} 
                    collectClientSig={state.collectClientSig} 
                    collectTechSig={state.collectTechSig} 
                    closeCall={state.closeCall} 
                    checkSatisfaction={state.checkSatisfaction} 
                  />
                </SortableWrapper>
              )
              
              if (id.startsWith('m-')) {
                const m = state.machines.find(x => x.id === id)
                if (m) return <SortableWrapper key={id} id={id}><MachineBlock machine={m}/></SortableWrapper>
              }
              if (id.startsWith('i-')) {
                const inf = state.infrastructures.find(x => x.id === id)
                if (inf) return <SortableWrapper key={id} id={id}><InfraBlock infra={inf}/></SortableWrapper>
              }
              if (id.startsWith('cs-')) {
                const cs = state.customSections.find(x => x.id === id)
                if (cs) return <CustomSectionBlock key={id} section={cs}/> 
              }
              return null
            })}
          </SortableContext>
        </DndContext>

        {/* ── Add section button ── */}
        <div style={{
          display:'flex', justifyContent:'center', marginBottom:16, marginTop: customSections.length ? 4 : 0,
        }}>
          <button
            onClick={addCustomSection}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'11px 24px',
              background:'transparent',
              border:'1.5px dashed var(--cyan-border)',
              borderRadius:12, cursor:'pointer',
              color:'var(--cyan)', fontFamily:'var(--font)',
              fontSize:'.875rem', fontWeight:600,
              transition:'all .2s var(--ease)',
              width:'100%', justifyContent:'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--glass-3)'; e.currentTarget.style.borderColor='var(--cyan-border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='var(--cyan-border)' }}
          >
            <Plus size={16}/>
            Adicionar nova seção
          </button>
        </div>

        {/* Generate button — desktop only */}
        {!useBottomNav && (
          <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
            <button
              onClick={handleGenerate}
              style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center', gap:10,
                padding:'15px 44px', width:'100%', maxWidth:420,
                fontFamily:'var(--font)', fontSize:'1rem', fontWeight:700, letterSpacing:'.02em',
                color: !v.hardMissing?.length ? 'var(--gen-btn-color-valid)' : 'var(--gen-btn-color-invalid)',
                background: !v.hardMissing?.length ? 'var(--gen-btn-valid-bg)' : 'var(--gen-btn-invalid-bg)',
                backdropFilter:'blur(22px)', WebkitBackdropFilter:'blur(22px)',
                border:`1px solid ${!v.hardMissing?.length ? 'var(--gen-btn-valid-border)' : 'var(--gen-btn-invalid-border)'}`,
                borderRadius:14, cursor:'pointer',
                boxShadow: !v.hardMissing?.length ? 'var(--gen-btn-valid-shadow)' : 'none',
                transition:'all .22s var(--ease)', position:'relative', overflow:'hidden',
              }}
              onMouseEnter={e => { if(v.hardMissing?.length) return; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=isDark?'0 10px 42px var(--cyan-glow)':'0 8px 30px rgba(0,153,204,.28)' }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=!v.hardMissing?.length?'var(--gen-btn-valid-shadow)':'none' }}
            >
              <FileText size={18}/>
              Gerar Relatório
              {v.hardMissing?.length > 0 && (
                <span style={{ fontSize:'.7rem', fontWeight:700, background:'var(--red-bg)', border:'1px solid rgba(255,77,109,.28)', color:'var(--red)', padding:'2px 9px', borderRadius:20, marginLeft:4 }}>
                  {v.hardMissing.length} bloqueio{v.hardMissing.length!==1?'s':''}
                </span>
              )}
            </button>
          </div>
        )}
      </main>

      {useBottomNav && (
        <BottomNav
          activeTab={reportOpen ? 'report' : pendingOpen ? 'pending' : historyOpen ? 'history' : reviewOpen ? 'review' : shareOpen ? 'share' : templateOpen ? 'template' : null}
          onAddMachine={addMachine}
          onAddInfra={addInfra}
          onPalette={() => setPaletteOpen(true)}
          onHistory={() => {
            if (historyOpen) return setHistoryOpen(false);
            setShareOpen(false); setTemplateOpen(false); setReviewOpen(false); setReportOpen(false);
            setHistoryOpen(true);
          }}
          onNew={handleNew}
          onShare={() => {
            if (shareOpen) return setShareOpen(false);
            setHistoryOpen(false); setTemplateOpen(false); setReviewOpen(false); setReportOpen(false);
            setShareOpen(true);
          }}
          onGenerate={() => {
            if (reviewOpen) return setReviewOpen(false);
            setHistoryOpen(false); setShareOpen(false); setTemplateOpen(false); setReportOpen(false);
            handleGenerate();
          }}
          onTemplate={() => {
            if (templateOpen) return setTemplateOpen(false);
            setHistoryOpen(false); setShareOpen(false); setReviewOpen(false); setReportOpen(false);
            setTemplateOpen(true);
          }}
        />
      )}

      {reportOpen   && <ReportModal         onClose={() => setReportOpen(false)}/>}
      {pendingOpen  && <PendingFieldsModal  onClose={() => setPendingOpen(false)}/>}
      {historyOpen  && <HistoryModal        onClose={() => setHistoryOpen(false)}/>}
      {reviewOpen   && <ReviewModal         onClose={() => setReviewOpen(false)} onGenerate={handleConfirmGenerate}/>}
      {shareOpen    && <ShareModal          onClose={() => setShareOpen(false)}/>}
      {templateOpen && <TemplateModal       onClose={() => setTemplateOpen(false)}/>}
      {paletteOpen  && <ColorPickerModal    onClose={() => setPaletteOpen(false)}/>}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <InnerApp/>
      </AppProvider>
    </ThemeProvider>
  )
}
