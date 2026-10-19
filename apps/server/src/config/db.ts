import mongoose from 'mongoose';
import { logger } from '../lib/logger';

// Unknown fields in a filter are dropped instead of being sent to MongoDB.
mongoose.set('strictQuery', true);

export async function connectDb(uri: string): Promise<void> {
  await mongoose.connect(uri);

  // Logged from the live connection, not the URI, so credentials never reach the logs.
  const { host, port, name } = mongoose.connection;
  logger.info(`MongoDB connected to ${host}:${port}/${name}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
