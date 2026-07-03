const { Client } = require("pg");
const fs = require("fs");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected");

  const sql = fs.readFileSync(__dirname + "/migration.sql", "utf8");

  // Split by comment lines (which start with --) to get statement blocks
  const lines = sql.split("\n");
  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (line.startsWith("--")) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }
    current.push(line);
  }
  if (current.length > 0) blocks.push(current.join("\n"));

  let success = 0;
  let failed = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed === ";") continue;
    try {
      await client.query(trimmed);
      success++;
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("SKIP:", trimmed.slice(0, 60));
        success++;
      } else {
        console.log("FAIL:", trimmed.slice(0, 80), "=>", e.message.slice(0, 100));
        failed++;
      }
    }
  }

  console.log(`Done: ${success} ok, ${failed} failed`);
  await client.end();
}

main().catch((e) => console.log("FATAL:", e.message));
