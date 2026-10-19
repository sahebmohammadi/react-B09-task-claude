import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Each test file starts its own in-memory replica set, which can take a while on first run.
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      CLIENT_ORIGIN: 'http://localhost:5173',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/unused-in-tests',
      LOG_LEVEL: 'silent',
    },
  },
});
