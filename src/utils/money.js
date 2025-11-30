export function formatMoney(v) {
  const num = Number(v) || 0
  return num.toFixed(2)
}
