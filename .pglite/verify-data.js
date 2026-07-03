const { Client } = require("pg");

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const users = await c.query('SELECT id, name, email, role FROM users');
  console.log("Users:", JSON.stringify(users.rows));
  const rooms = await c.query('SELECT COUNT(*) as cnt FROM rooms');
  console.log("Rooms count:", rooms.rows[0].cnt);
  const rtypes = await c.query('SELECT COUNT(*) as cnt FROM room_types');
  console.log("RoomTypes count:", rtypes.rows[0].cnt);
  const floors = await c.query('SELECT COUNT(*) as cnt FROM floors');
  console.log("Floors count:", floors.rows[0].cnt);
  const allRooms = await c.query('SELECT id, name, floor, price FROM rooms ORDER BY floor, name');
  console.log("Rooms:", JSON.stringify(allRooms.rows));
  await c.end();
}

main().catch((e) => console.log("ERR:", e.message));
