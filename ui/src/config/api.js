/**
 * Vite 개발: vite.config proxy로 '' 사용 → /api → localhost:3000
 * 프로덕션: VITE_API_BASE_URL 예) https://api.example.com
 */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  if (path.startsWith('http')) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
