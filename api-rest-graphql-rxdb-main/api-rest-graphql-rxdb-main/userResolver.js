const dbPromise = require('./db');

function toJson(doc) {
  return doc ? doc.toJSON() : null;
}

async function findByEmail(users, email) {
  return users.findOne({ selector: { email } }).exec();
}

async function ensureUniqueEmail(users, email, excludedId = null) {
  const existing = await findByEmail(users, email);
  if (existing && existing.primary !== excludedId) {
    throw new Error('Email déjà utilisé');
  }
}

module.exports = {
  user: async ({ id }) => {
    const { users } = await dbPromise;
    const doc = await users.findOne(id).exec();
    return toJson(doc);
  },

  users: async () => {
    const { users } = await dbPromise;
    const docs = await users.find().exec();
    return docs.map(d => d.toJSON());
  },

  addUser: async ({ name, email, password }) => {
    const { users, persistUsers, createId } = await dbPromise;

    await ensureUniqueEmail(users, email);

    const user = await users.insert({
      id: createId(),
      name,
      email,
      password
    });

    await persistUsers(users);
    return user.toJSON();
  },

  updateUser: async ({ id, name, email, password }) => {
    const { users, persistUsers } = await dbPromise;

    const doc = await users.findOne(id).exec();
    if (!doc) return null;

    await ensureUniqueEmail(users, email, id);

    const updated = await doc.incrementalPatch({
      name,
      email,
      password
    });

    await persistUsers(users);
    return updated.toJSON();
  },

  deleteUser: async ({ id }) => {
    const { users, persistUsers } = await dbPromise;

    const doc = await users.findOne(id).exec();
    if (!doc) return false;

    await doc.remove();
    await persistUsers(users);
    return true;
  }
};