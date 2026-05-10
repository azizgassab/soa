require('dotenv').config();
const express            = require('express');
const { getMessages, getMessageById, pool } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ─────────────────────────────────────────────────────────
// GET /
// Health-check
// ─────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status:  'ok',
    message: 'TP9 Kafka API — en ligne',
    routes: [
      'GET  /health',
      'GET  /messages?limit=100&topic=test-topic',
      'GET  /messages/:id',
      'GET  /messages/stats',
    ],
  });
});

// ─────────────────────────────────────────────────────────
// GET /health
// Vérifie la connexion PostgreSQL
// ─────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connecté' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /messages/stats
// Statistiques globales sur les messages stockés
// ─────────────────────────────────────────────────────────
app.get('/messages/stats', async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                      AS total,
        COUNT(DISTINCT topic)                         AS topics,
        COUNT(DISTINCT key)                           AS devices,
        MIN(received_at)                              AS first_message,
        MAX(received_at)                              AS last_message,
        ROUND(AVG((payload->>'temperature')::numeric), 2) AS avg_temperature
      FROM kafka_messages
    `);
    res.json({ stats: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /messages
// Récupère les N derniers messages (défaut 100)
// Query params :
//   ?limit=50          — nombre de messages
//   ?topic=test-topic  — filtrer par topic
//   ?key=sensor-01     — filtrer par clé (deviceId)
// ─────────────────────────────────────────────────────────
app.get('/messages', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 100, 500);
    const topic  = req.query.topic || null;
    const key    = req.query.key   || null;

    let sql    = `SELECT * FROM kafka_messages`;
    const conditions = [];
    const values     = [];

    if (topic) { conditions.push(`topic = $${values.length + 1}`); values.push(topic); }
    if (key)   { conditions.push(`key   = $${values.length + 1}`); values.push(key);   }

    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY received_at DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const { rows } = await pool.query(sql, values);
    res.json({ count: rows.length, messages: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /messages/:id
// Récupère un message par son ID
// ─────────────────────────────────────────────────────────
app.get('/messages/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID invalide — doit être un entier' });
  }

  try {
    const message = await getMessageById(id);
    if (!message) {
      return res.status(404).json({ error: `Message avec id=${id} introuvable` });
    }
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
// Démarrage du serveur
// ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 API REST démarrée sur http://localhost:${PORT}`);
  console.log(`   GET  http://localhost:${PORT}/messages`);
  console.log(`   GET  http://localhost:${PORT}/messages/1`);
  console.log(`   GET  http://localhost:${PORT}/messages/stats\n`);
});

module.exports = app;
