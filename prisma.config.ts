import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'mydb'}?schema=public`;

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'pnpm exec ts-node prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
