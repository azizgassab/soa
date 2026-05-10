require('dotenv').config();
const { Kafka }       = require('kafkajs');
const { insertMessage } = require('./db');

const kafka    = new Kafka({
  clientId: 'tp9-consumer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'tp9-consumer-group',
});
const topic = process.env.KAFKA_TOPIC || 'test-topic';

const run = async () => {
  await consumer.connect();
  console.log(`✅ Consommateur connecté — écoute du topic "${topic}"...\n`);

  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const rawValue = message.value?.toString();
      const key      = message.key?.toString() || null;
      const offset   = message.offset;

      // 1. Parser le JSON
      let payload;
      try {
        payload = JSON.parse(rawValue);
      } catch {
        console.warn(`⚠️  Message non-JSON reçu (offset ${offset}) :`, rawValue);
        return;
      }

      // 2. Afficher dans la console
      console.log(`📥 [partition=${partition} offset=${offset}] Reçu :`, payload);

      // 3. Insérer en base PostgreSQL
      try {
        const row = await insertMessage(topic, partition, offset, key, payload);
        console.log(`   💾 Sauvegardé en BDD — id=${row.id}\n`);
      } catch (dbErr) {
        console.error('   ❌ Erreur insertion BDD :', dbErr.message);
      }
    },
  });
};

// Arrêt propre
const shutdown = async () => {
  console.log('\n🛑 Arrêt du consommateur...');
  await consumer.disconnect();
  process.exit(0);
};
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

run().catch((err) => {
  console.error('❌ Erreur consommateur :', err.message);
  process.exit(1);
});
