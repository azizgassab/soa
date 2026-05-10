# TP9 – Intégration et Manipulation de Données avec Apache Kafka 4.2

> **Matière :** SoA et Microservices  
> **Enseignant :** Dr. Salah Gontara  
> **Classe :** 4Info – GL1  
> **Étudiante :** Maissa Dhahri  
> **Année :** 2025/2026

---

## 📋 Description

Projet Node.js démontrant l'intégration d'**Apache Kafka 4.2** (mode **KRaft**, sans ZooKeeper) avec :

- Un **producteur** qui émet des événements JSON (capteur IoT simulé) toutes les secondes
- Un **consommateur** qui lit les messages, les parse et les persiste dans **PostgreSQL**
- Une **API REST Express.js 5** pour consulter les messages stockés

---

## 🛠️ Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Apache Kafka | 4.2 | Broker de messages (mode KRaft) |
| Node.js | 18+ | Runtime JavaScript |
| KafkaJS | 2.x | Client Kafka pour Node.js |
| Express.js | 5.x | API REST |
| PostgreSQL | 14+ | Persistance des messages |
| dotenv | 16.x | Variables d'environnement |

---

## 📁 Structure du projet

```
tp9-kafka/
├── db/
│   └── init.sql          # Schéma PostgreSQL (table kafka_messages)
├── src/
│   ├── db.js             # Pool PostgreSQL + fonctions CRUD
│   ├── producer.js       # Producteur Kafka (événements IoT)
│   ├── consumer.js       # Consommateur Kafka + insertion BDD
│   └── api.js            # API REST Express.js
├── .env.example          # Modèle de configuration
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Installation et configuration

### Prérequis

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Apache Kafka 4.2 ([téléchargement](https://kafka.apache.org/downloads))

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd tp9-kafka
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
# Éditez .env avec vos paramètres PostgreSQL et Kafka
```

### 3. Initialiser la base de données PostgreSQL

```bash
# Créer la base
psql -U postgres -c "CREATE DATABASE kafka_db;"

# Créer la table
psql -U postgres -d kafka_db -f db/init.sql
```

---

## 🚀 Démarrage de Kafka 4.2 (mode KRaft)

> Kafka 4.x ne nécessite **plus ZooKeeper**. Les métadonnées sont gérées via le protocole **KRaft**.

### Linux

```bash
# Depuis le dossier kafka/
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
bin/kafka-storage.sh format --standalone -t "$KAFKA_CLUSTER_ID" -c config/server.properties
bin/kafka-server-start.sh config/server.properties
```

### Windows

```powershell
$KAFKA_CLUSTER_ID = (.\bin\windows\kafka-storage.bat random-uuid | Select-Object -Last 1)
.\bin\windows\kafka-storage.bat format --standalone -t $KAFKA_CLUSTER_ID -c .\config\server.properties
.\bin\windows\kafka-server-start.bat config\server.properties
```

### Créer le topic

```bash
# Linux
bin/kafka-topics.sh --create --partitions 3 --replication-factor 1 \
  --topic test-topic --bootstrap-server localhost:9092

# Windows
bin\windows\kafka-topics.bat --create --partitions 3 --replication-factor 1 ^
  --topic test-topic --bootstrap-server localhost:9092
```

---

## ▶️ Lancement de l'application

Ouvrez **3 terminaux** dans le dossier `tp9-kafka/` :

```bash
# Terminal 1 – Producteur
npm run producer

# Terminal 2 – Consommateur (+ insertion PostgreSQL)
npm run consumer

# Terminal 3 – API REST
npm start
```

---

## 🌐 API REST — Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Health-check + liste des routes |
| GET | `/health` | Vérifie la connexion PostgreSQL |
| GET | `/messages` | Liste les 100 derniers messages |
| GET | `/messages?limit=20` | Limite le nombre de résultats |
| GET | `/messages?topic=test-topic` | Filtre par topic |
| GET | `/messages?key=sensor-01` | Filtre par clé (deviceId) |
| GET | `/messages/:id` | Récupère un message par ID |
| GET | `/messages/stats` | Statistiques globales |

### Exemples curl

```bash
# Tous les messages
curl http://localhost:3000/messages

# Les 10 derniers
curl http://localhost:3000/messages?limit=10

# Un message spécifique
curl http://localhost:3000/messages/1

# Statistiques
curl http://localhost:3000/messages/stats
```

### Exemple de réponse `GET /messages`

```json
{
  "count": 2,
  "messages": [
    {
      "id": 2,
      "topic": "test-topic",
      "partition": 0,
      "offset": "1",
      "key": "sensor-01",
      "payload": {
        "deviceId": "sensor-01",
        "temperature": 25.43,
        "humidity": 61.78,
        "status": "ok",
        "messageNum": 2,
        "createdAt": "2025-05-08T10:15:32.000Z"
      },
      "received_at": "2025-05-08T10:15:32.123Z"
    }
  ]
}
```

### Exemple de réponse `GET /messages/stats`

```json
{
  "stats": {
    "total": "120",
    "topics": "1",
    "devices": "1",
    "first_message": "2025-05-08T10:00:00.000Z",
    "last_message": "2025-05-08T10:02:00.000Z",
    "avg_temperature": "24.87"
  }
}
```

---

## 🗄️ Schéma PostgreSQL

```sql
CREATE TABLE kafka_messages (
    id          SERIAL PRIMARY KEY,
    topic       VARCHAR(255)  NOT NULL,
    partition   INTEGER       NOT NULL,
    "offset"    BIGINT        NOT NULL,
    key         VARCHAR(255),
    payload     JSONB         NOT NULL,
    received_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

## 🔄 Flux de données

```
producer.js
    │  émet un JSON toutes les secondes
    ▼
Kafka Broker (topic: test-topic)
    │  partition 0/1/2
    ▼
consumer.js
    │  parse JSON  →  insertMessage()
    ▼
PostgreSQL (table: kafka_messages)
    │
    ▼
api.js  →  GET /messages  →  Client (Postman / curl)
```
