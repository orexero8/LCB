import { Client } from "pg";

const url = process.env.DATABASE_URL || "postgres://postgres@127.0.0.1:51214/postgres";
const client = new Client({ connectionString: url });
await client.connect();
for (const tbl of ["children_ages", "clients", "bookings", "rooms"]) {
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position", [tbl]);
  console.log(tbl + ":", res.rows.map(r => r.column_name).join(", "));
}
await client.end();
