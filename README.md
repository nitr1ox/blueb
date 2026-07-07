# Bloommenu.fr — Backend (Auth + comptes + commandes)

API Node.js/Express connectée à Firebase (Authentication + Firestore).

## Fonctionnalités incluses

- **Auth** : vérification des tokens Firebase Auth (login/signup gérés côté front avec le SDK Firebase),
  création de profil Firestore associé.
- **Comptes** : `GET /api/auth/me` retourne le profil du user connecté.
- **Commandes** : création (`POST /api/orders`), historique (`GET /api/orders`), détail (`GET /api/orders/:id`),
  toutes protégées et filtrées par utilisateur (impossible de voir les commandes d'un autre user).

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

## Configurer Firebase

1. Crée un projet sur https://console.firebase.google.com si ce n'est pas déjà fait.
2. Active **Authentication > Email/Password**.
3. Active **Firestore Database** (mode production).
4. Va dans **Paramètres du projet > Comptes de service > Générer une nouvelle clé privée**.
   Télécharge le JSON et place-le dans `src/config/serviceAccountKey.json`
   (déjà exclu du `.gitignore`, ne le commit jamais).
5. Remplis `.env` (au minimum `CORS_ORIGIN` avec l'URL de ton site).

## Lancer le serveur

```bash
npm run dev     # avec rechargement automatique (nodemon)
# ou
npm start
```

Le serveur démarre sur `http://localhost:4000` (configurable via `PORT`).

## Endpoints

| Méthode | Route              | Auth requise | Description                          |
|---------|--------------------|--------------|----------------------------------------|
| GET     | /api/health         | non          | Vérifie que l'API répond              |
| POST    | /api/auth/signup     | non          | Crée un compte + profil Firestore     |
| GET     | /api/auth/me         | oui          | Profil de l'utilisateur connecté      |
| POST    | /api/orders          | oui          | Crée une commande                     |
| GET     | /api/orders          | oui          | Historique des commandes              |
| GET     | /api/orders/:id      | oui          | Détail d'une commande                 |

L'auth se fait via un header `Authorization: Bearer <idToken>`, où `idToken` vient du SDK
Firebase Auth côté client après connexion (voir `FRONTEND_INTEGRATION.md`).

## Étapes suivantes (pas encore incluses)

- Paiement réel (Stripe ou crypto) : la route `POST /api/orders` crée la commande en statut
  `"pending"` — il faudra la relier à un webhook de paiement qui passera le statut à `"paid"`
  puis livrera la licence/le lien de téléchargement.
- Livraison automatique des licences/clés après paiement confirmé.
- Rôle "admin" pour gérer les commandes depuis un panneau interne.

## Sécurité

- Le fichier `src/config/serviceAccountKey.json` donne un accès total à ton projet Firebase —
  ne le commit jamais, ne l'expose jamais côté front.
- Verrouille les règles Firestore pour que seul le backend (Admin SDK) puisse lire/écrire
  `users` et `orders` (voir `FRONTEND_INTEGRATION.md`, section 5).
