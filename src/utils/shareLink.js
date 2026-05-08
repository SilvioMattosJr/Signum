/* ================================================================
   Signum Share Link
   Encodes form state as compressed base64 URL param.
   Photos are excluded (too large for URL) — user gets a note.
   Import from URL restores all text fields, checkboxes, custom fields.
   ================================================================ */

const PARAM = 'sig'

/**
 * Build a shareable URL from the current state.
 * Photos are stripped (URLs have size limits).
 */
export function buildShareUrl(state) {
  const payload = {
    v: 3,
    companyName:    state.companyName,
    openMilvus:     state.openMilvus,
    startService:   state.startService,
    trainHelpdesk:  state.trainHelpdesk,
    trainMaintenance: state.trainMaintenance,
    trainUpdates:   state.trainUpdates,
    writeReport:    state.writeReport,
    collectClientSig: state.collectClientSig,
    collectTechSig: state.collectTechSig,
    closeCall:      state.closeCall,
    checkSatisfaction: state.checkSatisfaction,
    observations:   state.observations,
    clientName:     state.clientName,
    technicians:    state.technicians,   // multiple techs
    customFields:   state.customFields,
    customSections: (state.customSections||[]).map(s=>({...s,values:{}})),
    machines: state.machines.map(m => ({
      ...m,
      photos: [],   // strip photos
    })),
    infrastructures: state.infrastructures.map(i => ({
      ...i,
      photos: [],
    })),
    pdfMargins: state.pdfMargins,
  }

  const json    = JSON.stringify(payload)
  const encoded = btoa(encodeURIComponent(json))
  const url     = new URL(window.location.href)
  url.searchParams.set(PARAM, encoded)
  return url.toString()
}

/**
 * Read state from URL param (if present).
 * Returns null if no param or parse error.
 */
export function readShareParam() {
  try {
    const url     = new URL(window.location.href)
    const encoded = url.searchParams.get(PARAM)
    if (!encoded) return null
    const json    = decodeURIComponent(atob(encoded))
    const parsed  = JSON.parse(json)
    if (!parsed?.v) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Remove the share param from URL without page reload.
 */
export function clearShareParam() {
  const url = new URL(window.location.href)
  url.searchParams.delete(PARAM)
  window.history.replaceState({}, '', url.toString())
}

/**
 * Copy text to clipboard. Returns true on success.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}
