# MRGLA — Le Cheval Blanc Hotel Management System

## Overview
A full-stack hotel management PWA for a 25-room Algerian hotel. Handles booking wizard, room map, shift cash management, French PDF documents (Fiche de Voyageur, Reçu/Voucher, Facture/Invoice), and admin dashboards with KPIs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.9 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Base Nova style) |
| Icons | Lucide React |
| Database | PGlite (PostgreSQL WASM) via `@electric-sql/pglite-socket` |
| ORM | Prisma 7.8.0 with `@prisma/adapter-pg` |
| PDF | `@react-pdf/renderer` 4.5.1 |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Charts | Recharts |
| Offline | Dexie (IndexedDB) + custom sync queue |
| PWA | Service worker + manifest.json |

---

## Architecture

### Current (Server-dependent)
```
Browser ←→ Next.js API Routes ←→ PGlite Server (port 51214)
```
- PWA caches pages offline but API calls fail without network
- PGlite runs as a local TCP server via `pglite-socket`
- Start: `start.bat` (kills stale processes → resets data → starts PGlite → seeds → dev server)

### Planned (Fully Offline PGlite WASM)
```
Browser ←→ PGlite WASM (in-browser, IndexedDB persistence)
```
- No server dependency at all
- All API routes become local Prisma calls
- Optionally sync via ElectricSQL sync protocol when online

---

## Data Models (18 models, 6 enums)

### Enums
- **UserRole:** ADMIN, RECEPTIONIST
- **RoomStatus:** AVAILABLE, OCCUPIED, RESERVED, BLOCKED, MAINTENANCE
- **BookingStatus:** ACTIVE, CHECKED_OUT, CANCELLED
- **PaymentMethod:** CASH, TPE, PARTNER
- **Gender:** MALE, FEMALE
- **ShiftStatus:** ACTIVE, CLOSED

### Core Models

**User** (`users`) — login accounts
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | String? | |
| passwordHash | String | bcrypt |
| name | String | |
| role | UserRole | ADMIN or RECEPTIONIST |
| isActive | Boolean | default true |

**Room** (`rooms`) — 25 rooms total
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| roomNumber | Int | 01-25 |
| floorId | UUID FK→floors | 3 floors |
| roomTypeId | UUID? FK→room_types | 5 types |
| bedLayout | String | e.g. "Grand Lit" |
| pricePerNight | Decimal(10,2) | 5000-8500 DA |
| status | RoomStatus | default AVAILABLE |

**Client** (`clients`) — guest identity with Algerian ID fields
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| nom | String | surname |
| prenom | String | given name |
| maidenName | String? | married name |
| dateOfBirth | Date? | |
| nationality | String? | |
| phone | String | |
| wilaya | String | Algerian province |
| gender | Gender | |

**Booking** (`bookings`) — reservation records
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| bookingRef | String unique | e.g. "LCB-2026-001" |
| checkIn / checkOut | Date | |
| totalAmount | Decimal(10,2) | |
| paymentMethod | PaymentMethod | CASH / TPE / PARTNER |
| status | BookingStatus | ACTIVE / CHECKED_OUT / CANCELLED |
| isMarried | Boolean | for shared booking |
| isGroup | Boolean | group booking |
| acte | String? | marriage certificate |

**ShiftReport** (`shift_reports`) — receptionist cash management
| Field | Type | Notes |
|---|---|---|
| startingCash | Decimal(10,2) | cash at shift start |
| cashCollected / tpeCollected / partnerCollected | Decimal | actual payment collections |
| declaredCash / declaredTpe / declaredPartner | Decimal | declared at shift end |
| endingCash | Decimal(10,2)? | calculated end cash |
| expectedCash | Decimal(10,2)? | expected vs actual |
| cashDifference | Decimal(10,2)? | gap amount |

**HotelSetting** (`hotel_settings`) — singleton (id = "default")
| Field | Type | Default |
|---|---|---|
| hotelName | String | "MRGLA Hotel" |
| logoUrl | String? | |
| checkInTime | String | "14:00" |
| checkOutTime | String | "12:00" |
| currencySymbol | String | "DA" |
| rc | String? | Registre de Commerce |
| nif | String? | NIF fiscal |
| nis | String? | NIS social |

**Other models:** Floor, RoomType, Partner, BookingRoom, BookingGuest, ChildAge, PreReservation, Cancellation, CheckoutAlert, Expense, LoginLog, Discount

---

## Room Layout (soria.pdf)
- **Rez-de-chaussée:** Rooms 01-05 (5 rooms)
- **1er étage:** Rooms 06-15 (10 rooms, hallway pairs: 06↔11, 07↔12, 08↔13, 09↔14, 10↔15)
- **2ème étage:** Rooms 16-25 (10 rooms, hallway pairs: 16↔21, 17↔22, 18↔23, 19↔24, 20↔25)

---

## Pages (15 total)

### Public
| Route | Purpose |
|---|---|
| `/login` | User selection + password auth |

### Receptionist Dashboard
| Route | Purpose |
|---|---|
| `/receptionist` | Room map with status tiles, shift panel, pre-reservation badge, solde de caisse |
| `/receptionist/book` | Booking wizard (shift guard, client form with ID fields, room selection, discounts) |
| `/receptionist/history` | Booking history with search, Voucher PDF, Fiche de Voyageur print, Facture PDF |

### Admin Dashboard
| Route | Purpose |
|---|---|
| `/admin` | KPIs (revenue, occupancy, alerts), revenue chart, system reset button |
| `/admin/bookings` | Full booking search and management |
| `/admin/clients` | Client profiles + history |
| `/admin/floors` | Floor CRUD + reorder |
| `/admin/rooms` | Room CRUD + price/status management |
| `/admin/reports` | Booking/occupancy/revenue PDF reports |
| `/admin/users` | User CRUD |
| `/admin/partners` | Partner agency CRUD |
| `/admin/discounts` | Discount code CRUD |
| `/admin/settings` | Hotel branding, contact, RC/NIF/NIS |

---

## API Routes (37 route files across 15 groups)

| Group | Routes | Purpose |
|---|---|---|
| Auth | POST `/api/auth/login`, GET `/api/auth/me`, GET `/api/auth/users` | JWT login, identity, user list |
| Rooms | GET/POST `/api/rooms`, CRUD `/api/rooms/[id]`, GET `/api/rooms/map`, GET `/api/available-rooms` | Room inventory + map |
| Room Types | GET/POST `/api/room-types`, PUT/DELETE `/api/room-types/[id]` | Room type CRUD |
| Floors | GET/POST `/api/floors`, PUT/DELETE `/api/floors/[id]`, POST `/api/floors/[id]/deactivate`, POST `/api/floors/reorder` | Floor CRUD + ordering |
| Bookings | GET/POST `/api/bookings`, CRUD `/api/bookings/[id]`, POST `/api/bookings/[id]/checkout`, POST `/api/bookings/[id]/cancel`, GET `/api/bookings/[id]/voucher`, GET `/api/bookings/[id]/invoice` | Full booking lifecycle |
| Clients | GET/POST `/api/clients`, GET `/api/clients/[id]/bookings` | Client management |
| Partners | GET/POST `/api/partners`, PUT/DELETE `/api/partners/[id]` | Partner agencies |
| Discounts | GET/POST `/api/discounts`, PUT/DELETE `/api/discounts/[id]`, POST `/api/discounts/validate` | Promo codes |
| Shifts | GET/POST `/api/shift`, GET `/api/shift/last`, POST `/api/shift/end`, GET/POST `/api/shift/expenses` | Shift cash management |
| Checkout Alerts | GET/PUT `/api/checkout-alerts` | Departure alerts |
| Pre-Reservations | GET/POST/DELETE `/api/pre-reservations` | Phone reservations |
| Settings | GET/PUT `/api/settings` | Hotel configuration |
| Users | GET/POST `/api/users`, PUT/DELETE `/api/users/[id]` | User management |
| Admin | GET `/api/admin/kpis`, GET `/api/admin/alerts`, POST `/api/admin/reset` | Admin dashboard + reset |

---

## PDF Documents (5 templates)

| Document | File | Contents |
|---|---|---|
| Voucher / Reçu | `voucher-pdf.tsx` | A4 landscape, hotel header, booking ref, guest name, room list, pricing, total, footer |
| Facture / Invoice | `invoice-pdf.tsx` | A4 portrait, centered logo, ORAN date, RC/NIF/NIS, tax breakdown table (Taxe Séjour 100 DA/nuit, D. Timbre 1%), TVA 0%, total TTC, amount in French words |
| Booking Report | `booking-report.tsx` | Tabular: guest, rooms, dates, amounts, status, payment |
| Occupancy Report | `occupancy-report.tsx` | Per-room occupancy with percentages |
| Revenue Report | `revenue-report.tsx` | Daily revenue by payment method |

---

## Key Business Logic

### Booking Flow
1. Receptionist starts shift (declares starting cash)
2. Opens booking wizard → selects rooms → fills guest details (nom, prénom, ID document, phone, wilaya, nationality, gender, etc.)
3. Adds children (name, age, optional ID) or marriage details
4. Applies discount code (optional)
5. Selects payment method (Cash/TPE/Partner)
6. Confirms → booking saved, rooms marked OCCUPIED

### Auto Checkout
- At 12:00 noon each day, active bookings due to check out are flagged
- Dashboard shows orange badge with count of today's departures
- Manual checkout: creates CheckoutAlert, room set to AVAILABLE

### Shift Management
- Only one active shift at a time
- Shift end requires declaring CASH/TPE/PARTNER collected amounts
- System calculates expected vs declared, shows difference
- Expenses (petty cash) can be logged against shift

### Cancel Flow
- Reason category + free text
- Records which user cancelled
- Sets booking status to CANCELLED, room to AVAILABLE
- Optional callback flag

### Invoice Calculation
```
Room subtotal = Σ(room_price × nights)
Taxe Séjour  = 100 DA × adult_count × nights
D. Timbre    = 1% × (room_subtotal + children_charge − discount)
TVA          = 0%
TOTAL TTC    = room_subtotal + Taxe Séjour + D. Timbre + children_charge − discount
```

---

## Authentication & Authorization

- JWT tokens (signed with `JWT_SECRET` env var)
- Middleware (`src/proxy.ts`) enforces role-based route access:
  - **ADMIN:** floors, rooms, room-types, admin, partners, settings, discounts, users
  - **RECEPTIONIST:** shift, expenses
  - **Any:** auth/me, available-rooms, rooms/map, bookings, clients, checkout-alerts, discounts/validate, shift/last
- API route handlers also call `requireAnyUser()`, `requireAdmin()`, or `requireReceptionist()` from `src/lib/api-auth.ts`

---

## Seed Data

| Entity | Details |
|---|---|
| Users (4) | admin@hotel.com (ADMIN), amel@hotel.com / karim@hotel.com / soria@hotel.com (RECEPTIONIST) — all password `admin123` |
| Hotel Settings | Le Cheval Blanc, RC/NIF/NIS, logo, check-in 14:00, check-out 12:00, currency DA |
| Room Types (5) | Grand Lit, Standard 2/3/4 PAX, Mixte |
| Floors (3) | Rez-de-chaussée, 1er étage, 2ème étage |
| Rooms (25) | 01-05 (RDC), 06-15 (1er), 16-25 (2ème) — prices 5000-8500 DA |
| Discounts (3) | WELCOME10 (10%), FLAT5000 (5000 DA off min 30000), SUMMER20 (20% max 50 uses) |

---

## Known Constraints & Gotchas

| Issue | Fix |
|---|---|
| PGlite default max-connections = 1 | Must pass `--max-connections 10` |
| Data dir corruption | Delete `data/pglite` each start (done in `start.bat`) |
| Prisma CLI can't connect to PGlite | Use `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` to generate SQL |
| `>` in PowerShell creates UTF-16 LE (BOM) | Use `Set-Content -Encoding UTF8` or run in CMD |
| Schema mismatch on Vercel (missing rc/nif/nis) | Auto-migrate via `ensure-settings-columns.ts` on first request |

---

## Project Structure

```
MRGLA/
├── prisma/schema.prisma          # Data model (366 lines)
├── data/
│   ├── schema.sql                # DDL generated by Prisma
│   ├── seed-raw.mjs              # Seeds users, rooms, settings
│   ├── apply-schema.mjs          # Applies schema.sql to PGlite
│   ├── auto-seed.mjs             # Auto-seed on production start
│   └── pglite/                   # Runtime DB (deleted on restart)
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Login page
│   │   ├── (dashboard)/
│   │   │   ├── receptionist/     # 3 pages: dashboard, book, history
│   │   │   └── admin/            # 10 pages + layout
│   │   └── api/                  # 37 route handlers
│   ├── components/
│   │   ├── ui/                   # 13 shadcn/ui components
│   │   ├── map/                  # Room map tiles + detail panel
│   │   ├── shift/                # Shift panel, solde caisse, pre-res badge
│   │   ├── fiche/                # Fiche de Voyageur
│   │   └── pwa/                  # Service worker, offline indicator, install prompt
│   ├── lib/
│   │   ├── reports/              # 5 PDF templates
│   │   ├── auth.ts               # JWT + bcrypt helpers
│   │   ├── api-auth.ts           # Role-based guard functions
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── db.ts                 # Dexie IndexedDB schema
│   │   ├── room-service.ts       # Room availability logic
│   │   ├── sync.ts               # Offline sync queue
│   │   ├── ensure-settings-columns.ts  # Auto-migration helper
│   │   └── utils.ts              # cn() utility
│   ├── generated/prisma/         # Generated Prisma Client
│   └── proxy.ts                  # Next.js middleware (auth + role guard)
├── docker/                       # Docker compose + Dockerfile
├── public/                       # Static assets, manifest.json
├── start.bat                     # Development startup script
└── AGENTS.md                     # Project guide (constraints, commands, key files)
```

---

## Startup

### Development
```
start.bat
```
- Kills processes on ports 51214 + 3000
- Removes + recreates `data/pglite/`
- Starts PGlite with `--max-connections 10`
- Waits 7s, applies schema, seeds data
- Starts `next dev` on port 3000

### Login
- `receptionist@hotel.com` / `admin123` (or any seeded user)

### Key Commands
```bash
node data/apply-schema.mjs                    # Apply SQL schema
node data/seed-raw.mjs                        # Seed data
npx prisma generate                           # Regenerate Prisma Client
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
```

---

## Offline & PWA

### Current State
- Service worker caches static assets (pages, JS, CSS)
- Dexie IndexedDB (`src/lib/db.ts`) caches rooms, bookings, shift data
- Custom sync queue (`src/lib/sync.ts`) queues mutations when offline
- **Limitation:** API calls fail without network — no bookings, no PDFs, no room map

### Future Plan: Full Offline PGlite WASM
- Replace server PGlite with `@electric-sql/pglite` running in-browser via WASM
- All API routes become local Prisma calls against in-browser PGlite
- IndexedDB persistence via PGlite's native storage
- ElectricSQL sync protocol for multi-device sync when online
- No `start.bat`, no PGlite socket, no server dependencies
