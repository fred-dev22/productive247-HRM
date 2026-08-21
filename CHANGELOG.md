# Journal des modifications

Toutes les livraisons notables du frontend sont documentees ici, une entree
par version tagguee (`vX.Y.Z`). A verifier a chaque deploiement : le numero
de version doit etre identique cote frontend et backend.

## [Non livre]

Sur `dev`/`qa`, pas encore taggue dans une version.

### Corrige
- Import CSV : accepte aussi l'antislash ("\") comme separateur de date,
  en plus de "/" et "-" (ex: `26\06\2026`).

## [1.1.0] - 2026-08-20

### Ajoute
- Types de contrat "Apprenti" et "Alternant" (creation employe, fiche,
  filtre de la liste, import CSV).
- Toast global : nouvel etat "succes" visible (en plus de chargement/erreur).
- Import CSV : indication claire pendant l'analyse du fichier (spinner +
  toast + bouton "Suivant" desactive pendant le traitement).

### Corrige
- Import CSV : reconnait les dates au format JJ/MM/AAAA.
- Import CSV : tolere les en-tetes mal accentues ou de casse differente.
- Import CSV : le bouton "Suivant" ne peut plus etre clique plusieurs fois
  par erreur pendant le traitement d'un gros fichier.
- Permission Manager : masque les permissions "Missions"/"Notes de frais"
  et "Exporter les rapports" (fonctionnalites non encore developpees).

### Deploiement
- Aucun script SQL cote frontend. Voir le CHANGELOG backend pour le script
  requis avant de deployer ce build.
- Checklist post-deploiement :
  - [ ] Version affichee dans l'app = v1.1.0, identique cote backend

## [1.0.0] - 2026-08-16

Livraison initiale chez Galana.

### Ecrans principaux
- Tableau de bord, planning employe, calendrier entreprise et organigramme
  (vue3-org-chart), gestion des conges/absences/missions/notes de frais,
  statistiques, notifications, profil, soldes individuels.
- Configuration : calendrier (jours ouvrables/feries), classification
  (categories, permissions), types de conges.
- Assistant d'onboarding pour la configuration initiale.

### Import CSV en masse
- Employes, entites, postes, metiers, categories, jours feries, types de
  conges.

### Autres
- Validation par email sans connexion (lien direct
  approuver/refuser/retourner).
- Notifications temps reel (WebSocket).
- Masquage des modules non construits (Recrutement, Formation, Paie,
  Rapports) et, temporairement, Missions/Notes de frais (accord DSI, budget).
- Design Galana (branding, couleurs, favicon), i18n FR/EN, routes en anglais.
- Nombreux correctifs d'ergonomie et de coherence entre creation et edition
  sur les differents ecrans.

### Deploiement
- Build : `dist/standalone/` via `npm run build:iis` cote backend, build
  Vite standard cote frontend.
