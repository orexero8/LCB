const { Client } = require("pg");

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log(r.rows.map((t) => t.table_name).join("\n"));
  await c.end();
}

main().catch((e) => console.log("ERR:", e.message));
