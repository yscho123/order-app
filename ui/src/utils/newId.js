export function newOrderId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}
