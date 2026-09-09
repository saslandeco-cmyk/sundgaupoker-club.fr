# Le Registre — gestion de tournois de poker

Application Next.js pour créer et suivre des tournois de poker : nom, date,
lieu, description, stack de départ, durée des rounds, pauses, table finale,
nombre de places, places restantes, inscription en ligne ou sur place. Le
design de la page publique et des cartes de tournoi s'inspire de la page
"Tous les tournois" du Sundgau Poker Club : thème sombre, cartes avec
bandeau illustré, et bouton d'inscription pleine largeur en orange/rouille.

- **Page publique (`/`)** : lecture seule, les visiteurs consultent les
  tournois et peuvent s'inscrire (prénom, nom, email, pseudo facultatif) si
  l'inscription en ligne est activée. Un email de confirmation leur est
  envoyé, et l'organisateur reçoit une notification récapitulative.
- **Back office (`/admin`)** : réservé aux organisateurs, protégé par mot de
  passe. Permet de créer et modifier des tournois, de consulter la liste des
  inscrits et de gérer (supprimer une inscription, supprimer un tournoi).

## Stack technique

- **Next.js 16** (App Router, Turbopack) — dernière version stable
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- Police auto-hébergée (**Manrope Variable**), livrée en fichiers `.woff2`
  statiques dans `public/fonts/` (pas de dépendance npm dédiée, donc aucun
  accès à Google Fonts ni risque d'oubli de réinstallation après une mise à
  jour du projet)
- **PostgreSQL** (`postgres.js`) pour la persistance — schéma créé et
  pré-rempli automatiquement au premier démarrage, aucune migration manuelle
- Authentification admin par mot de passe partagé + cookie de session signé
  (HMAC), sans dépendance externe
- Notifications par email via **SMTP** (`nodemailer`), compatible avec
  n'importe quel fournisseur (Gmail, OVH, Mailgun, Brevo…)

## Installation

Prérequis : Node.js 18.18 ou plus récent (Node 20+ recommandé), et une base
**PostgreSQL** (voir ci-dessous).

### 1. Obtenir une base Postgres

N'importe laquelle convient (plan gratuit largement suffisant) :

- **En local avec Docker** (le plus simple) :
  ```bash
  docker compose up -d
  ```
  donne `DATABASE_URL=postgresql://poker:poker@localhost:5432/poker_tournaments`.
- **Hébergée** : [Neon](https://neon.tech), [Supabase](https://supabase.com)
  ou [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) —
  créez un projet, copiez la chaîne de connexion fournie.

### 2. Configurer et lancer

```bash
npm install
cp .env.example .env.local   # définissez ADMIN_PASSWORD et DATABASE_URL
npm run dev
```

Les tables sont créées automatiquement au premier démarrage, et pré-remplies
avec 3 tournois d'exemple si la base est vide — aucune commande de migration
à lancer.

Ouvrez ensuite [http://localhost:3000](http://localhost:3000) (redirige vers
`/tournois`) pour la page publique, et
[http://localhost:3000/admin](http://localhost:3000/admin) pour
le back office (mot de passe = `ADMIN_PASSWORD`) — vous serez automatiquement
redirigé vers la page de connexion si vous n'êtes pas encore authentifié.

🔒 L'URL de connexion elle-même est volontairement peu devinable :
[http://localhost:3000/admin@403115](http://localhost:3000/admin@403115).
Ce n'est qu'une mesure d'obscurité en plus de la protection par mot de passe
(qui reste la vraie protection) ; changez ce segment dans le code
(`src/app/admin@403115/`) si vous voulez votre propre URL.

⚠️ Si `ADMIN_PASSWORD` n'est pas défini, un mot de passe par défaut
(`poker-admin`) est utilisé — pratique pour tester rapidement, mais à changer
absolument avant toute mise en ligne réelle.

📧 Les notifications par email nécessitent de renseigner `ADMIN_EMAIL` et les
variables `SMTP_*` / `MAIL_FROM` dans `.env.local` (voir `.env.example`).
Sans cette configuration, l'application fonctionne normalement, mais aucun
email n'est réellement envoyé (un message l'indique dans les logs).

## Ouvrir dans VS Code

```bash
code poker-tournaments
```

Le dossier est un projet Next.js standard : aucune configuration
supplémentaire n'est nécessaire, il suffit d'ouvrir le dossier puis de lancer
`npm install` et `npm run dev` dans le terminal intégré.

## Fonctionnalités

### Espace public (`/tournois`)

- `/` redirige automatiquement vers `/tournois`, la page réellement affichée
  par l'onglet "Tournois" du menu.
- Sous l'en-tête, la ligne "X tournois à venir" partage sa rangée avec un
  appel à l'action **"Pas encore membre ? [C'est par ici →]"** aligné à
  droite, qui renvoie vers
  https://sundgau-poker-club.fr/demande-dinscription/ (même onglet).
- Cette page porte une balise `<meta name="robots" content="noindex, nofollow">`
  (définie dans `src/app/tournois/page.tsx`) : les moteurs de recherche ne
  l'indexeront pas. C'est la méthode recommandée pour exclure une page
  précise de l'indexation sans bloquer son exploration — contrairement à un
  `Disallow` dans `robots.txt`, qui empêcherait justement les moteurs de
  voir cette balise et pourrait laisser l'URL indexée "à vide" si elle est
  liée depuis ailleurs.

- Cartes de tournoi affichées dans cet ordre : bannière illustrée (statut
  "Inscription ouverte" / "Complet" / "Terminé" superposé), nom, description,
  puis une grille de 2 colonnes (icône + libellé) regroupant **date**,
  **lieu**, **début du tournoi**, **stack de départ**, **round**, **pause**
  et **table finale** ; le nombre de places restantes reste seul sur sa
  propre ligne en bas de carte.
- **Inscription** : si l'inscription en ligne est activée et qu'il reste des
  places, un bouton "S'inscrire" ouvre un formulaire demandant **prénom**,
  **nom**, **email** et **pseudo (facultatif)**. L'email est obligatoire
  côté public : c'est lui qui reçoit l'email de confirmation (voir
  "Notifications par email" plus bas).
- **Une seule inscription par personne et par tournoi** : la combinaison
  prénom + nom (insensible à la casse, aux accents et aux espaces) sert de
  clé d'unicité ; une seconde tentative avec la même identité est refusée
  avec un message clair. Le pseudo, facultatif, n'est pas utilisé comme
  critère car il n'est pas toujours renseigné.
- **Inscription réservée aux membres autorisés** : seules les adresses email
  présentes dans la liste gérée par l'administrateur (`/admin/members`)
  peuvent s'inscrire depuis la page publique. Une adresse absente de la
  liste reçoit le message *"Cette adresse email n'est pas autorisée à
  s'inscrire. Contactez l'organisateur du club."*. Tant que la liste est
  vide, personne ne peut s'inscrire en ligne — l'administrateur doit
  explicitement autoriser chaque personne. Cette règle ne s'applique **pas**
  à l'inscription manuelle par un administrateur (voir plus bas) : un
  organisateur connecté peut toujours inscrire n'importe qui, y compris une
  personne hors liste.
- Les noms des inscrits ne sont jamais exposés publiquement : l'API publique
  ne renvoie qu'un nombre de places prises, jamais l'identité des joueurs.
- En-tête avec le logo du club et les liens de navigation — tous reliés au
  site vitrine réel du club (même onglet) : Accueil et Le club vers
  https://sundgau-poker-club.fr/, Tournois vers la page publique de cette
  application, Classement vers /classement/, Forum (en cours) vers /forum/,
  Devenir membre du club vers /demande-dinscription/, et Autres actualités
  vers /actualites/. **Sur PC (≥ 1024px)**, ces liens s'affichent en ligne,
  comme des onglets. **Sur mobile et tablette (< 1024px)**, ils sont
  regroupés derrière un bouton **"Menu"** (icône hamburger) qui ouvre un
  menu déroulant ; il se ferme au clic sur un lien, en cliquant ailleurs sur
  la page, ou avec la touche Échap. Un lien "Espace
  organisateur" (hors du menu) mène au back office.

### Back office (`/admin`)

- Connexion par mot de passe (`/admin@403115`), session valable 12h.
- **Créer un tournoi** : nom, description, **date** (jour seul, sans heure),
  lieu, **début du tournoi**, **stack de départ**, **round**, **pause**,
  **table finale** (tous affichés en front office), nombre de places, et
  bascule "inscription en ligne".
- **Modifier un tournoi existant** : le bouton "Modifier" sur chaque carte
  ouvre le même formulaire pré-rempli ; le nombre de places ne peut pas être
  réduit sous le nombre d'inscrits actuels.
- **Dupliquer un tournoi** : le bouton "Dupliquer" crée une copie (nom
  suffixé "(copie)", mêmes informations pratiques) sans reprendre les
  inscrits, et ouvre aussitôt le formulaire de modification pour ajuster la
  date ou le lieu de la nouvelle session.
- **Gérer les inscrits** : chaque carte permet de déplier la liste des
  personnes inscrites (prénom, nom, email, pseudo) et de retirer une
  inscription.
- **Supprimer un tournoi** (avec confirmation).
- Barre de statistiques : tournois à venir, places disponibles, inscrits au
  total, taille du registre.
- Toutes les routes de création/modification/duplication/suppression sont
  protégées côté serveur : un appel direct à l'API sans session valide
  renvoie une erreur 401.

### Membres autorisés (`/admin/members`)

- Tableau de la liste des personnes autorisées à s'inscrire en ligne
  (email + nom facultatif, pour s'y retrouver), avec recherche.
- **Ajouter un membre** : formulaire email + nom facultatif ; une adresse
  déjà présente dans la liste est rejetée (message clair, pas de doublon
  silencieux).
- **Retirer un membre** : bouton "Retirer" sur chaque ligne — la personne ne
  pourra alors plus s'inscrire tant qu'elle n'est pas de nouveau ajoutée.
- Cette liste ne concerne que l'**inscription publique** ; elle n'affecte ni
  la visibilité des tournois (toujours publique), ni la possibilité pour un
  administrateur d'inscrire manuellement qui il souhaite.

### Gestion des inscrits (`/admin/registrants`)

- Tableau listant **tous les inscrits, tous tournois confondus** (tournoi,
  prénom, nom, email, pseudo, date d'inscription), avec recherche texte et
  filtre par tournoi.
- **Inscription manuelle** : le bouton "+ Inscription manuelle" ouvre un
  formulaire (choix du tournoi, prénom, nom, email facultatif, pseudo
  facultatif) — utile pour enregistrer une inscription reçue par téléphone
  ou sur place. Les mêmes règles s'appliquent que côté public (tournoi non
  complet, non passé, pas de doublon prénom+nom), sauf que l'inscription en
  ligne n'a pas besoin d'être activée et l'email n'est pas obligatoire (sans
  lui, l'inscrit ne recevra simplement pas d'email de confirmation).
- **Suppression** d'une inscription directement depuis le tableau.
- **Export CSV** : le bouton "Exporter en CSV" télécharge un fichier
  (séparateur `;`, BOM UTF-8 pour un affichage correct des accents dans
  Excel) avec toutes les inscriptions affichées (email inclus).

### Notifications par email

Chaque inscription (publique ou manuelle) déclenche l'envoi de deux emails
via SMTP (voir `.env.example` pour la configuration) :

- **À l'administrateur** (`ADMIN_EMAIL`) : notification systématique avec un
  récapitulatif complet — prénom, nom, email, pseudo, date d'inscription, et
  toutes les informations du tournoi concerné.
- **À la personne inscrite** : email de confirmation reprenant les
  informations du tournoi (date, lieu, début du tournoi, stack de départ,
  round, pause, table finale). Envoyé uniquement si une adresse email a été
  renseignée (toujours le cas côté public, facultatif côté inscription
  manuelle admin).

Si le SMTP n'est pas configuré (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`,
`MAIL_FROM`), l'inscription fonctionne normalement mais aucun email n'est
envoyé : un message explicite apparaît dans les logs du serveur pour vous
le rappeler. L'envoi d'email est un simple effet secondaire : un échec ou
une lenteur SMTP ne fait jamais échouer l'inscription elle-même.

#### La fonction `notify()`

Toute la logique de notification est centralisée dans **`src/lib/notify.ts`**,
une fonction serveur pure, sans dépendance à Next.js, appelable depuis
**n'importe quelle Server Action** (ou Route Handler, ou script) :

```ts
"use server";
import { notify } from "@/lib/notify";

export async function maServerAction(/* ... */) {
  // ... votre logique métier (créer/valider l'inscription, etc.) ...
  await notify({ tournament, registrant });
}
```

Elle renvoie `{ adminNotified: boolean, registrantNotified: boolean | null }`
(`null` si la personne n'a pas d'email) et ne lève jamais d'exception : un
souci SMTP est journalisé et reflété dans le résultat, jamais propagé à
l'appelant.

**Deux Server Actions concrètes l'utilisent déjà** dans l'application :

- `src/app/tournois/actions.ts` → `registerForTournamentAction` : inscription
  publique, appelée directement par `PublicBoard.tsx` (plus de `fetch()` côté
  client vers une route API pour ce flux).
- `src/app/admin/registrants/actions.ts` → `manualRegisterAction` : inscription
  manuelle admin, appelée directement par `RegistrantsDashboard.tsx`. Comme
  toute Server Action est un point d'entrée public au même titre qu'une route
  API, elle revérifie elle-même la session admin (`isAdminAuthenticated()`)
  au lieu de faire confiance à l'interface qui l'appelle.

Les routes API historiques (`POST /api/tournaments/[id]/registrants` et
`POST /api/admin/registrants`) existent toujours et appellent elles aussi
`notify()` — utile si vous voulez garder une API HTTP classique en plus des
Server Actions (intégration externe, tests, etc.).

## Structure du projet

```
src/
  app/
    page.tsx                        Redirige "/" vers "/tournois"
    tournois/
      page.tsx                       Page publique (Server Component)
      actions.ts                     Server Action d'inscription publique
    admin/
      page.tsx                      Back office (protégé, redirige sinon)
      members/
        page.tsx                     Membres autorisés (protégé)
      registrants/
        page.tsx                     Tableau de bord des inscrits (protégé)
        actions.ts                   Server Action d'inscription manuelle
    admin@403115/
      page.tsx                       Formulaire de connexion admin (URL
                                     volontairement peu devinable)
    api/
      tournaments/route.ts                        GET public (vue allégée)
      tournaments/[id]/registrants/route.ts        POST public (inscription)
      admin/login/route.ts                         POST connexion admin
      admin/logout/route.ts                        POST déconnexion admin
      admin/tournaments/route.ts                   GET/POST protégés
      admin/tournaments/[id]/route.ts              PATCH/DELETE protégés
      admin/tournaments/[id]/duplicate/route.ts    POST protégé (duplication)
      admin/tournaments/[id]/registrants/[id]/     DELETE protégé
      admin/registrants/route.ts                   GET/POST protégés (liste,
                                                    inscription manuelle)
      admin/registrants/[registrantId]/route.ts    DELETE protégé
      admin/registrants/export/route.ts            GET protégé (export CSV)
      admin/members/route.ts                       GET/POST protégés (liste,
                                                    ajout d'un membre autorisé)
      admin/members/[memberId]/route.ts            DELETE protégé
    layout.tsx / globals.css        Layout racine, polices, design tokens
  components/
    SiteHeader.tsx                    Navigation sombre (logo, menu déroulant, contact)
    PublicBoard.tsx / PublicTournamentCard.tsx      Vue publique (avec description)
    RegistrationModal.tsx                           Formulaire d'inscription
    InfoIcons.tsx                     Icônes ticket / places (lignes d'info)
    admin/
      AdminBoard.tsx / AdminTournamentCard.tsx      Vue back office
      AdminLoginForm.tsx / TournamentFormModal.tsx  Connexion / création+édition
      RegistrantsDashboard.tsx                      Tableau de bord des inscrits
      ManualRegistrationModal.tsx                   Formulaire d'inscription manuelle
      MembersDashboard.tsx                          Gestion des membres autorisés
    SuitMark.tsx                     Icônes de couleurs (pique/cœur/…)
  lib/
    types.ts                         Types + statut + vue publique
    db.ts                             Connexion Postgres + création du schéma
    store.ts                         Requêtes SQL (tournois, inscrits)
    members.ts                       CRUD de la liste des membres autorisés
    csv.ts                           Génération du CSV d'export des inscrits
    mailer.ts                        Envoi SMTP bas niveau (nodemailer)
    notify.ts                        Fonction notify() (emails admin/inscrit)
    auth.ts                          Vérification mot de passe + session
    admin-guard.ts                   Garde d'accès pour les routes API admin
    format.ts                        Formatage dates/montants (fr-FR)
docker-compose.yml                   Postgres local pour le développement (optionnel)
```

## Notes

- **Base de données** : le schéma (`tournaments` et `registrants`, liées par
  une clé étrangère avec suppression en cascade, plus `authorized_members`
  pour la liste des personnes autorisées à s'inscrire) est créé
  automatiquement au premier démarrage — aucune commande de migration à
  lancer. Pour repartir de zéro, videz les tables ou pointez `DATABASE_URL`
  vers une base vide.
- **Sécurité contre la survente** : l'inscription (publique ou manuelle)
  verrouille la ligne du tournoi en base le temps de la transaction
  (`SELECT ... FOR UPDATE`) avant de vérifier les places disponibles et
  d'insérer l'inscrit. Deux inscriptions simultanées pour la dernière place
  ne peuvent donc jamais faire dépasser le nombre de places — vérifié avec
  20 inscriptions concurrentes sur un tournoi à 2 places (exactement 2
  acceptées, 18 refusées).
- L'authentification admin repose sur un seul mot de passe partagé (adapté à
  un petit club géré par une poignée d'organisateurs). Pour des comptes
  individuels avec rôles différents, il faudrait ajouter une vraie table
  d'utilisateurs.
- **Déploiement serverless (Vercel, etc.)** : fonctionne nativement, aucun
  problème de système de fichiers en lecture seule — toutes les données
  passent par `DATABASE_URL`. Pensez simplement à renseigner cette variable
  (et les autres de `.env.example`) dans les paramètres du projet sur
  Vercel.
- Le thème visuel (couleurs, typographie, mise en page des cartes) s'inspire
  de la page "Tous les tournois" du Sundgau Poker Club.
- La bannière des cartes de tournoi (`public/images/tournament-banner.jpg`)
  et le logo de l'en-tête (`public/images/logo.png`) sont les images
  fournies par vos soins ; remplacez ces fichiers (mêmes noms) pour changer
  les visuels sans toucher au code.
- Le champ "Date" ne capture plus que le jour (sans heure) ; en interne, il
  est stocké à 23:59 pour que le tournoi reste "à venir" toute la journée
  choisie. L'heure réelle se saisit librement dans "Début du tournoi",
  affiché tel quel en front office.
- Les emails sont envoyés de façon asynchrone ("fire-and-forget") après la
  réponse de l'API : un problème SMTP est journalisé côté serveur mais ne
  provoque jamais l'échec de l'inscription côté utilisateur.
- La page `/tournois` est rendue à chaque requête (`export const dynamic =
  "force-dynamic"`) plutôt que générée une fois au build : les places
  restantes et la liste des tournois y sont donc toujours à jour.
