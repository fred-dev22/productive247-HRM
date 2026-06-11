# 🎨 Audit Design System — Alignement P247 HRM sur P247 FrontDesk

> **Objectif** : faire adopter à `p247_hrm_frontend` le design system de `P247_FD_LWL_APP` (frontdesk).
> Rédigé le 2026-06-11 — analyse statique des deux bases de code.

---

## Décisions validées

| Question | Décision |
|---|---|
| Profondeur d'alignement | **Migration Tailwind v4 complète** (tokens `@theme` + portage des composants UI du frontdesk) |
| Couleur primaire | **Vert Galana `#006B3C` conservé** — le design system devient thémable par client (le frontdesk reste orange) |
| Layout | **Sidebar 220 px conservée** (le HRM a trop de sous-sections par module), restylée aux tokens |

---

## 1. État des lieux — FrontDesk (la référence)

### 1.1 Fondations

| Aspect | Implémentation |
|---|---|
| Moteur de style | **Tailwind CSS v4** via `@tailwindcss/vite`, zéro fichier de config — tout dans [`src/style.css`](../P247_FD_LWL_APP/src/style.css) |
| Tokens | Bloc `@theme` : couleurs **oklch** sémantiques (`--color-primary`, `--color-background/foreground`, `--color-card`, `--color-muted`, `--color-secondary`, `--color-accent`, `--color-destructive`, `--color-border/input/ring`), tokens dédiés header/nav/sidebar/charts, couleurs "cue" (blue/green/yellow/red/purple/orange), rayons `--radius-sm/md/lg` |
| Thème | Orange professionnel `oklch(68.45% 0.210 41.25)` ; **dark mode** complet via classe `.dark` (redéfinition des variables) |
| Typographie | **Poppins** (Google Fonts, poids 300–700), Libre Caslon Text (serif), Roboto Mono (mono) |
| Icônes | **Lucide** (`lucide-vue-next`) — composants importés individuellement, dimensionnés en classes Tailwind (`w-4 h-4`) |
| Utilitaire classes | `cn()` = `clsx` + `tailwind-merge` dans `src/lib/utils.ts` |
| Couleur bootstrap | `src/core/theme/brandColors.ts` (fallback avant chargement CSS) + variable dupliquée dans `index.html` |

### 1.2 Bibliothèque de composants

**Primitives UI** (`src/components/ui/`, style shadcn : props `variant`/`size`, classes Tailwind, `cn()`) :
`Button` (6 variants × 4 tailles), `Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`, `Input`, `Label`, `Alert`/`AlertDescription`, `BaseFormField`/`FormInput`, `OptionsSelect`, `TableLookup`/`TableLookupField`/`TableLookupModal`/`LookupInputField`.

**Composants partagés** (`src/components/shared/`) :
`ListPageLayout` (liste complète : filtres, table triable/resizable/drag-reorder, pagination, panneau détail), `ListPageToolbar`, `SortableTableHeader`, `PaginationBar`, `FilterPanel`/`AdvancedFilterPanel`, `CardModalShell`/`CreateModalShell` (fiches/formulaires), `CommandPalette` (Ctrl+K), `KanbanView`, `TableColumnPicker`, `ConfirmDialog`, `ApprovalActionButtons`, `StatusPill` implicite via badges, `LoadingBar`/`LoadingSpinner`, `SearchBar`.

### 1.3 Layout

`DashboardLayout.vue` : **TopBar sombre** (`#212121` — recherche Ctrl+K, notifications, paramètres, aide, langue, avatar profil) + **NavBar blanche** (menus modules dynamiques via `moduleRegistry`) + contenu scrollable. Pas de sidebar verticale. Scrollbars custom colorées `--color-primary`.

---

## 2. État des lieux — HRM (à migrer)

### 2.1 Fondations

| Aspect | Implémentation |
|---|---|
| Moteur de style | **CSS pur** : [`src/assets/main.css`](src/assets/main.css) global (81 lignes) + `<style scoped>` dans chaque composant |
| Tokens | Variables CSS **hex** : palette **Galana** (vert `#006B3C`, rouge `#C8102E`), sémantiques (`--color-primary`, `--color-accent`=rouge, surfaces, texte, 5 statuts avec fonds pastel), alias rétro-compat `--p247-*` |
| Thème | Vert Galana, clair uniquement (pas de dark mode) |
| Typographie | Segoe UI, body 14 px |
| Icônes | **Tabler** webfont (`@tabler/icons-webfont`, classes `ti ti-*`) |
| Spécificité | `vue3-org-chart` pour l'organigramme ; données mock dans Pinia (pas d'API) |

### 2.2 Métriques (dimensionnement du chantier)

| Métrique | Valeur |
|---|---|
| Fichiers `.vue` | **50** (dont 47 avec `<style scoped>`) |
| Lignes de CSS scoped à convertir | **≈ 4 180** |
| Usages `var(--…)` dans les templates/styles | **≈ 1 965** |
| Usages d'icônes Tabler `ti ti-*` | **≈ 468** |

**Top fichiers par volume CSS** : `PlanningView` (206 l.), `LoginView` (200), `LeaveListView` (196), `CalendarView` (172), `OrgChartView` (163), `DashboardRH` (156), `DataTable` (155), `AbsenceRequestModal` (152), `OrgNode` (146), `EntityDetailView` (131), `MissionFormModal` (127), `AppTopNav` (119).

### 2.3 Composants existants

- **Layout** : `AppTopNav` (topbar sombre `#1A1A1A` + navbar blanche modules — déjà structurellement identique au frontdesk) + `AppSidebar` (220 px, sections/items/badges).
- **Primitives maison** (`components/ui/`) : `DataTable`, `StatusPill`, `UserAvatar`, `SearchableDropdown`, `EmployeeSelector`, `ForWhomSelector`, `ValidationTimeline`.
- **Modales métier** : `AbsenceRequestModal`, `EmployeeFormModal`, `EntityFormModal`, `ExpenseFormModal`, `MissionFormModal`/`MissionDetailModal`, `LeaveTypeFormModal`.
- **27 vues** : dashboards RH/employé, absences (3), congés (2), missions, frais, entités (4), employés (2), calendrier, planning, équipe, validation, organigramme, configuration (3), rapports, login, onboarding, placeholders.

---

## 3. Analyse des écarts

| Aspect | FrontDesk | HRM | Écart |
|---|---|---|---|
| Moteur | Tailwind v4 `@theme` | CSS pur scoped | Installation + conversion ~4 200 lignes |
| Format couleurs | oklch | hex | Conversion des tokens |
| Primaire | Orange | Vert Galana | **Conservé vert** (décision) — seul le token change |
| Police | Poppins | Segoe UI | Lien Google Fonts + `--font-sans` |
| Icônes | Lucide (composants) | Tabler (webfont) | ~468 occurrences à remplacer |
| Primitives UI | shadcn-like + `cn()` | maison ad hoc | Portage de la lib `ui/` |
| Listes | `ListPageLayout` riche | `DataTable` simple | Portage/adaptation |
| Modales | `CardModalShell`/`CreateModalShell` | modales ad hoc | Refonte sur les shells |
| Layout | TopBar + NavBar | TopBar + NavBar + Sidebar | **Sidebar conservée** (décision) → créer des tokens sidebar (déjà prévus dans le @theme frontdesk) |
| Dark mode | Oui | Non | Vient "gratuitement" avec les tokens (à activer plus tard) |
| Recherche | CommandPalette Ctrl+K | input simple dans topbar | Portage possible (bonus) |

### 3.1 Points de friction techniques identifiés

1. **Collision de noms de variables** ⚠️ — c'est le piège principal :
   - HRM : `--color-accent` = **rouge Galana** (utilisé dans ~19 fichiers).
   - FrontDesk/Tailwind : `--color-accent` = **surface neutre de hover** (gris clair).
   Si on importe le `@theme` frontdesk tel quel, tous les accents rouges deviennent gris.
   → **Action** : renommer dans le HRM `var(--color-accent[-dark|-light])` → `var(--galana-red[-dark|-light])` AVANT d'introduire le `@theme`.
   - Collisions bénignes : `--color-primary` (même sens, devient le token @theme), `--color-border` (même sens, valeurs proches).
2. **Sémantique des statuts** : le frontdesk n'a pas de tokens `--color-success/warning/info(-bg)` (il a des "cue colors"). Le HRM en dépend fortement (`StatusPill`, badges). → Les **ajouter au `@theme`** HRM comme extension propre du design system (ils génèrent alors des utilitaires `bg-success-bg`, `text-warning`…).
3. **Couche de compatibilité nécessaire** : avec ~1 965 usages de `var(--…)`, la migration ne peut être que progressive. Tant que toutes les vues ne sont pas converties, un bloc `:root` hors `@theme` doit maintenir les alias legacy (`--p247-*`, `--color-bg`, `--color-surface`, `--color-text*`…) **pointant vers les nouveaux tokens**, pour que l'app reste visuellement cohérente pendant toute la migration.
4. **Icônes** : remplacer la webfont Tabler par Lucide est mécanique mais touche 468 occurrences ; à faire vue par vue (pas en find/replace global — les noms diffèrent : `ti ti-layout-dashboard` → `LayoutDashboard`).
5. **`vue3-org-chart`** injecte son propre markup : `OrgChartView`/`OrgNode`/`OrgChartTree` garderont probablement du CSS scoped (`:deep()`) même après migration — c'est acceptable, le frontdesk lui-même garde du scoped ponctuel.
6. **Pas de `components.d.ts`/auto-import** côté HRM : les imports de composants UI seront explicites (comme le frontdesk qui utilise `unplugin-vue-components` — optionnel, pas indispensable).

---

## 4. Plan de migration

### Phase 0 — Fondations (≈ ½ journée) 🔧
1. **Dépendances** : `tailwindcss` + `@tailwindcss/vite` (v4), `clsx`, `tailwind-merge`, `lucide-vue-next` ; brancher le plugin dans `vite.config.ts`.
2. **Pré-requis anti-collision** : renommer `--color-accent*` → `--galana-red*` dans les 19 fichiers concernés (remplacement textuel, du plus long au plus court).
3. **Nouveau `main.css`** :
   - `@import 'tailwindcss';`
   - Bloc `@theme` = copie du frontdesk avec `--color-primary` (+ ring, nav-active, sidebar-primary, chart-1) basculés sur le **vert Galana** ; ajout des tokens statuts `--color-success/warning/danger/info(+-bg)` et organigramme.
   - Bloc `:root` de **compatibilité legacy** : `--p247-*`, `--color-bg → var(--color-background)`, `--color-surface → var(--color-card)`, `--color-text → var(--color-foreground)`, etc.
   - `@layer base` : `body { font-family: var(--font-sans); font-size: 14px }` (taille 14 px conservée, choix HRM densité).
4. **`index.html`** : lien Poppins, `lang="fr"`, titre `Productive 247 HRM`.
5. **`src/lib/utils.ts`** : `cn()` (copie frontdesk).
6. ✅ Vérification : `type-check` + `build` + lancement visuel — l'app doit être **identique visuellement** (sauf police Poppins).

### Phase 1 — Portage des primitives UI (≈ ½ journée)
Copier depuis le frontdesk vers `src/components/ui/` et adapter (icônes Lucide) :
`Button`, `Card` + sous-composants, `Input`, `Label`, `Alert`/`AlertDescription`, `BaseFormField`/`FormInput`, `OptionsSelect`.
Conserver et restyler en Tailwind les primitives HRM sans équivalent : `StatusPill` (sur tokens statuts), `UserAvatar`, `ValidationTimeline`, `SearchableDropdown` (ou remplacement par `OptionsSelect` selon les cas).
✅ Vérification : page de test ou Login migrée comme vitrine.

### Phase 2 — Shell de navigation (≈ 1 jour)
- `AppTopNav` → classes Tailwind sur les tokens `--color-header/nav/nav-active` (aligné sur le `TopBar`/`NavBar` frontdesk : mêmes espacements, badge Ctrl+K, dropdowns).
- `AppSidebar` → conservée, restylée sur les tokens `--color-sidebar-*` du @theme.
- Scrollbars custom du `DashboardLayout` frontdesk.
✅ Vérification visuelle des deux rôles (RH / employé) et des 5 modules.

### Phase 3 — Composants transverses (≈ 1–2 jours)
- `DataTable` → adopter le pattern visuel `ListPageLayout`/`SortableTableHeader`/`PaginationBar` du frontdesk (portage partiel ou restylage, selon le besoin réel de tri/resize côté HRM).
- Modales métier (7) → refonte sur les patterns `CardModalShell`/`CreateModalShell`.
- `ComingSoonView`, `LeaveRequestRow`, sélecteurs.
✅ Vérification : `type-check` + revue visuelle par composant.

### Phase 4 — Migration des vues par lots (≈ 3–5 jours)
Ordre proposé (du plus visible au plus périphérique), chaque lot = conversion scoped CSS → Tailwind + icônes Lucide + suppression des `var(--p247-*)` :
1. `LoginView`, `DashboardRH`, `DashboardEmployee`
2. Absences + congés (5 vues + modale)
3. Missions + frais (2 vues + 3 modales)
4. Employés + entités (6 vues + 2 modales) — `OrgNode`/organigramme avec `:deep()` résiduel accepté
5. Calendrier, planning, équipe, validation
6. Configuration (3), rapports, placeholders, onboarding
✅ Vérification par lot : build + revue visuelle (dev server).

### Phase 5 — Nettoyage et finitions (≈ ½ journée)
- Supprimer la couche de compatibilité `:root` legacy et `@tabler/icons-webfont` une fois les 468 icônes remplacées.
- Supprimer les alias `--p247-*` et `--galana-*` devenus inutiles (les rouges restent via un token propre, ex. `--color-brand-accent`).
- Optionnel : activer le **dark mode** (les tokens `.dark` sont déjà dans le @theme porté) ; porter la **CommandPalette** Ctrl+K.
- `pnpm lint` + `format` sur l'ensemble.

### Estimation globale : **6 à 9 jours** de travail effectif.

---

## 5. Risques & points d'attention

| Risque | Mitigation |
|---|---|
| Régression visuelle silencieuse pendant la migration (1 965 usages de variables) | Couche de compatibilité `:root` dès la phase 0 ; migration par lots avec revue visuelle systématique |
| Collision `--color-accent` (rouge → gris) | Renommage **avant** introduction du `@theme` (phase 0, étape 2) |
| Densité d'interface : le frontdesk est plus aéré (h-10 boutons, body 16px Tailwind par défaut) alors que le HRM est dense (13–14 px, paddings serrés) | Conserver body 14 px ; ajuster éventuellement les tailles `sm` des primitives portées |
| `vue3-org-chart` incompatible utilitaires | Garder du CSS scoped `:deep()` localisé sur 3 fichiers |
| Tabler → Lucide : pas de correspondance 1:1 de tous les noms | Remplacement manuel vue par vue, table de correspondance à constituer au fil de l'eau |
| Le HRM est en mock/prototype : risque de refonte métier parallèle | Migrer le design sans toucher à la logique des stores |

---

## 6. Cibles d'architecture finale (HRM)

```
src/
├── assets/main.css          ← @import tailwindcss + @theme (tokens verts Galana) + .dark
├── lib/utils.ts             ← cn() (clsx + tailwind-merge)
├── components/
│   ├── ui/                  ← primitives portées du frontdesk (Button, Card, Input, …)
│   │                          + primitives HRM restylées (StatusPill, UserAvatar, …)
│   ├── shared/              ← (optionnel) ListPageLayout-like, PaginationBar, modal shells
│   ├── AppTopNav.vue        ← Tailwind, tokens header/nav
│   └── AppSidebar.vue       ← Tailwind, tokens sidebar (conservée)
└── views/…                  ← classes Tailwind, icônes lucide-vue-next
```

*Document rédigé par analyse statique — préalable à la migration, aucun code modifié à ce stade.*
