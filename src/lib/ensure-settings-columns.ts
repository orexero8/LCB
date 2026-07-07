import pg from "pg";

export async function ensureSettingsColumns() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'hotel_settings' AND column_name = 'rc'"
    );
    if (rows.length === 0) {
      await client.query("ALTER TABLE hotel_settings ADD COLUMN rc TEXT");
      await client.query("ALTER TABLE hotel_settings ADD COLUMN nif TEXT");
      await client.query("ALTER TABLE hotel_settings ADD COLUMN nis TEXT");
    }
  } finally {
    client.release();
  }
}
