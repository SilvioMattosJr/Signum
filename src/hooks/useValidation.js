import { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { isFieldVisible } from '../utils/conditionEngine.js'

function sectionLabel(s) {
  return {
    arrival:'Ao Chegar no Cliente', training:'Treinamento',
    closure:'Encerramento', machine:'Máquina', infra:'Infraestrutura',
  }[s] || s
}

export function useValidation() {
  const { state } = useApp()

  const v = useMemo(() => {
    const errors  = {}
    const missing = []
    // hard = blocks generation entirely (core fields + user-marked required)
    // soft = warning only (non-required custom fields that are empty)
    const addHard = (section, field, key) => {
      errors[key] = 'hard'
      missing.push({ section, field, hard: true })
    }
    const addSoft = (section, field, key) => {
      errors[key] = 'soft'
      missing.push({ section, field, hard: false })
    }

    // ── Core fixed fields (always hard) ────────────────────────
    if (!state.companyName?.trim())  addHard('Ao Chegar no Cliente', 'Nome da empresa',     'companyName')
    if (!state.openMilvus)           addHard('Ao Chegar no Cliente', 'Abrir chamado no Milvus', 'openMilvus')
    if (!state.startService)         addHard('Ao Chegar no Cliente', 'Iniciar atendimento',  'startService')
    if (!state.trainHelpdesk)        addHard('Treinamento', 'Demonstrar abertura de chamado', 'trainHelpdesk')
    if (!state.trainMaintenance)     addHard('Treinamento', 'Procedimentos de manutenção',   'trainMaintenance')
    if (!state.trainUpdates)         addHard('Treinamento', 'Orientar sobre atualizações',   'trainUpdates')

    if (state.machines.length === 0 && state.infrastructures.length === 0)
      addHard('Equipamentos', 'Adicionar ao menos uma máquina ou infraestrutura', 'noItems')

    // ── Custom fields — global sections ────────────────────────
    const globalCFs = (state.customFields || []).filter(f =>
      ['arrival', 'training', 'closure'].includes(f.section)
    )
    globalCFs.forEach(f => {
      const vals = state.customFieldValues || {}
      if (!isFieldVisible(f, vals)) return  // hidden by condition → skip
      const val = vals[f.id]
      const empty = val === undefined || val === null || val === '' || val === false
      if (!empty) return
      if (f.required) addHard(sectionLabel(f.section), f.label, `cf_${f.id}`)
      // non-required visible custom fields: no warning, just omit from report
    })

    // ── Machines ──────────────────────────────────────────────
    state.machines.forEach((m, i) => {
      const s = `Máquina ${i + 1}`
      if (!m.name?.trim())         addHard(s, 'Nome da Máquina',     `m_${m.id}_name`)
      if (!m.os?.trim())           addHard(s, 'Sistema Operacional', `m_${m.id}_os`)
      if (!m.storage?.trim())      addHard(s, 'Armazenamento',       `m_${m.id}_storage`)
      if (!m.ram?.trim())          addHard(s, 'Memória RAM',         `m_${m.id}_ram`)
      if (!m.anydesk?.trim())      addHard(s, 'ID do AnyDesk',       `m_${m.id}_anydesk`)
      if (!m.observations?.trim()) addHard(s, 'Observações',         `m_${m.id}_obs`)

      m.photos.forEach((p, pi) => {
        if (p.dataUrl && !p.status)
          addHard(s, `Foto ${pi + 1}: Status`, `p_${p.id}_status`)
      })

      // Machine custom fields
      ;(state.customFields || []).filter(f => f.section === 'machine').forEach(f => {
        const vals = m.customFieldValues || {}
        if (!isFieldVisible(f, vals)) return
        const val = vals[f.id]
        const empty = val === undefined || val === null || val === '' || val === false
        if (!empty) return
        if (f.required) addHard(s, f.label, `cf_m_${m.id}_${f.id}`)
      })
    })

    // ── Infrastructures ────────────────────────────────────────
    state.infrastructures.forEach((inf, i) => {
      const s = `Infraestrutura ${i + 1}`
      if (!inf.description?.trim())  addHard(s, 'Descrição',   `i_${inf.id}_desc`)
      if (!inf.location?.trim())     addHard(s, 'Localização', `i_${inf.id}_loc`)
      if (!inf.observations?.trim()) addHard(s, 'Observações', `i_${inf.id}_obs`)

      inf.photos.forEach((p, pi) => {
        if (p.dataUrl && !p.status)
          addHard(s, `Foto ${pi + 1}: Status`, `p_${p.id}_status`)
      })

      ;(state.customFields || []).filter(f => f.section === 'infra').forEach(f => {
        const vals = inf.customFieldValues || {}
        if (!isFieldVisible(f, vals)) return
        const val = vals[f.id]
        const empty = val === undefined || val === null || val === '' || val === false
        if (!empty) return
        if (f.required) addHard(s, f.label, `cf_i_${inf.id}_${f.id}`)
      })
    })

    // ── Custom sections ────────────────────────────────────────
    ;(state.customSections || []).forEach(sec => {
      ;(sec.fields || []).forEach(f => {
        const vals = sec.values || {}
        if (!isFieldVisible(f, vals)) return
        const val = vals[f.id]
        const empty = val === undefined || val === null || val === '' || val === false
        if (!empty) return
        if (f.required) addHard(sec.title || 'Seção personalizada', f.label, `cf_cs_${sec.id}_${f.id}`)
      })
    })

    // ── Signatures ─────────────────────────────────────────────
    if (!state.clientName?.trim())  addHard('Assinaturas', 'Nome do responsável',         'clientName')
    if (!state.clientSignature)     addHard('Assinaturas', 'Assinatura do responsável',   'clientSig')
    ;(state.technicians || []).forEach((t, i) => {
      if (!t.name?.trim()) addHard('Assinaturas', `Nome Técnico ${i + 1}`,      `tech_${t.id}_name`)
      if (!t.signature)    addHard('Assinaturas', `Assinatura Técnico ${i + 1}`, `tech_${t.id}_sig`)
    })

    const hardMissing = missing.filter(m => m.hard)
    const softMissing = missing.filter(m => !m.hard)

    const sections = missing.reduce((acc, { section, field }) => {
      ;(acc[section] = acc[section] || []).push(field)
      return acc
    }, {})

    const hardSections = hardMissing.reduce((acc, { section, field }) => {
      ;(acc[section] = acc[section] || []).push(field)
      return acc
    }, {})

    return {
      // isValid: no hard errors → generation allowed without extra confirmation
      isValid:     hardMissing.length === 0,
      // canGenerate: always true (but soft warnings show in review)
      errors,
      missing,      // all (hard + soft)
      hardMissing,  // blocks generation
      softMissing,  // warnings only
      sections,
      hardSections,
    }
  }, [state])

  const progress = useMemo(() => {
    const fields = [
      'openMilvus', 'startService',
      'trainHelpdesk', 'trainMaintenance', 'trainUpdates',
      'writeReport', 'collectClientSig', 'collectTechSig', 'closeCall', 'checkSatisfaction',
    ]
    let checked = fields.filter(f => state[f]).length
    let total   = fields.length

    state.machines.forEach(m => {
      ['checkUpdates','checkPrograms','installMilvus','updateBrowsers',
       'installOffice','installAdobe','installWinrar','runAida'].forEach(f => {
        total++; if (m[f]) checked++
      })
    })

    ;(state.customFields || []).filter(f => f.type === 'checkbox').forEach(f => {
      total++
      if ((state.customFieldValues || {})[f.id]) checked++
    })

    return total ? Math.round((checked / total) * 100) : 0
  }, [state])

  return { v, progress }
}
