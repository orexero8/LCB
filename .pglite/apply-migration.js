const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const sql = fs.readFileSync(
    path.join(__dirname, "migration.sql"),
    "utf8"
  );

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      await client.query(stmt + ";");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("Skipping (already exists):", stmt.slice(0, 60));
      } else {
        throw err;
      }
    }
  }

  console.log("Migration applied successfully");
  await client.end();
}

main().catch((e) => {
  console.error("Migration error:", e.message);
  process.exit(1);
});
