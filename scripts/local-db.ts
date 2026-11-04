import { MongoMemoryServer } from 'mongodb-memory-server';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const dbPath = path.resolve('.local/mongodb');
await mkdir(dbPath, { recursive: true });
const mongo = await MongoMemoryServer.create({
  binary: { version: '8.0.17', checkMD5: true },
  instance: { dbPath, storageEngine: 'wiredTiger', port: 27017, dbName: 'nexora' },
});
console.log(
  'Local development MongoDB ready at mongodb://127.0.0.1:27017/nexora (real mongod, data retained in .local/mongodb). Production uses MongoDB Atlas.',
);
const shutdown = () => {
  void mongo.stop().then(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
