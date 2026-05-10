require('dotenv').config();
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'tp9-producer',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();
const topic    = process.env.KAFKA_TOPIC || 'test-topic';

let messageCount = 0;

const run = async () => {
  await producer.connect();
  console.log(`✅ Producteur connecté — envoi vers le topic "${topic}" toutes les secondes...\n`);

  setInterval(async () => {
    messageCount++;

    const event = {
      deviceId:    'sensor-01',
      temperature: Number((20 + Math.random() * 10).toFixed(2)),
      humidity:    Number((40 + Math.random() * 30).toFixed(2)),
      status:      Math.random() > 0.1 ? 'ok' : 'alert',
      messageNum:  messageCount,
      createdAt:   new Date().toISOString(),
    };

    await producer.send({
      topic,
      messages: [{ key: event.deviceId, value: JSON.stringify(event) }],
    });

    console.log(`📤 [#${messageCount}] Message produit :`, event);
  }, 1000);
};

// Arrêt propre
const shutdown = async () => {
  console.log('\n🛑 Arrêt du producteur...');
  await producer.disconnect();
  process.exit(0);
};
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

run().catch((err) => {
  console.error('❌ Erreur producteur :', err.message);
  process.exit(1);
});
