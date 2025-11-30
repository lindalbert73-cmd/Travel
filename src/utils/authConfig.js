import { STORAGE_KEYS } from '../config/storageKeys'

export function hashPassword(email, password) {
  // Simple (nicht sichere) Hash-Funktion für lokale Speicherung
  const raw = `${email}::${password}`
  // btoa kann in älteren Browsern fehlschlagen, deshalb try/catch
  try {
    return window.btoa(raw)
  } catch (e) {
    return raw
  }
}

export function loadAuthConfig() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.auth)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load auth config', e)
    return null
  }
}

export function saveAuthConfig(cfg) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(cfg))
  } catch (e) {
    console.error('Failed to save auth config', e)
  }
}
