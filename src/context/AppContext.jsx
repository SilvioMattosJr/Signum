import { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo } from 'react'
import { saveState, loadState } from '../utils/storage.js'
import { A } from './actions.js'
export { A }
export { DEFAULT_MARGINS } from './constants.js'

// ─── Factories ────────────────────────────────────────────────────────────────
export const createMachine = (id, number) => ({
  id, number,
  name:'', os:'', storage:'', ram:'', anydesk:'',
  windowsActivated:null,
  useWindowsMas:false, useWindowsCmd:false,
  checkUpdates:false, checkPrograms:false, installMilvus:false,
  updateBrowsers:false, installOffice:false, installAdobe:false,
  installWinrar:false, runAida:false,
  observations:'', photos:[],
  customFieldValues:{},
})

export const createInfra = (id, number) => ({
  id, number, description:'', location:'', observations:'', photos:[], customFieldValues:{},
})

export const createPhoto = () => ({
  id:`ph-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
  dataUrl:null, caption:'', status:'',
})

export const createTechnician = () => ({
  id:`tech-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
  name:'', signature:null,
})

export const createCustomField = (section) => ({
  id:`cf-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
  section, label:'', type:'text', required:false,
  hasPhoto:false, showInPdf:true, options:[], placeholder:'',
  // Conditional logic
  conditions:[],       // [{id,fieldId,operator,value,logic}]
  conditionMode:'show',  // 'show' | 'hide'
  conditionLogic:'and',  // 'and' | 'or'
})

// Custom section shape:
// { id, title, icon, fields:CustomField[], values:{}, order:number }
export const createCustomSection = () => ({
  id:`cs-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
  title:'Nova Seção',
  icon:'LayoutTemplate',
  showInPdf:true,
  fields:[],
  values:{},
})

const blankForm = () => ({
  companyName:'', serviceDate: new Date().toISOString().split('T')[0],
  openMilvus:false, startService:false,
  trainHelpdesk:false, trainMaintenance:false, trainUpdates:false,
  writeReport:false, collectClientSig:false, collectTechSig:false,
  closeCall:false, checkSatisfaction:false,
  observations:'',
  machines:[], infrastructures:[],
  clientName:'', clientSignature:null,
  technicians:[createTechnician()],
  customFields:[], customFieldValues:{},
  customSections:[],
  sectionOrder:['arrival', 'training', 'observations', 'signatures', 'closure'],
  machineCounter:0, infraCounter:0,
})

const initialState = {
  ...blankForm(),
  pdfTemplate:null, pdfMargins:{top:18,bottom:18,left:18,right:18},
  saveStatus:'idle', loadStatus:'loading', history:[],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function stripPhotos(s) {
  return {
    ...s,
    machines: s.machines.map(m => ({...m, photos:m.photos.map(p => ({...p,dataUrl:null}))})),
    infrastructures: s.infrastructures.map(i => ({...i, photos:i.photos.map(p => ({...p,dataUrl:null}))})),
    clientSignature:null,
    technicians: s.technicians.map(t => ({...t, signature:null})),
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, {type:t, payload:p={}}) {
  switch(t) {
    case A.SET:    return {...state, [p.k]:p.v}
    case A.TOGGLE: return {...state, [p.k]:!state[p.k]}
    case A.LOADED: return {...state, ...p.data, loadStatus:'ready'}
    case A.READY:  return {...state, loadStatus:'ready'}

    case A.ADD_MACHINE: {
      const c=state.machineCounter+1;
      const mId=`m-${c}`;
      // Insert machine after arrival (index 0 usually, but let's safely put it at index 1)
      const newOrder = [...state.sectionOrder];
      const arrIdx = newOrder.indexOf('arrival');
      if (arrIdx !== -1) newOrder.splice(arrIdx + 1, 0, mId); else newOrder.push(mId);
      return {...state,machineCounter:c,machines:[...state.machines,createMachine(mId,c)], sectionOrder: newOrder}
    }
    case A.UPD_MACHINE: return {...state, machines:state.machines.map(m=>m.id===p.id?{...m,...p.u}:m)}
    case A.DEL_MACHINE: return {...state, machines:state.machines.filter(m=>m.id!==p.id), sectionOrder: state.sectionOrder.filter(id=>id!==p.id)}

    case A.ADD_INFRA:   {
      const c=state.infraCounter+1;
      const iId=`i-${c}`;
      const newOrder = [...state.sectionOrder];
      // Insert infra after the last machine or after arrival
      const lastMachineIdx = newOrder.findLastIndex(id => id.startsWith('m-'));
      const arrIdx = newOrder.indexOf('arrival');
      const insertAt = lastMachineIdx !== -1 ? lastMachineIdx + 1 : (arrIdx !== -1 ? arrIdx + 1 : newOrder.length);
      newOrder.splice(insertAt, 0, iId);
      return {...state,infraCounter:c,infrastructures:[...state.infrastructures,createInfra(iId,c)], sectionOrder: newOrder}
    }
    case A.UPD_INFRA:   return {...state, infrastructures:state.infrastructures.map(i=>i.id===p.id?{...i,...p.u}:i)}
    case A.DEL_INFRA:   return {...state, infrastructures:state.infrastructures.filter(i=>i.id!==p.id), sectionOrder: state.sectionOrder.filter(id=>id!==p.id)}

    case A.ADD_PHOTO: {
      const ph=createPhoto()
      const u=arr=>arr.map(x=>x.id===p.itemId?{...x,photos:[...x.photos,ph]}:x)
      return p.itemType==='machine'?{...state,machines:u(state.machines)}:{...state,infrastructures:u(state.infrastructures)}
    }
    case A.UPD_PHOTO: {
      const u=arr=>arr.map(x=>x.id===p.itemId?{...x,photos:x.photos.map(ph=>ph.id===p.photoId?{...ph,...p.u}:ph)}:x)
      return p.itemType==='machine'?{...state,machines:u(state.machines)}:{...state,infrastructures:u(state.infrastructures)}
    }
    case A.DEL_PHOTO: {
      const u=arr=>arr.map(x=>x.id===p.itemId?{...x,photos:x.photos.filter(ph=>ph.id!==p.photoId)}:x)
      return p.itemType==='machine'?{...state,machines:u(state.machines)}:{...state,infrastructures:u(state.infrastructures)}
    }
    case A.REORDER_PHOTOS: {
      const u=arr=>arr.map(x=>x.id===p.itemId?{...x,photos:p.photos}:x)
      return p.itemType==='machine'?{...state,machines:u(state.machines)}:{...state,infrastructures:u(state.infrastructures)}
    }

    case A.ADD_TECH: return {...state, technicians:[...state.technicians,createTechnician()]}
    case A.UPD_TECH: return {...state, technicians:state.technicians.map(t=>t.id===p.id?{...t,...p.u}:t)}
    case A.DEL_TECH: return state.technicians.length<=1?state:{...state,technicians:state.technicians.filter(t=>t.id!==p.id)}

    case A.ADD_CUSTOM_FIELD: return {...state, customFields:[...state.customFields, p.field]}
    case A.UPD_CUSTOM_FIELD: return {...state, customFields:state.customFields.map(f=>f.id===p.id?{...f,...p.u}:f)}
    case A.DEL_CUSTOM_FIELD: return {...state, customFields:state.customFields.filter(f=>f.id!==p.id)}
    case A.SET_CUSTOM_VALUE: return {...state, customFieldValues:{...state.customFieldValues,[p.fieldId]:p.value}}
    case A.SET_ITEM_CUSTOM_VALUE: {
      const u=arr=>arr.map(x=>x.id===p.itemId?{...x,customFieldValues:{...x.customFieldValues,[p.fieldId]:p.value}}:x)
      return p.itemType==='machine'?{...state,machines:u(state.machines)}:{...state,infrastructures:u(state.infrastructures)}
    }

    // ── Custom sections ─────────────────────────────────────────
    case A.ADD_CUSTOM_SECTION: {
      const cs = createCustomSection();
      return {...state, customSections:[...state.customSections, cs], sectionOrder:[...state.sectionOrder, cs.id]}
    }
    case A.UPD_CUSTOM_SECTION:
      return {...state, customSections:state.customSections.map(s=>s.id===p.id?{...s,...p.u}:s)}
    case A.DEL_CUSTOM_SECTION:
      return {...state, customSections:state.customSections.filter(s=>s.id!==p.id), sectionOrder: state.sectionOrder.filter(id=>id!==p.id)}
    case A.REORDER_SECTIONS:
      return {...state, customSections:p.sections} // Keep this for now if used elsewhere, but mainly we use sectionOrder
    case A.SET_SECTION_ORDER:
      return {...state, sectionOrder:p.order}
    case A.SET_SECTION_VALUE:
      return {...state, customSections:state.customSections.map(s=>s.id===p.sectionId?{...s,values:{...s.values,[p.fieldId]:p.value}}:s)}

    case A.SET_SIG:      return {...state,[p.k]:p.v}
    case A.SET_TEMPLATE: return {...state,pdfTemplate:p.template}
    case A.SET_MARGINS:  return {...state,pdfMargins:{...state.pdfMargins,...p.margins}}

    case A.SAVE_TO_HISTORY: {
      const entry={id:`hist-${Date.now()}`,date:new Date().toISOString(),companyName:state.companyName||'Sem nome',snapshot:stripPhotos(state)}
      return {...state,history:[entry,...state.history].slice(0,50)}
    }
    case A.LOAD_FROM_HISTORY: {
      const e=state.history.find(h=>h.id===p.id)
      return e?{...state,...e.snapshot,loadStatus:'ready'}:state
    }
    case A.DELETE_HISTORY: return {...state,history:state.history.filter(h=>h.id!==p.id)}
    case A.NEW_REPORT:     return {...state,...blankForm(),loadStatus:'ready'}
    case A.SET_SAVE_STATUS:return {...state,saveStatus:p.status}
    case A.LOAD_SHARE:     return {...state,...p.data,loadStatus:'ready'}
    // Load template: restore structure (fields/sections) but NOT values
    case A.LOAD_TEMPLATE:
      return {
        ...state,
        customFields:    p.tmpl.customFields    || [],
        customSections:  (p.tmpl.customSections || []).map(s => ({...s, values:{}})),
        sectionOrder:    p.tmpl.sectionOrder    || state.sectionOrder,
        // reset values for builtin fields too
        customFieldValues: {},
        machines: state.machines.map(m => ({...m, customFieldValues:{}})),
        infrastructures: state.infrastructures.map(i => ({...i, customFieldValues:{}})),
      }
    default: return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppStateCtx    = createContext(null)
const AppDispatchCtx = createContext(null)

export function AppProvider({children}) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const saveTimer = useRef(null)

  useEffect(() => {
    loadState().then(saved => {
      if (saved) {
        dispatch({type:A.LOADED, payload:{data:{
          ...saved,
          pdfMargins:       saved.pdfMargins  || {top:18,bottom:18,left:18,right:18},
          technicians:      saved.technicians?.length ? saved.technicians : [createTechnician()],
          customFields:     saved.customFields    || [],
          customFieldValues:saved.customFieldValues || {},
          customSections:   saved.customSections  || [],
          sectionOrder:     saved.sectionOrder    || ['arrival', ...(saved.machines||[]).map(m=>m.id), ...(saved.infrastructures||[]).map(i=>i.id), 'training', 'observations', 'signatures', 'closure', ...(saved.customSections||[]).map(s=>s.id)],
          serviceDate:      saved.serviceDate || new Date().toISOString().split('T')[0],
        }}})
      } else {
        dispatch({type:A.READY})
      }
    }).catch(() => dispatch({type:A.READY}))
  }, [])

  useEffect(() => {
    if (state.loadStatus !== 'ready') return
    clearTimeout(saveTimer.current)
    dispatch({type:A.SET_SAVE_STATUS, payload:{status:'saving'}})
    saveTimer.current = setTimeout(async () => {
      try {
        await saveState(state)
        dispatch({type:A.SET_SAVE_STATUS, payload:{status:'saved'}})
        setTimeout(() => dispatch({type:A.SET_SAVE_STATUS, payload:{status:'idle'}}), 2200)
      } catch {
        dispatch({type:A.SET_SAVE_STATUS, payload:{status:'error'}})
      }
    }, 900)
    return () => clearTimeout(saveTimer.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.companyName, state.serviceDate, state.openMilvus, state.startService,
      state.trainHelpdesk, state.trainMaintenance, state.trainUpdates,
      state.writeReport, state.collectClientSig, state.collectTechSig,
      state.closeCall, state.checkSatisfaction, state.observations,
      state.clientName, state.clientSignature, state.technicians,
      state.machines, state.infrastructures, state.customFields,
      state.customFieldValues, state.customSections, state.sectionOrder,
      state.history, state.pdfMargins, state.loadStatus])

  const set    = useCallback((k,v) => dispatch({type:A.SET,payload:{k,v}}), [])
  const toggle = useCallback(k     => dispatch({type:A.TOGGLE,payload:{k}}), [])

  const addMachine   = useCallback(()    => dispatch({type:A.ADD_MACHINE}), [])
  const updMachine   = useCallback((id,u)=> dispatch({type:A.UPD_MACHINE,payload:{id,u}}), [])
  const delMachine   = useCallback(id    => dispatch({type:A.DEL_MACHINE,payload:{id}}), [])
  const addInfra     = useCallback(()    => dispatch({type:A.ADD_INFRA}), [])
  const updInfra     = useCallback((id,u)=> dispatch({type:A.UPD_INFRA,payload:{id,u}}), [])
  const delInfra     = useCallback(id    => dispatch({type:A.DEL_INFRA,payload:{id}}), [])

  const addPhoto       = useCallback((t,id)       => dispatch({type:A.ADD_PHOTO,payload:{itemType:t,itemId:id}}), [])
  const updPhoto       = useCallback((t,id,pid,u) => dispatch({type:A.UPD_PHOTO,payload:{itemType:t,itemId:id,photoId:pid,u}}), [])
  const delPhoto       = useCallback((t,id,pid)   => dispatch({type:A.DEL_PHOTO,payload:{itemType:t,itemId:id,photoId:pid}}), [])
  const reorderPhotos  = useCallback((t,id,photos)=> dispatch({type:A.REORDER_PHOTOS,payload:{itemType:t,itemId:id,photos}}), [])

  const addTech  = useCallback(()    => dispatch({type:A.ADD_TECH}), [])
  const updTech  = useCallback((id,u)=> dispatch({type:A.UPD_TECH,payload:{id,u}}), [])
  const delTech  = useCallback(id    => dispatch({type:A.DEL_TECH,payload:{id}}), [])

  const addCustomField     = useCallback(field              => dispatch({type:A.ADD_CUSTOM_FIELD,payload:{field}}), [])
  const updCustomField     = useCallback((id,u)             => dispatch({type:A.UPD_CUSTOM_FIELD,payload:{id,u}}), [])
  const delCustomField     = useCallback(id                 => dispatch({type:A.DEL_CUSTOM_FIELD,payload:{id}}), [])
  const setCustomValue     = useCallback((fieldId,value)    => dispatch({type:A.SET_CUSTOM_VALUE,payload:{fieldId,value}}), [])
  const setItemCustomValue = useCallback((t,itemId,fid,val) => dispatch({type:A.SET_ITEM_CUSTOM_VALUE,payload:{itemType:t,itemId,fieldId:fid,value:val}}), [])

  const addCustomSection  = useCallback(()        => dispatch({type:A.ADD_CUSTOM_SECTION}), [])
  const updCustomSection  = useCallback((id,u)    => dispatch({type:A.UPD_CUSTOM_SECTION,payload:{id,u}}), [])
  const delCustomSection  = useCallback(id        => dispatch({type:A.DEL_CUSTOM_SECTION,payload:{id}}), [])
  const reorderSections   = useCallback(sections  => dispatch({type:A.REORDER_SECTIONS,payload:{sections}}), [])
  const setSectionOrder   = useCallback(order     => dispatch({type:A.SET_SECTION_ORDER,payload:{order}}), [])
  const setSectionValue   = useCallback((sectionId,fieldId,value) => dispatch({type:A.SET_SECTION_VALUE,payload:{sectionId,fieldId,value}}), [])

  const setSig        = useCallback((k,v)  => dispatch({type:A.SET_SIG,payload:{k,v}}), [])
  const setTemplate   = useCallback(tmpl   => dispatch({type:A.SET_TEMPLATE,payload:{template:tmpl}}), [])
  const setMargins    = useCallback(margins=> dispatch({type:A.SET_MARGINS,payload:{margins}}), [])
  const saveToHistory   = useCallback(()  => dispatch({type:A.SAVE_TO_HISTORY}), [])
  const loadFromHistory = useCallback(id  => dispatch({type:A.LOAD_FROM_HISTORY,payload:{id}}), [])
  const deleteHistory   = useCallback(id  => dispatch({type:A.DELETE_HISTORY,payload:{id}}), [])
  const newReport       = useCallback(()  => dispatch({type:A.NEW_REPORT}), [])
  const loadShare       = useCallback(data=> dispatch({type:A.LOAD_SHARE,payload:{data}}), [])
  const loadTemplate    = useCallback(tmpl=> dispatch({type:A.LOAD_TEMPLATE,payload:{tmpl}}), [])

  const actions = useMemo(() => ({
    set, toggle, addMachine, updMachine, delMachine,
    addInfra, updInfra, delInfra, addPhoto, updPhoto, delPhoto, reorderPhotos,
    addTech, updTech, delTech, addCustomField, updCustomField, delCustomField,
    setCustomValue, setItemCustomValue, addCustomSection, updCustomSection,
    delCustomSection, reorderSections, setSectionOrder, setSectionValue,
    setSig, setTemplate, setMargins, saveToHistory, loadFromHistory,
    deleteHistory, newReport, loadShare, loadTemplate, dispatch
  }), [
    set, toggle, addMachine, updMachine, delMachine,
    addInfra, updInfra, delInfra, addPhoto, updPhoto, delPhoto, reorderPhotos,
    addTech, updTech, delTech, addCustomField, updCustomField, delCustomField,
    setCustomValue, setItemCustomValue, addCustomSection, updCustomSection,
    delCustomSection, reorderSections, setSectionOrder, setSectionValue,
    setSig, setTemplate, setMargins, saveToHistory, loadFromHistory,
    deleteHistory, newReport, loadShare, loadTemplate
  ])

  return (
    <AppStateCtx.Provider value={state}>
      <AppDispatchCtx.Provider value={actions}>
        {children}
      </AppDispatchCtx.Provider>
    </AppStateCtx.Provider>
  )
}

export const useAppState = () => {
  const c = useContext(AppStateCtx)
  if (!c) throw new Error('useAppState outside AppProvider')
  return c
}

export const useAppDispatch = () => {
  const c = useContext(AppDispatchCtx)
  if (!c) throw new Error('useAppDispatch outside AppProvider')
  return c
}

// Keep useApp for backward compatibility but encourage splitting
export const useApp = () => {
  const state = useAppState()
  const dispatch = useAppDispatch()
  return { state, ...dispatch }
}
