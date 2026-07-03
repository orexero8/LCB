import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE clients
        ADD COLUMN IF NOT EXISTS maiden_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS date_of_birth DATE,
        ADD COLUMN IF NOT EXISTS profession VARCHAR(255),
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS nationality VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    console.log("Migration successful: new columns added to clients table.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
