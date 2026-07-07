const { getAuth } = require("../config/firebase");

/**
 * Vérifie le header "Authorization: Bearer <idToken>" envoyé par le front
 * (le idToken vient du SDK Firebase Auth côté client, après login/signup).
 * Attache req.user = { uid, email, ... } si le token est valide.
 */
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Non authentifié. En-tête Authorization manquant." });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded; // contient uid, email, email_verified, etc.
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

module.exports = requireAuth;
