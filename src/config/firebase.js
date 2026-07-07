const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function loadServiceAccount() {
  // Option 1: JSON complet dans la variable d'env FIREBASE_SERVICE_ACCOUNT (pratique pour le déploiement, ex. Render/Railway)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  // Option 2: fichier local serviceAccountKey.json (pratique en développement)
  const localPath = path.join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(localPath)) {
    return require(localPath);
  }

  throw new Error(
    "Aucune configuration Firebase trouvée. Ajoute src/config/serviceAccountKey.json " +
      "ou définis FIREBASE_SERVICE_ACCOUNT dans le fichier .env (voir .env.example)."
  );
}

let app;
function getFirebaseApp() {
  if (!app) {
    const serviceAccount = loadServiceAccount();
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  return app;
}

function getAuth() {
  getFirebaseApp();
  return admin.auth();
}

function getDb() {
  getFirebaseApp();
  return admin.firestore();
}

module.exports = { getFirebaseApp, getAuth, getDb };
