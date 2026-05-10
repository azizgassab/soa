const fs = require('fs');
const path = require('path');
const express = require('express');
const { buildSchema } = require('graphql');
const { createHandler } = require('graphql-http/lib/use/express');

const dbPromise = require('./db');
const userResolver = require('./userResolver');

const app = express();
const port = 5000;

const schema = buildSchema(
  fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')
);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API REST + GraphQL avec RxDB'
  });
});

/* GraphQL */
app.all('/graphql', createHandler({
  schema,
  rootValue: userResolver
}));

/* REST */

// GET ALL
app.get('/users', async (req, res) => {
  const { users } = await dbPromise;
  const docs = await users.find().exec();
  res.json(docs.map(d => d.toJSON()));
});

// GET ONE
app.get('/users/:id', async (req, res) => {
  const { users } = await dbPromise;
  const doc = await users.findOne(req.params.id).exec();

  if (!doc) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(doc.toJSON());
});

// CREATE
app.post('/users', async (req, res) => {
  try {
    const user = await userResolver.addUser(req.body);
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// UPDATE
app.put('/users/:id', async (req, res) => {
  try {
    const user = await userResolver.updateUser({
      id: req.params.id,
      ...req.body
    });

    if (!user) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE
app.delete('/users/:id', async (req, res) => {
  const ok = await userResolver.deleteUser({ id: req.params.id });

  if (!ok) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json({ message: 'Deleted' });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});