const { PGlite } = require("@electric-sql/pglite");
const fs = require("fs");

async function main() {
  const db = await PGlite.create();

  // Apply migration
  const sql = fs.readFileSync(__dirname + "/migration.sql", "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  for (const stmt of statements) {
    try {
      await db.exec(stmt + ";");
    } catch (e) {}
  }

  // Check tables
  const r = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("Tables:", r.rows.map((t) => t.table_name).join(", "));

  // Check enums
  const e = await db.query(
    "SELECT t.typname FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid GROUP BY t.typname"
  );
  console.log("Enums:", e.rows.map((t) => t.typname).join(", "));

  // Seed data
  const seedSql = fs.readFileSync(__dirname + "/seed.sql", "utf8");
  const seedStatements = seedSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  for (const stmt of seedStatements) {
    try {
      await db.exec(stmt + ";");
    } catch (e2) {
      console.log("Seed error:", e2.message.slice(0, 120));
    }
  }

  // Verify seed
  const users = await db.query("SELECT id, name, email FROM \"User\"");
  console.log("Users:", JSON.stringify(users.rows));

  const roomTypes = await db.query(
    "SELECT id, name FROM \"RoomType\""
  );
  console.log("RoomTypes:", JSON.stringify(roomTypes.rows));

  const rooms = await db.query(
    "SELECT id, name, floor FROM \"Room\" ORDER BY floor, name"
  );
  console.log("Rooms:", JSON.stringify(rooms.rows));

  // Dump to SQL dump for server reuse
  const dump = await db.dumpDataDir("memory://");
  // Write dump data to a file
  console.log("Dump succeeded, size:", typeof dump);

  await db.close();
}

main().catch((e) => console.log("Fail:", e.message));
