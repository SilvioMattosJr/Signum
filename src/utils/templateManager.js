/* ================================================================
   Signum Template Manager
   A "template" captures the STRUCTURE of a form:
   - customFields (with section, type, required, showInPdf…)
   - customSections (with their fields)
   - NO values, NO signatures, NO company data
   Templates can be exported as .signum-template.json and imported.
   ================================================================ */

export const TEMPLATE_VERSION = 1

/**
 * Build an exportable template object from current state.
 * Strips all filled values — only structure remains.
 */
export function buildTemplate(state, name = 'Meu Modelo', primaryColor) {
  return {
    _signumTemplate: true,
    version: TEMPLATE_VERSION,
    name,
    primaryColor,
    sectionOrder: state.sectionOrder || [],
    createdAt: new Date().toISOString(),
    customFields: (state.customFields || []).map(f => ({
      id: f.id, section: f.section, label: f.label,
      type: f.type, required: f.required,
      hasPhoto: f.hasPhoto, showInPdf: f.showInPdf ?? true,
      options: f.options || [], placeholder: f.placeholder || '',
      conditions: f.conditions || [],
      conditionMode: f.conditionMode || 'show',
      conditionLogic: f.conditionLogic || 'and',
    })),
    customSections: (state.customSections || []).map(s => ({
      id: s.id, title: s.title, icon: s.icon || 'LayoutTemplate',
      fields: (s.fields || []).map(f => ({
        id: f.id, label: f.label, type: f.type,
        required: f.required, hasPhoto: f.hasPhoto,
        showInPdf: f.showInPdf ?? true,
        options: f.options || [], placeholder: f.placeholder || '',
        conditions: f.conditions || [], conditionMode: f.conditionMode || 'show', conditionLogic: f.conditionLogic || 'and',
      })),
    })),
  }
}

/**
 * Export template as a downloadable .json file.
 */
export function exportTemplate(state, name, primaryColor) {
  const tmpl = buildTemplate(state, name, primaryColor)
  const blob = new Blob([JSON.stringify(tmpl, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const safeName = (name || 'modelo').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `signum_modelo_${safeName}.json`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse and validate an imported template file.
 * Returns { ok, template, error }
 */
export async function parseTemplateFile(file) {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    if (!parsed._signumTemplate) {
      return { ok: false, error: 'Arquivo não é um modelo Signum válido.' }
    }
    if (!parsed.customFields && !parsed.customSections) {
      return { ok: false, error: 'Modelo vazio ou corrompido.' }
    }
    return { ok: true, template: parsed }
  } catch {
    return { ok: false, error: 'Falha ao ler o arquivo. Verifique se é um JSON válido.' }
  }
}
