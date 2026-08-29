# Backlog

Idées et travaux identifiés mais pas encore planifiés ni chiffrés — à
distinguer du [CHANGELOG.md](CHANGELOG.md) qui ne liste que ce qui est
réellement livré. Une entrée ici n'est retirée que lorsqu'elle est faite (et
documentée dans le changelog) ou explicitement abandonnée.

## Administration

- **Écrans manager pour les expressions de besoin.** Aujourd'hui, la création
  d'une expression de besoin n'existe que côté module Recrutement (mock, voir
  `dev-recrutement-module`), accessible à qui a accès à ce module. Le
  processus du client suppose qu'un manager/département (espace employé,
  hors RH) puisse lui-même déposer une demande de poste ("les autres
  départements demandent un employé", cf. `liste-besoins/Recruitment.csv`).
  Il faudra ajouter un écran côté espace employé/Administration pour ça, une
  fois le module Recrutement branché à un vrai backend. Dépend aussi du
  chantier de permissions du module Recrutement (accès et rôles pas encore
  définis).

- **Conversion candidat → employé (Employee Master).** Demande explicite du
  client (`liste-besoins/Recruitment.csv`, item 4) : *"Parmi les notes et les
  observations, il est possible de transférer immédiatement un candidat à un
  employé."* Rien de ça n'existe aujourd'hui — le pipeline Recrutement
  (mock) est entièrement déconnecté du vrai module Employés
  (`stores/employees.ts`), y compris à la conversion de la période d'essai
  (`trialStore.convert()` ne fait que changer un statut fictif).
  Déclencheur retenu : **à l'acceptation du contrat**
  (`Contract.status === 'AcceptedByCandidate'`) — un bouton "Créer le profil
  employé" à ce moment-là, qui pré-remplit ce qu'on connaît déjà du candidat
  (nom, poste, entité, date de début, salaire) et demande le reste
  (naissance, situation matrimoniale, pièce d'identité, matricule…) avant de
  créer un vrai `Employee` via l'API existante. Nécessite un vrai backend
  Recrutement.
