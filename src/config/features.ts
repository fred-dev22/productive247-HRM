// Fonctionnalités temporairement désactivées pour raisons budgétaires,
// accord validé avec le DSI — seront réactivées dans un deuxième temps.
// Rien n'est supprimé (routes, code, données) : seule la navigation/l'UI
// est masquée, pour permettre une réactivation en changeant juste ce flag.
export const MISSIONS_EXPENSES_ENABLED: boolean = false

// Modules encore à l'état de placeholder (aucune fonctionnalité réelle
// derrière — voir router/index.ts, tous sur le composant PlaceholderView) :
// Recrutement, Formation, Paie, Rapports (l'onglet du haut, distinct de la
// section "Rapports" du sidebar Administration qui elle est réelle). Masqués
// tant qu'ils ne sont pas construits, pas pour une raison budgétaire.
export const PLACEHOLDER_MODULES_ENABLED: boolean = false
