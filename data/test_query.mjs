import pg from 'pg';
const c = new pg.Client({ host: '127.0.0.1', port: 51214 });
await c.connect();

// Test: query rooms with join
const r = await c.query(`
  SELECT r.id, r.room_number, r.bed_layout, r.price_per_night, r.status,
         f.name as floor_name, rt.name as room_type_name
  FROM rooms r
  JOIN floors f ON r.floor_id = f.id
  LEFT JOIN room_types rt ON r.room_type_id = rt.id
  ORDER BY r.room_number
`);
console.log('Rooms query OK:', r.rows.length, 'rooms');
r.rows.forEach(x => console.log(`  ${x.room_number} - ${x.floor_name} - ${x.room_type_name}`));

await c.end();
