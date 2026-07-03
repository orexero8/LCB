<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MRGLA — Le Cheval Blanc Hotel Management

## Quick Start
```bash
start.bat   # kills stale processes, resets data, starts PGlite, seeds, starts dev server
```
- Login: `receptionist@hotel.com` / `admin123`
- Port: 3000 (frontend), 51214 (PGlite)
- PGlite must use `--max-connections 10` — default is 1, causing ECONNRESET on Prisma pooled queries

## Stack
- PostgreSQL via **PGlite** with `pglite-socket` server on port **51214** (not 51244)
- **Prisma ORM** 7.8.0 with `@prisma/adapter-pg` (runtime only)
- **Next.js App Router** with TypeScript
- pg.Client (single connection) for DB setup scripts

## Critical Constraints
| Constraint | Detail |
|---|---|
| PGlite default max-connections = 1 | Must pass `--max-connections 10` or Prisma pools get ECONNRESET — **the root cause of all prior instability** |
| Data dir corruption | Reset `data/pglite` each start (already in `start.bat`) |
| Prisma CLI incompatible | Can't connect to PGlite: `P1001` error. Use `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` to generate SQL |
| Prisma Client runtime | Works for basic queries but can have issues with PGlite — use raw `pg.Client` for setup scripts |
| `>` in PowerShell | `npx ... > data/schema.sql` creates UTF-16 LE (BOM). Use `npx ... 2>$null | Set-Content -Path data/schema.sql -Encoding UTF8` instead or run the command in CMD |

## Commands
- `node data/apply-schema.mjs` — applies generated SQL schema
- `node data/seed-raw.mjs` — seeds users, rooms, floors, room types, discounts
- `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > data/schema.sql` — regenerate schema SQL
- `npx prisma generate` — regenerate Prisma Client (runs on `npm run dev`)

## Rooming List (soria.pdf)
- 25 rooms: 01-05 (Rez-de-chaussée), 06-15 (1er étage), 16-25 (2ème étage)
- Hallway pairs: 06↔11, 07↔12, 08↔13, 09↔14, 10↔15 (1er) | 16↔21, 17↔22, 18↔23, 19↔24, 20↔25 (2ème)

## Client Model (ID Document Fields)
| Field | DB Column | Map Label |
|---|---|---|
| `idDocument` | `id_document` | N° (number) |
| `idDeliveryDate` | `id_delivery_date` | Délivré le (issued on) |
| `idDeliveryPlace` | `id_delivery_place` | A (place issued) |
| `idAuthority` | `id_authority` | Par (issuing authority) |

## Key Files
- `start.bat` — launch everything
- `src/app/api/rooms/map/route.ts` — rooms API (was failing before max-connections fix)
- `src/components/shift/shift-panel.tsx` — shift start/end modal
- `src/components/fiche/fiche-voyageur.tsx` — A4 landscape Fiche de Voyageur template (auto-fills nationality + ID fields)
- `src/app/(dashboard)/receptionist/book/page.tsx` — booking wizard with shift guard + ID document fields
- `src/app/(dashboard)/receptionist/history/page.tsx` — booking history + Fiche print + Voucher PDF download
- `src/app/(dashboard)/receptionist/page.tsx` — dashboard with room map
