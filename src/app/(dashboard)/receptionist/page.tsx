"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RoomTile } from "@/components/map/room-tile";
import { DetailPanel } from "@/components/map/detail-panel";
import { ShiftPanel } from "@/components/shift/shift-panel";
import { PreReservationBadge } from "@/components/shift/pre-reservation-badge";
import { SoldeCaisse } from "@/components/shift/solde-caisse";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { LogOut, Plus, BedDouble, Calendar, Clock } from "lucide-react";

interface FloorData {
  id: string;
  name: string;
  sortOrder: number;
  rooms: RoomData[];
}

interface RoomData {
  id: string;
  roomNumber: number;
  bedLayout: string;
  pricePerNight: number;
  status: string;
  photoUrl: string | null;
  notes: string | null;
  floor: { id: string; name: string };
  roomType: { name: string; bedLayoutLabel: string };
  currentBooking: {
    guestName: string;
    checkIn: string;
    checkOut: string;
    bookingId: string;
    bookingRef: string;
  } | null;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22C55E",
  OCCUPIED: "#EF4444",
  RESERVED: "#EAB308",
  BLOCKED: "#DC2626",
  MAINTENANCE: "#94A3B8",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Libre",
  OCCUPIED: "Occupée",
  RESERVED: "Réservée",
  BLOCKED: "Bloquée",
  MAINTENANCE: "Maintenance",
};

// Rooming List soria.pdf — hallway pairs (bottom row reversed so rooms face each other)
// 1er étage: 06↔11, 07↔12, 08↔13, 09↔14, 10↔15
// 2ème étage: 16↔21, 17↔22, 18↔23, 19↔24, 20↔25
const FLOOR_LAYOUTS: Record<number, { top: number[]; bottom?: number[] }> = {
  0: { top: [1, 2, 3, 4, 5] },
  1: { top: [6, 7, 8, 9, 10], bottom: [15, 14, 13, 12, 11] },
  2: { top: [16, 17, 18, 19, 20], bottom: [25, 24, 23, 22, 21] },
};

function roomsById(rooms: RoomData[]): Map<number, RoomData> {
  const m = new Map<number, RoomData>();
  for (const r of rooms) m.set(r.roomNumber, r);
  return m;
}

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [floors, setFloors] = useState<FloorData[]>([]);
  const [stats, setStats] = useState<{ totalRooms: number; statusCounts: Record<string, number> } | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [endShiftTrigger, setEndShiftTrigger] = useState(0);
  const [shiftActive, setShiftActive] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user.role !== "RECEPTIONIST" && data.user.role !== "ADMIN") {
          router.push("/login");
          return;
        }
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      });
  }, [router]);

  const fetchMap = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/rooms/map", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFloors(data.floors);
      setStats({ totalRooms: data.totalRooms, statusCounts: data.statusCounts });

      if (selectedRoom) {
        const updated = data.floors
          .flatMap((f: FloorData) => f.rooms)
          .find((r: RoomData) => r.id === selectedRoom.id);
        if (updated) setSelectedRoom(updated);
      }
    } catch { /* ignore */ }
  }, [token, selectedRoom?.id]);

  useEffect(() => {
    if (!token) return;
    fetchMap();
    const interval = setInterval(() => { fetchMap(); }, 5000);
    return () => clearInterval(interval);
  }, [token, fetchMap]);

  const handleAction = useCallback(() => {
    fetchMap();
    setSelectedRoom(null);
  }, [fetchMap]);

  function handleLogout() {
    if (shiftActive) {
      setEndShiftTrigger((n) => n + 1);
    } else {
      localStorage.removeItem("token");
      router.push("/login");
    }
  }

  if (!user) return null;

  const today = new Date().toLocaleDateString("fr-DZ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const floorsSorted = [...floors].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="h-screen flex flex-col" style={{ background: "#F1F5F9", overflow: "hidden" }}>
      {/* Premium header */}
      <header style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, borderBottom: "2px solid #D4A853",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(145deg, #D4A853, #B8942E)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 15, color: "#0F172A", letterSpacing: 1.5, fontFamily: "serif",
          }}>LCB</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "white", lineHeight: 1.3, letterSpacing: 0.3 }}>Le Cheval Blanc</div>
            <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.3, display: "flex", alignItems: "center", gap: 5 }}>
              <Calendar size={11} /> {today}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <PreReservationBadge token={token!} />
          <button onClick={() => router.push("/receptionist/history")}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.06)", color: "#CBD5E1", fontSize: 12,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              whiteSpace: "nowrap",
            }}>
            <Clock size={13} /> Historique
          </button>
          <ShiftPanel token={token!} onAction={handleAction}
            triggerEndShift={endShiftTrigger} onEndShiftDone={() => setEndShiftTrigger(0)}
            onShiftActive={setShiftActive} />
          <div style={{
            padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.08)",
            fontSize: 12, color: "#CBD5E1", fontWeight: 500, whiteSpace: "nowrap",
          }}>
            {user.name}
          </div>
          <button onClick={handleLogout}
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
          >
            <LogOut size={15} color="#FCA5A5" />
          </button>
        </div>
      </header>

      {/* Stats bar */}
      {stats && (
        <div style={{ padding: "12px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {[
                {
                  label: "Occupées", count: stats.statusCounts["OCCUPIED"] || 0,
                  color: "#DC2626", icon: "🔴",
                },
                {
                  label: "Libres", count: stats.statusCounts["AVAILABLE"] || 0,
                  color: "#16A34A", icon: "🟢",
                },
                {
                  label: "Réservées", count: stats.statusCounts["RESERVED"] || 0,
                  color: "#D97706", icon: "🟡",
                },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "white", borderRadius: 12,
                  border: "1px solid #E2E8F0",
                  padding: "8px 16px",
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: `${s.color}15`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    <BedDouble size={16} color={s.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#0F172A", lineHeight: 1.1 }}>{s.count}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.1 }}>{s.label}</div>
                  </div>
                </div>
              ))}
              <div style={{ width: 1, height: 32, background: "#E2E8F0", margin: "0 4px" }} />
              <div style={{ display: "flex", gap: 8 }}>
                {Object.entries(STATUS_LABELS).map(([status, label]) => (
                  <div key={status} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: 3,
                      background: STATUS_COLORS[status] || "#94A3B8",
                      boxShadow: `0 0 6px ${STATUS_COLORS[status]}60`,
                    }} />
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500 }}>
                      {label}{" "}
                      <span style={{ fontWeight: 700, color: "#334155" }}>{stats.statusCounts[status] || 0}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <SoldeCaisse token={token!} />
              <button onClick={() => router.push("/receptionist/book")}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
                  transition: "all 0.15s",
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.4)"}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.3)"}
              >
                <Plus size={16} /> Nouvelle réservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room map */}
      <div style={{ flex: 1, overflow: "auto", padding: "4px 24px 8px" }}>
        <OfflineIndicator />
        <InstallPrompt />
        {floorsSorted.map((floor) => {
          const layout = FLOOR_LAYOUTS[floor.sortOrder];
          if (!layout) return null;
          const byNumber = roomsById(floor.rooms);
          const topRooms = layout.top.map((n) => byNumber.get(n)).filter(Boolean) as RoomData[];
          const bottomRooms = layout.bottom?.map((n) => byNumber.get(n)).filter(Boolean) as RoomData[] || [];

          return (
            <section key={floor.id} style={{ marginBottom: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
                padding: "2px 0",
              }}>
                <div style={{
                  width: 3, height: 16, borderRadius: 2, background: "#D4A853",
                }} />
                <h3 style={{
                  fontSize: 12, fontWeight: 700, color: "#1E293B",
                }}>
                  {floor.name}
                </h3>
              </div>

              {/* Top row */}
              <div style={{ display: "flex", gap: 5 }}>
                {topRooms.map((room) => (
                  <RoomTile key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
                ))}
              </div>

              {/* Hallway divider */}
              {bottomRooms.length > 0 && (
                <div style={{
                  margin: "4px 0", height: 6, borderRadius: 3,
                  background: "linear-gradient(to right, #CBD5E1, #94A3B8, #CBD5E1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    fontSize: 8, color: "#64748B", fontWeight: 600, letterSpacing: 1.5,
                    background: "#CBD5E1", padding: "0 10px",
                  }}>
                    Couloir
                  </span>
                </div>
              )}

              {/* Bottom row */}
              {bottomRooms.length > 0 && (
                <div style={{ display: "flex", gap: 5 }}>
                  {bottomRooms.map((room) => (
                    <RoomTile key={room.id} room={room} onClick={() => setSelectedRoom(room)} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {floors.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
            <p style={{ fontSize: 14 }}>Aucune chambre configurée</p>
            <p style={{ fontSize: 12, marginTop: 2 }}>Contactez l'administrateur</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selectedRoom && (
        <>
          <div className="fixed inset-0" style={{ background: "rgba(15,23,42,0.3)", zIndex: 40 }}
            onClick={() => setSelectedRoom(null)} />
          <DetailPanel
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            role={user.role}
            onAction={handleAction}
            token={token!}
          />
        </>
      )}
    </div>
  );
}
