const express = require("express");
const { getAuth, getDb } = require("../config/firebase");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

/**
 * POST /api/auth/signup
 * Body: { email, password, username }
 *
 * L'inscription "officielle" se fait normalement CÔTÉ FRONT avec le SDK Firebase Auth
 * (createUserWithEmailAndPassword), car Firebase gère le hachage du mot de passe
 * et la connexion pour toi — le backend n'a jamais besoin de voir le mot de passe.
 *
 * Cette route existe pour les cas où tu veux créer le compte depuis le serveur
 * (ex: import en masse, ou formulaire custom) ET créer le profil Firestore associé.
 */
router.post("/signup", async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: "email, password et username sont requis." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Le mot de passe doit faire au moins 6 caractères." });
  }

  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: username
    });

    await getDb().collection("users").doc(userRecord.uid).set({
      username,
      email,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ uid: userRecord.uid, email, username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <idToken>
 * Retourne le profil du user connecté (fusion Firebase Auth + Firestore).
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const snap = await getDb().collection("users").doc(req.user.uid).get();
    const profile = snap.exists ? snap.data() : {};
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      ...profile
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
