import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@hotel.com" },
    update: {},
    create: {
      email: "admin@hotel.com",
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: "receptionist@hotel.com" },
    update: {},
    create: {
      email: "receptionist@hotel.com",
      passwordHash,
      name: "Receptionist",
      role: "RECEPTIONIST",
    },
  });

  await prisma.hotelSetting.upsert({
    where: { id: "default" },
    update: { hotelName: "Le Cheval Blanc" },
    create: {
      id: "default",
      hotelName: "Le Cheval Blanc",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      currencySymbol: "DA",
    },
  });

  // Seed sample discount codes
  const today = new Date();
  const farFuture = new Date(); farFuture.setFullYear(farFuture.getFullYear() + 1);

  await prisma.discount.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minAmount: 0,
      validFrom: today,
      validUntil: farFuture,
      maxUses: 0,
      isActive: true,
    },
  });

  await prisma.discount.upsert({
    where: { code: "FLAT5000" },
    update: {},
    create: {
      code: "FLAT5000",
      type: "FIXED",
      value: 5000,
      minAmount: 30000,
      validFrom: today,
      validUntil: farFuture,
      maxUses: 0,
      isActive: true,
    },
  });

  await prisma.discount.upsert({
    where: { code: "SUMMER20" },
    update: {},
    create: {
      code: "SUMMER20",
      type: "PERCENTAGE",
      value: 20,
      minAmount: 0,
      validFrom: today,
      validUntil: farFuture,
      maxUses: 50,
      isActive: true,
    },
  });

  const roomTypeDefs = [
    { name: "Grand Lit", bedLayoutLabel: "1 grand lit" },
    { name: "Standard 2 PAX", bedLayoutLabel: "2 lits" },
    { name: "Standard 3 PAX", bedLayoutLabel: "3 lits" },
    { name: "Standard 4 PAX", bedLayoutLabel: "4 lits" },
  ];
  const roomTypes: Record<string, string> = {};
  for (const def of roomTypeDefs) {
    const existing = await prisma.roomType.findFirst({ where: { name: def.name } });
    if (existing) {
      roomTypes[def.name] = existing.id;
    } else {
      const created = await prisma.roomType.create({ data: def });
      roomTypes[def.name] = created.id;
    }
  }

  // Seed floors
  const floorDefs = [
    { name: "Rez-de-chaussée", sortOrder: 0 },
    { name: "1er étage", sortOrder: 1 },
    { name: "2ème étage", sortOrder: 2 },
  ];
  const floors: Record<string, string> = {};
  for (const def of floorDefs) {
    const existing = await prisma.floor.findFirst({ where: { name: def.name } });
    if (existing) {
      floors[def.name] = existing.id;
    } else {
      const created = await prisma.floor.create({ data: { ...def, isActive: true } });
      floors[def.name] = created.id;
    }
  }

  // Seed rooms — Rooming List soria.pdf mapping
  // Ground floor: 5 rooms (no hallway pairs — single corridor side)
  // 1er étage pairs: 06↔11, 07↔12, 08↔13, 09↔14, 10↔15
  // 2ème étage pairs: 16↔21, 17↔22, 18↔23, 19↔24, 20↔25
  const roomData = [
    // Ground floor — Rez-de-chaussée (rooms 01-05)
    { roomNumber: 1,  floor: "Rez-de-chaussée", type: "Standard 4 PAX", price: 6500 },
    { roomNumber: 2,  floor: "Rez-de-chaussée", type: "Standard 2 PAX", price: 4000 },
    { roomNumber: 3,  floor: "Rez-de-chaussée", type: "Standard 3 PAX", price: 5500 },
    { roomNumber: 4,  floor: "Rez-de-chaussée", type: "Standard 4 PAX", price: 6500 },
    { roomNumber: 5,  floor: "Rez-de-chaussée", type: "Grand Lit",      price: 5000 },
    // 1er étage (rooms 06-15) — hallway pairs
    { roomNumber: 6,  floor: "1er étage", type: "Grand Lit",      price: 5000 },  // GL 2 PAX ←→ 11 (2 PAX)
    { roomNumber: 7,  floor: "1er étage", type: "Grand Lit",      price: 5000 },  // GL 2 PAX ←→ 12 (2 PAX)
    { roomNumber: 8,  floor: "1er étage", type: "Standard 3 PAX", price: 5500 },  // 3 PAX   ←→ 13 (2 PAX)
    { roomNumber: 9,  floor: "1er étage", type: "Standard 3 PAX", price: 5500 },  // 3 PAX   ←→ 14 (2 PAX)
    { roomNumber: 10, floor: "1er étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 15 (3 PAX)
    { roomNumber: 11, floor: "1er étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 06 (GL 2 PAX)
    { roomNumber: 12, floor: "1er étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 07 (GL 2 PAX)
    { roomNumber: 13, floor: "1er étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 08 (3 PAX)
    { roomNumber: 14, floor: "1er étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 09 (3 PAX)
    { roomNumber: 15, floor: "1er étage", type: "Standard 3 PAX", price: 5500 },  // 3 PAX   ←→ 10 (2 PAX)
    // 2ème étage (rooms 16-25) — hallway pairs
    { roomNumber: 16, floor: "2ème étage", type: "Grand Lit",      price: 5000 },  // GL 2 PAX ←→ 21 (2 PAX)
    { roomNumber: 17, floor: "2ème étage", type: "Grand Lit",      price: 5000 },  // GL 2 PAX ←→ 22 (GL 2 PAX)
    { roomNumber: 18, floor: "2ème étage", type: "Standard 3 PAX", price: 5500 },  // 3 PAX   ←→ 23 (2 PAX)
    { roomNumber: 19, floor: "2ème étage", type: "Standard 3 PAX", price: 5500 },  // 3 PAX   ←→ 24 (2 PAX)
    { roomNumber: 20, floor: "2ème étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 25 (3 PAX)
    { roomNumber: 21, floor: "2ème étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 16 (GL 2 PAX)
    { roomNumber: 22, floor: "2ème étage", type: "Grand Lit",      price: 5000 },  // GL 2 PAX ←→ 17 (GL 2 PAX)
    { roomNumber: 23, floor: "2ème étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 18 (3 PAX)
    { roomNumber: 24, floor: "2ème étage", type: "Standard 2 PAX", price: 4000 },  // 2 PAX   ←→ 19 (3 PAX)
    { roomNumber: 25, floor: "2ème étage", type: "Standard 3 PAX", price: 5500 },  // 3 PAX   ←→ 20 (2 PAX)
  ];

  // Map type name → bedLayout
  const typeToLayout: Record<string, string> = {
    "Grand Lit": "1 grand lit",
    "Standard 2 PAX": "2 lits",
    "Standard 3 PAX": "3 lits",
    "Standard 4 PAX": "4 lits",
  };

  const nameToRoomType: Record<string, string> = {};
  for (const def of roomTypeDefs) {
    nameToRoomType[def.name] = roomTypes[def.name];
  }

  // Remove all old rooms and recreate with new layout
  await prisma.bookingRoom.deleteMany();
  await prisma.booking.deleteMany();
  for (const fId of Object.values(floors)) {
    await prisma.room.deleteMany({ where: { floorId: fId } });
  }

  for (const r of roomData) {
    const floorId = floors[r.floor];
    const roomTypeId = nameToRoomType[r.type];
    const bedLayout = typeToLayout[r.type];

    await prisma.room.create({
      data: {
        roomNumber: r.roomNumber,
        floorId,
        roomTypeId,
        bedLayout,
        pricePerNight: r.price,
        status: "AVAILABLE",
      },
    });
  }

  console.log("Seeded users:");
  console.log(`  Admin: ${admin.email} / admin123`);
  console.log(`  Receptionist: ${receptionist.email} / admin123`);
  console.log("Seeded floors, room types, and rooms (25 total).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
