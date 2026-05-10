const fs = require('fs');
const path = require('path');
const { buildSchema } = require('graphql');

async function getTaskSchema() {
  const schemaPath = path.join(__dirname, 'taskSchema.gql');
  const schemaString = fs.readFileSync(schemaPath, 'utf8');
  return buildSchema(schemaString);
}

// ⚠️ IMPORTANT : PAS DE ()
module.exports = getTaskSchema;