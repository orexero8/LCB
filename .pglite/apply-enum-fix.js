const { Client } = require("pg");

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    await c.query('UPDATE "Room" SET status = \'AVAILABLE\' WHERE status = \'NEEDS_CLEANING\'');
    console.log("UPDATE OK");
  } catch (e) {
    console.log("UPDATE ERR:", e.message);
  }

  try {
    await c.query("ALTER TYPE \"RoomStatus\" DROP VALUE 'NEEDS_CLEANING'");
    console.log("ALTER OK");
  } catch (e) {
    console.log("ALTER ERR:", e.message);
  }

  await c.end();
}

main().catch((e) => console.log("ERR:", e.message));
