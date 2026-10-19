import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { connectDb, disconnectDb } from '../../src/config/db';

let replSet: MongoMemoryReplSet | undefined;

/** Starts an isolated replica set (transactions need one) and connects Mongoose to it. */
export async function startTestDb(): Promise<void> {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDb(replSet.getUri());
}

export async function stopTestDb(): Promise<void> {
  await disconnectDb();
  await replSet?.stop();
}
