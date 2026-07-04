import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) { console.log('No DATABASE_URL, skipping auto-seed'); process.exit(0); }

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows } = await client.query('SELECT COUNT(*) as cnt FROM users');
if (Number(rows[0].cnt) > 0) {
  console.log('Users exist, skipping seed');
  await client.end();
  process.exit(0);
}

console.log('Seeding database...');
const sql = readFileSync(resolve(__dirname, 'seed-supabase.sql'), 'utf8');
await client.query(sql);
console.log('Seed complete');
await client.end();
