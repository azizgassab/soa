require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'kafka_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  console.error('Erreur inattendue sur le pool PostgreSQL :', err.message);
});

/**
 * Insère un message Kafka dans la table kafka_messages.
 * @param {string} topic
 * @param {number} partition
 * @param {string|number} offset
 * @param {string|null} key
 * @param {object} payload  – objet JS (sera stocké en JSONB)
 * @returns {Promise<object>} La ligne insérée
 */
async function insertMessage(topic, partition, offset, key, payload) {
  const sql = `
    INSERT INTO kafka_messages (topic, partition, "offset", key, payload)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [topic, partition, parseInt(offset), key, JSON.stringify(payload)];
  const { rows } = await pool.query(sql, values);
  return rows[0];
}

/**
 * Récupère tous les messages (les 100 plus récents par défaut).
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
async function getMessages(limit = 100) {
  const { rows } = await pool.query(
    `SELECT * FROM kafka_messages ORDER BY received_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

/**
 * Récupère un message par son ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function getMessageById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM kafka_messages WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { pool, insertMessage, getMessages, getMessageById };
