const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected");

  try {
    await client.query("CREATE TABLE IF NOT EXISTS test123 (id SERIAL PRIMARY KEY, name TEXT)");
    console.log("CREATE TABLE OK");
  } catch (e) {
    console.log("CREATE TABLE ERR:", e.message.slice(0, 100));
  }

  try {
    await client.query("INSERT INTO test123 (name) VALUES ($1)", ["hello"]);
    console.log("INSERT OK");
  } catch (e) {
    console.log("INSERT ERR:", e.message.slice(0, 100));
  }

  try {
    const r = await client.query("SELECT * FROM test123");
    console.log("SELECT OK:", JSON.stringify(r.rows));
  } catch (e) {
    console.log("SELECT ERR:", e.message.slice(0, 100));
  }

  await client.end();
}

main().catch((e) => console.log("CONNECT ERR:", e.message));
