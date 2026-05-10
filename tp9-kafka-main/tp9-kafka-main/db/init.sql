-- TP9 : Kafka + PostgreSQL
-- Créer la base de données (à exécuter manuellement si elle n'existe pas)
-- CREATE DATABASE kafka_db;

-- Table principale pour stocker les messages Kafka
CREATE TABLE IF NOT EXISTS kafka_messages (
    id          SERIAL PRIMARY KEY,
    topic       VARCHAR(255)  NOT NULL,
    partition   INTEGER       NOT NULL,
    "offset"    BIGINT        NOT NULL,
    key         VARCHAR(255),
    payload     JSONB         NOT NULL,
    received_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les recherches par topic
CREATE INDEX IF NOT EXISTS idx_kafka_messages_topic    ON kafka_messages (topic);
CREATE INDEX IF NOT EXISTS idx_kafka_messages_received ON kafka_messages (received_at DESC);
CREATE INDEX IF NOT EXISTS idx_kafka_messages_key      ON kafka_messages (key);
