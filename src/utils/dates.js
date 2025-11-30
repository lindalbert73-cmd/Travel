export function getTodayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

export function withinLastDays(dateISO, days) {
  const today = new Date(getTodayISO())
  const target = new Date(dateISO)
  const diff = (today - target) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}
