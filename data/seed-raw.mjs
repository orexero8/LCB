import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import 'dotenv/config';

// Hash password first (bcrypt is slow) before connecting
const pwdHash = await bcrypt.hash('admin123', 4);

const client = process.env.DATABASE_URL
  ? new pg.Client({ connectionString: process.env.DATABASE_URL })
  : new pg.Client({ host: '127.0.0.1', port: 51214, database: 'postgres', user: 'postgres', password: 'postgres' });
await client.connect();
const userIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const now = new Date();
const users = [
  { id: userIds[0], email: 'admin@hotel.com', phone: '0550 00 00 01', name: 'Admin', role: 'ADMIN' },
  { id: userIds[1], email: 'amel@hotel.com', phone: '0550 00 00 02', name: 'Amel', role: 'RECEPTIONIST' },
  { id: userIds[2], email: 'karim@hotel.com', phone: '0550 00 00 03', name: 'Karim', role: 'RECEPTIONIST' },
  { id: userIds[3], email: 'soria@hotel.com', phone: '0550 00 00 04', name: 'Soria', role: 'RECEPTIONIST' },
];
for (const u of users) {
  await client.query(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7) ON CONFLICT (id) DO NOTHING`, [u.id, u.email, u.phone, pwdHash, u.name, u.role, now]);
}

// Hotel settings
  await client.query(`INSERT INTO hotel_settings (id, hotel_name, logo_url, check_in_time, check_out_time, currency_symbol, rc, nif, nis, created_at, updated_at) VALUES ('default', 'Le Cheval Blanc', '/CHEVALBLANC.png', '14:00', '12:00', 'DA', '31/02-1747753A12', '1790720001971110000', '197907200019729', $1, $1) ON CONFLICT (id) DO NOTHING`, [now]);

// Room types
const roomTypeDefs = [
  { name: 'Grand Lit', layout: '1 grand lit' },
  { name: 'Standard 2 PAX', layout: '2 lits' },
  { name: 'Standard 3 PAX', layout: '3 lits' },
  { name: 'Standard 4 PAX', layout: '4 lits' },
  { name: 'Mixte', layout: '1 grand lit + petits lits' },
];
const rtIds = {};
for (const d of roomTypeDefs) {
  const r = await client.query(`SELECT id FROM room_types WHERE name = $1`, [d.name]);
  if (r.rows.length > 0) { rtIds[d.name] = r.rows[0].id; continue; }
  const id = randomUUID();
  await client.query(`INSERT INTO room_types (id, name, bed_layout_label, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)`, [id, d.name, d.layout, now]);
  rtIds[d.name] = id;
}

// Floors
const floorDefs = [
  { name: 'Rez-de-chaussée', sortOrder: 0 },
  { name: '1er étage', sortOrder: 1 },
  { name: '2ème étage', sortOrder: 2 },
];
const floorIds = {};
for (const d of floorDefs) {
  const r = await client.query(`SELECT id FROM floors WHERE name = $1`, [d.name]);
  if (r.rows.length > 0) { floorIds[d.name] = r.rows[0].id; continue; }
  const id = randomUUID();
  await client.query(`INSERT INTO floors (id, name, sort_order, is_active, created_at, updated_at) VALUES ($1, $2, $3, true, $4, $4)`, [id, d.name, d.sortOrder, now]);
  floorIds[d.name] = id;
}

// Clear existing booking data before reseeding rooms
await client.query('DELETE FROM cancellations');
await client.query('DELETE FROM checkout_alerts');
await client.query('DELETE FROM children_ages');
await client.query('DELETE FROM booking_guests');
await client.query('DELETE FROM booking_rooms');
await client.query('DELETE FROM bookings');
// Clear old rooms
for (const fId of Object.values(floorIds)) {
  await client.query(`DELETE FROM rooms WHERE floor_id = $1`, [fId]);
}

// Rooms — Rooming List soria.pdf
const roomData = [
  { rn: 1,  floor: 'Rez-de-chaussée', type: 'Standard 4 PAX', price: 8500 },
  { rn: 2,  floor: 'Rez-de-chaussée', type: 'Standard 2 PAX', price: 5500 },
  { rn: 3,  floor: 'Rez-de-chaussée', type: 'Standard 3 PAX', price: 7500 },
  { rn: 4,  floor: 'Rez-de-chaussée', type: 'Standard 4 PAX', price: 8500 },
  { rn: 5,  floor: 'Rez-de-chaussée', type: 'Grand Lit',      price: 5000 },
  { rn: 6,  floor: '1er étage', type: 'Grand Lit',      price: 5000 },
  { rn: 7,  floor: '1er étage', type: 'Grand Lit',      price: 5000 },
  { rn: 8,  floor: '1er étage', type: 'Standard 3 PAX', price: 7500 },
  { rn: 9,  floor: '1er étage', type: 'Mixte',          price: 6500 },
  { rn: 10, floor: '1er étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 11, floor: '1er étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 12, floor: '1er étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 13, floor: '1er étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 14, floor: '1er étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 15, floor: '1er étage', type: 'Standard 3 PAX', price: 7500 },
  { rn: 16, floor: '2ème étage', type: 'Grand Lit',      price: 5000 },
  { rn: 17, floor: '2ème étage', type: 'Grand Lit',      price: 5000 },
  { rn: 18, floor: '2ème étage', type: 'Standard 3 PAX', price: 7500 },
  { rn: 19, floor: '2ème étage', type: 'Mixte',          price: 6500 },
  { rn: 20, floor: '2ème étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 21, floor: '2ème étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 22, floor: '2ème étage', type: 'Grand Lit',      price: 5000 },
  { rn: 23, floor: '2ème étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 24, floor: '2ème étage', type: 'Standard 2 PAX', price: 5500 },
  { rn: 25, floor: '2ème étage', type: 'Standard 3 PAX', price: 7500 },
];

const typeToLayout = { 'Grand Lit': '1 grand lit', 'Standard 2 PAX': '2 lits', 'Standard 3 PAX': '3 lits', 'Standard 4 PAX': '4 lits', 'Mixte': '1 grand lit + petits lits' };

for (const r of roomData) {
  await client.query(`INSERT INTO rooms (id, room_number, floor_id, room_type_id, bed_layout, price_per_night, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, 'AVAILABLE', $7, $7)`, [
    randomUUID(), r.rn, floorIds[r.floor], rtIds[r.type], typeToLayout[r.type], r.price, now,
  ]);
}

// Discounts
const discounts = [
  { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, min: 0, maxUses: 0 },
  { code: 'FLAT5000', type: 'FIXED', value: 5000, min: 30000, maxUses: 0 },
  { code: 'SUMMER20', type: 'PERCENTAGE', value: 20, min: 0, maxUses: 50 },
];
for (const d of discounts) {
  await client.query(`INSERT INTO discounts (id, code, type, value, min_amount, valid_from, valid_until, max_uses, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $9) ON CONFLICT (code) DO NOTHING`, [
    randomUUID(), d.code, d.type, d.value, d.min, now, new Date(now.getTime() + 365*24*60*60*1000), d.maxUses, now,
  ]);
}

console.log('Seeded 4 users (Admin, Amel, Karim, Soria) / admin123');
console.log('Seeded 25 rooms (Rooming List soria.pdf)');
await client.end();
