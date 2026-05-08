/* ================================================================
   Signum Storage — IndexedDB + AES-GCM encryption (Web Crypto API)
   Key is derived per-device from a stable fingerprint.
   Photos are stored as separate blobs (no base64 size explosion).
   ================================================================ */

const DB_NAME    = 'signum_db'
const DB_VERSION = 1
const STORE_DATA = 'state'
const STORE_BLOB = 'blobs'
const KEY_STATE  = 'main'

// ── Open / init DB ────────────────────────────────────────────────────────────
let _db = null
async function getDB() {
  if (_db) return _db
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_DATA))
        db.createObjectStore(STORE_DATA)
      if (!db.objectStoreNames.contains(STORE_BLOB))
        db.createObjectStore(STORE_BLOB)
    }
    req.onsuccess  = e => { _db = e.target.result; resolve(_db) }
    req.onerror    = () => reject(req.error)
  })
}

// ── Crypto helpers ────────────────────────────────────────────────────────────
async function getKey() {
  // Derive a stable AES-GCM key from a device fingerprint stored in localStorage.
  // This is "encryption at rest" against casual data inspection,
  // not against a determined local attacker (acceptable trade-off for a field tool).
  let raw = localStorage.getItem('signum_ek')
  if (!raw) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    raw = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('')
    localStorage.setItem('signum_ek', raw)
  }
  const keyBytes = new Uint8Array(raw.match(/.{2}/g).map(h => parseInt(h, 16)))
  return crypto.subtle.importKey('raw', keyBytes, { name:'AES-GCM' }, false, ['encrypt','decrypt'])
}

async function encrypt(data) {
  const key = await getKey()
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ct  = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)))
  // Store iv + ciphertext together
  const out = new Uint8Array(12 + ct.byteLength)
  out.set(iv, 0)
  out.set(new Uint8Array(ct), 12)
  return out.buffer
}

async function decrypt(buffer) {
  const key   = await getKey()
  const bytes = new Uint8Array(buffer)
  const iv    = bytes.slice(0, 12)
  const ct    = bytes.slice(12)
  const plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct)
  return JSON.parse(new TextDecoder().decode(plain))
}

// ── IDB helpers ───────────────────────────────────────────────────────────────
async function idbPut(store, key, value) {
  const db  = await getDB()
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(value, key)
    req.onsuccess = () => res()
    req.onerror   = () => rej(req.error)
  })
}

async function idbGet(store, key) {
  const db = await getDB()
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => res(req.result ?? null)
    req.onerror   = () => rej(req.error)
  })
}

async function idbDel(store, key) {
  const db = await getDB()
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(key)
    req.onsuccess = () => res()
    req.onerror   = () => rej(req.error)
  })
}

// ── Photo blob storage ────────────────────────────────────────────────────────
// Converts base64 dataUrl → Blob → stored directly in IDB (no base64 overhead)
export async function saveBlob(id, dataUrl) {
  if (!dataUrl) return
  const res  = await fetch(dataUrl)
  const blob = await res.blob()
  await idbPut(STORE_BLOB, id, blob)
}

export async function loadBlob(id) {
  const blob = await idbGet(STORE_BLOB, id)
  if (!blob) return null
  return new Promise(res => {
    const reader = new FileReader()
    reader.onload = e => res(e.target.result)
    reader.readAsDataURL(blob)
  })
}

export async function deleteBlob(id) {
  await idbDel(STORE_BLOB, id)
}

// ── Main state save / load ────────────────────────────────────────────────────
export async function saveState(stateObj) {
  try {
    // Strip photo dataUrls — photos are stored as blobs separately
    const stripped = {
      ...stateObj,
      machines: stateObj.machines.map(m => ({
        ...m,
        photos: m.photos.map(p => ({ ...p, dataUrl: null })),
      })),
      infrastructures: stateObj.infrastructures.map(i => ({
        ...i,
        photos: i.photos.map(p => ({ ...p, dataUrl: null })),
      })),
      history: stateObj.history.map(h => ({
        ...h,
        snapshot: {
          ...h.snapshot,
          clientSignature: null,
          techSignature:   null,
        },
      })),
    }
    const encrypted = await encrypt(stripped)
    await idbPut(STORE_DATA, KEY_STATE, encrypted)
  } catch (e) {
    console.error('[Signum Storage] Save failed:', e)
  }
}

export async function loadState() {
  try {
    const buffer = await idbGet(STORE_DATA, KEY_STATE)
    if (!buffer) return null
    return await decrypt(buffer)
  } catch (e) {
    console.error('[Signum Storage] Load failed:', e)
    return null
  }
}

export async function clearAll() {
  const db = await getDB()
  await new Promise((res, rej) => {
    const tx = db.transaction([STORE_DATA, STORE_BLOB], 'readwrite')
    tx.objectStore(STORE_DATA).clear()
    tx.objectStore(STORE_BLOB).clear()
    tx.oncomplete = res
    tx.onerror    = () => rej(tx.error)
  })
}
