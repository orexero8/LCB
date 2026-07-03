import { readFileSync } from 'fs';
import pg from 'pg';
import 'dotenv/config';

const sql = readFileSync('data/schema.sql', 'utf-8');

async function main() {
  const client = process.env.DATABASE_URL
    ? new pg.Client({ connectionString: process.env.DATABASE_URL })
    : new pg.Client({
        host: '127.0.0.1', port: 51214, database: 'postgres',
        user: 'postgres', password: 'postgres',
      });
  await client.connect();

  const lines = sql.split('\n');
  let currentStmt = '';
  let executed = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed === '') continue;
    currentStmt += line + '\n';
    if (trimmed.endsWith(';')) {
      const stmt = currentStmt.trim();
      if (stmt) {
        try {
          await client.query(stmt);
          executed++;
        } catch (err) {
          if (err.message && (
            err.message.includes('already exists') ||
            err.message.includes('duplicate')
          )) {
            executed++;
          } else {
            console.error('FAIL:', err.message);
          }
        }
      }
      currentStmt = '';
    }
  }

  console.log(`Applied ${executed} statements successfully`);
  await client.end();
}

main().catch(console.error);
