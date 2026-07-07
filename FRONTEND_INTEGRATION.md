# Brancher le site statique (Blue-main) sur ce backend

## 1. Configurer Firebase côté front

Dans Firebase Console > Paramètres du projet > Général > "Vos applications", crée une app Web
et récupère la config (`apiKey`, `authDomain`, `projectId`, ...).

Ajoute ce script sur les pages qui en ont besoin (`account.html`, `checkout.html`, `cart.html`) :

```html
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    // ...
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  window.BloommenuAuth = { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, onAuthStateChanged };
</script>
```

## 2. Remplacer le formulaire factice de `account.html`

Dans le `<script>` en bas de `account.html`, remplace le `notice.classList.add('show')` par :

```js
const { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = window.BloommenuAuth;

document.getElementById('signup').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: username });
    window.location.href = 'account.html'; // ou redirige vers une page "Mon compte" connectée
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = 'account.html';
  } catch (err) {
    alert(err.message);
  }
});
```

## 3. Envoyer une commande depuis `checkout.html`

```js
const idToken = await auth.currentUser.getIdToken();

const res = await fetch('http://localhost:4000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    items: BloommenuCart.getCart(),
    customer: { email: auth.currentUser.email }
  })
});

const order = await res.json();
```

Tu peux garder `cart.js` tel quel pour la gestion du panier en local (localStorage) — c'est seulement
au moment du checkout qu'on envoie la commande finale au backend.

## 4. Afficher l'historique de commandes (nouvelle section "Mes commandes")

```js
const idToken = await auth.currentUser.getIdToken();
const res = await fetch('http://localhost:4000/api/orders', {
  headers: { 'Authorization': `Bearer ${idToken}` }
});
const orders = await res.json();
// orders.forEach(o => ... afficher dans le DOM ...)
```

## 5. Règles de sécurité Firestore (important)

Comme le backend utilise le SDK Admin (accès total), verrouille aussi Firestore côté Firebase
pour empêcher tout accès direct non désiré depuis le front :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // seul le backend (Admin SDK) écrit ici
    }
    match /orders/{orderId} {
      allow read, write: if false; // uniquement via le backend
    }
  }
}
```
