require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const ordersRoutes = require("./routes/orders");

const app = express();

app.use(helmet());
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true
  })
);

// Anti-abus basique sur toute l'API
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", ordersRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Route inconnue." }));

// Handler d'erreurs générique
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Bloommenu.fr démarrée sur http://localhost:${PORT}`));
