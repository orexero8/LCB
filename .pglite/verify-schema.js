const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const r = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log("Tables:", r.rows.map((t) => t.table_name).join(", "));

  const e = await client.query(
    "SELECT t.typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname"
  );
  console.log("Enums:", e.rows.map((t) => t.typname).join(", "));

  await client.end();
}

main().catch((e) => console.log("ERR:", e.message));
