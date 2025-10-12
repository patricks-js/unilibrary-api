import { migrate } from 'drizzle-orm/neon-http/migrator';
import { drizzle } from 'drizzle-orm/neon-http';
import * as auth from './schema/auth';
import * as books from './schema/books';
import { env } from '../lib/env';


const db = drizzle(env.DATABASE_URL, {
  schema: {
    ...auth,
    ...books,
  },
  casing:"snake_case"
})

try {
  await migrate(db, {
    migrationsFolder: "./src/db/migrations"
  });

  console.log("Migration successful");
} catch(err) {
  console.error(err);
}
