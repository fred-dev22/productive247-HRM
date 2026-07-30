// Formatte une date backend (YYYY-MM-DD ou ISO complet type
// 2026-07-29T00:00:00.000Z) en DD-MM-YYYY. Extrait directement les chiffres
// du préfixe de la chaîne plutôt que de passer par `new Date()` — un
// `@db.Date` Prisma sérialise en minuit UTC, et `new Date(iso).getDate()`
// décale d'un jour dans les fuseaux horaires négatifs (ex: UTC-3).
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  const [, y, mo, d] = m
  return `${d}-${mo}-${y}`
}
