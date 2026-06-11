// Helpers génériques partagés — source unique (zéro duplication)

/** Initiales calculées depuis le nom complet — jamais depuis un code ou un id. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0]!.toUpperCase())
    .slice(0, 2)
    .join('')
}
