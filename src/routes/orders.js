const express = require("express");
const { getDb } = require("../config/firebase");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

/**
 * POST /api/orders
 * Header: Authorization: Bearer <idToken>
 * Body: { items: [{ id, name, price, qty }], customer: {...} }
 *
 * Crée une commande liée à l'utilisateur connecté.
 * NOTE: c'est ici que tu brancheras plus tard le vrai paiement (Stripe/crypto) —
 * pour l'instant la commande est enregistrée telle quelle, statut "pending".
 */
router.post("/", requireAuth, async (req, res) => {
  const { items, customer } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Le panier (items) est vide ou invalide." });
  }

  const subtotal = items.reduce((sum, i) => sum + (i.qty || 1) * i.price, 0);

  const order = {
    uid: req.user.uid,
    email: req.user.email,
    items,
    customer: customer || null,
    subtotal,
    total: subtotal,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  try {
    const ref = await getDb().collection("orders").add(order);
    res.status(201).json({ id: ref.id, ...order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders
 * Header: Authorization: Bearer <idToken>
 * Retourne l'historique des commandes de l'utilisateur connecté, triées du plus récent au plus ancien.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const snap = await getDb()
      .collection("orders")
      .where("uid", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const orders = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/orders/:id
 * Retourne une commande précise, uniquement si elle appartient à l'utilisateur connecté.
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const doc = await getDb().collection("orders").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Commande introuvable." });

    const order = doc.data();
    if (order.uid !== req.user.uid) {
      return res.status(403).json({ error: "Cette commande ne t'appartient pas." });
    }

    res.json({ id: doc.id, ...order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
