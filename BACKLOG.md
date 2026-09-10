# Backlog

Idées et travaux identifiés mais pas encore planifiés ni chiffrés — à
distinguer du [CHANGELOG.md](CHANGELOG.md) qui ne liste que ce qui est
réellement livré. Une entrée ici n'est retirée que lorsqu'elle est faite (et
documentée dans le changelog) ou explicitement abandonnée.

## Administration

- **Conversion candidat → employé (Employee Master).** Demande explicite du
  client (`liste-besoins/Recruitment.csv`, item 4) : *"Parmi les notes et les
  observations, il est possible de transférer immédiatement un candidat à un
  employé."* Le document de spec fonctionnelle appelle ça l'**"Inclusion d'un
  Potentiel"** dans le fichier du Personnel, *"lorsqu'il est confirmé à
  l'issue du processus de recrutement"* (doc2, section 7.6.4, "Objet
  Potentiel"). Le module Recrutement a maintenant un vrai backend, mais la
  passerelle vers le module Employés n'est toujours **pas** branchée : le
  bouton "Créer le profil employé" sur la fiche d'un contrat accepté
  (ContractCard.vue) ne fait que positionner un flag
  (`RecruitmentContract.EmployeeProfileCreated`), la confirmation de période
  d'essai (`trialStore.convert()`) ne fait que changer un statut. Reste à
  brancher pour de vrai : pré-remplir ce qu'on connaît déjà (nom, poste,
  entité, date de début, salaire) et demander le reste (naissance, situation
  matrimoniale, pièce d'identité, matricule…) avant de créer un vrai
  `Employee` via l'API existante.

- **Rappels des échéances à venir sur une période donnée.** Idée remontée en
  revue hebdo du 29/08 en relisant les documents client sur l'Administration
  (pas encore appliquée, juste mise de côté) : pouvoir choisir une période
  (ex. aujourd'hui à la fin de l'année) et voir/être notifié des échéances qui
  tombent dedans, fins de CDD, fins de stage, anniversaires des employés. Rien
  n'existe aujourd'hui pour ça dans le module Administration.

## Recrutement

Le module a maintenant un vrai backend (`productive247-hrm-backend`,
`src/modules/recruitment`, branche `dev-recrutement-module`). Les points
ci-dessous restent ouverts.

- **Dépôt de CV réel (portail carrière).** Le portail public ne conserve
  aujourd'hui que le **nom** du fichier CV (`RecruitmentApplication.CvFileName`),
  pas le fichier lui-même : pas d'upload, pas de stockage. Brancher un vrai
  téléversement (SharePoint via le module Attachment déjà en place pour les
  autres domaines, en ajoutant `RecruitmentApplication` /`JobOffer` à
  `ATTACHMENT_ENTITY_TYPES`), avec une limite de taille et un contrôle de
  type. Concerne les 3 points d'entrée : portail offre, portail spontané,
  saisie RH.

- **Anti-spam du portail carrière.** Les endpoints publics (`/public/careers/*`)
  n'ont aucune protection : ni honeypot, ni délai minimal, ni rate-limit, ni
  CAPTCHA. À ajouter avant une vraie mise en ligne du portail.

- **Diffusion multi-plateformes des offres.** Le client mentionne la
  *"création et diffusion des offres d'emploi sur différentes plateformes"*
  (doc1, ATS). Aujourd'hui, une offre publiée n'est visible que sur notre
  propre portail carrière (`/careers`). Publier vers de vraies plateformes
  externes (LinkedIn, jobboards locaux…) demande de vraies intégrations
  tierces.

- **Invitations calendrier — suivi des réponses.** À la planification d'un
  entretien, le backend envoie bien une invitation `.ics`
  (`METHOD:REQUEST`) au candidat et aux participants, et une annulation
  (`METHOD:CANCEL`) à l'annulation. En revanche les réponses (Accepté /
  Refusé / Provisoire) des invités ne sont pas récupérées : il faudrait un
  webhook Graph ou un polling pour refléter le `PARTSTAT` dans l'app.
