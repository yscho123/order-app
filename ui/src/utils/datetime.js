/** @param {number} ts */
export function formatOrderPlacedAt(ts) {
  const d = new Date(ts)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}월 ${day}일 ${h}:${min}`
}
