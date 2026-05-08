/* ================================================================
   Signum Image Compression
   Strategy:
   1. Decode image into canvas
   2. Resize longest side to max 1600px (enough for PDF quality)
   3. Binary-search JPEG quality to hit ≤ 200 KB
   4. Return compressed base64 dataUrl
   ================================================================ */

const MAX_SIDE   = 1600   // px — keeps detail without bloating
const TARGET_KB  = 220    // target max size in KB
const MIN_Q      = 0.45   // never go below this quality

/**
 * @param {string} dataUrl  — original base64 image dataUrl
 * @returns {Promise<string>} — compressed base64 dataUrl
 */
export async function compressImage(dataUrl) {
  if (!dataUrl) return dataUrl

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // ── Step 1: Calculate new dimensions ──────────────────────
      let { width: w, height: h } = img
      if (w > MAX_SIDE || h > MAX_SIDE) {
        if (w >= h) { h = Math.round(h * MAX_SIDE / w); w = MAX_SIDE }
        else        { w = Math.round(w * MAX_SIDE / h); h = MAX_SIDE }
      }

      // ── Step 2: Draw to canvas ────────────────────────────────
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled  = true
      ctx.imageSmoothingQuality  = 'high'
      ctx.drawImage(img, 0, 0, w, h)

      // ── Step 3: Check if already small enough ─────────────────
      // PNG images (screenshots, logos): keep as webp at quality 0.85
      const isPng = dataUrl.startsWith('data:image/png')
      if (isPng) {
        const webp = canvas.toDataURL('image/webp', 0.85)
        // If webp is still large, compress further
        const kb = Math.round(webp.length * 0.75 / 1024)
        resolve(kb <= TARGET_KB ? webp : binarySearch(canvas))
        return
      }

      // ── Step 4: Binary-search quality for JPEG ─────────────────
      resolve(binarySearch(canvas))
    }
    img.onerror = () => resolve(dataUrl) // fallback: return original
    img.src = dataUrl
  })
}

function binarySearch(canvas) {
  // Try q=0.82 first (usually good enough)
  const fast = canvas.toDataURL('image/jpeg', 0.82)
  if (fast.length * 0.75 / 1024 <= TARGET_KB) return fast

  // Binary search between MIN_Q and 0.82
  let lo = MIN_Q, hi = 0.82, best = fast
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2
    const out  = canvas.toDataURL('image/jpeg', mid)
    const kb   = out.length * 0.75 / 1024
    if (kb <= TARGET_KB) { best = out; lo = mid }
    else                 { hi = mid }
  }
  return best
}

/**
 * Compress all photos in a state object in-place (returns new state).
 * Safe to call before saving — won't modify the originals in React state.
 */
export async function compressStatePhotos(state) {
  const compressMachine = async (m) => ({
    ...m,
    photos: await Promise.all(
      m.photos.map(async p => ({
        ...p,
        dataUrl: p.dataUrl ? await compressImage(p.dataUrl) : null,
      }))
    ),
  })

  const compressInfra = async (i) => ({
    ...i,
    photos: await Promise.all(
      i.photos.map(async p => ({
        ...p,
        dataUrl: p.dataUrl ? await compressImage(p.dataUrl) : null,
      }))
    ),
  })

  return {
    ...state,
    machines:        await Promise.all(state.machines.map(compressMachine)),
    infrastructures: await Promise.all(state.infrastructures.map(compressInfra)),
    clientSignature: state.clientSignature
      ? await compressImage(state.clientSignature) : null,
    techSignature:   state.techSignature
      ? await compressImage(state.techSignature) : null,
  }
}
