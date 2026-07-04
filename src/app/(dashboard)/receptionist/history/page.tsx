"use client";

import { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { useRouter } from "next/navigation";
import { Calendar, BedDouble, User, Search, X, Printer, Users } from "lucide-react";
import { FicheVoyageur } from "@/components/fiche/fiche-voyageur";
import type { FicheData, GuestInfo } from "@/components/fiche/fiche-voyageur";

interface BookingRow {
  id: string;
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  roomNumbers: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface GuestEntry {
  nom: string;
  prenom: string;
  maidenName: string | null;
  dateOfBirth: string | null;
  profession: string | null;
  address: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  idDocument: string | null;
  idDeliveryDate: string | null;
  idDeliveryPlace: string | null;
  idAuthority: string | null;
  wilaya: string | null;
  isPrimary: boolean;
}

interface ChildEntry {
  nom: string;
  prenom: string;
  age: number;
  dateOfBirth: string | null;
  wilaya: string | null;
  idDocument: string | null;
  idDeliveryDate: string | null;
  idDeliveryPlace: string | null;
  idAuthority: string | null;
}

interface BookingDetail {
  id: string;
  bookingRef: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: string;
  isMarried: boolean;
  acte: string | null;
  totalAmount: number;
  discountAmount: number;
  discountCode: string | null;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
  primaryGuest: GuestEntry | null;
  allGuests: GuestEntry[];
  children: ChildEntry[];
  rooms: { roomNumber: number; floor: string; type: string; priceAtBooking: number }[];
  partner: { name: string; contactPhone: string | null } | null;
  receptionist: string;
  hotel: { name: string; address: string | null; phone: string | null; email?: string | null; whatsapp?: string | null; logoUrl: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  CHECKED_OUT: "Sorti",
  CANCELLED: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#22C55E",
  CHECKED_OUT: "#64748B",
  CANCELLED: "#EF4444",
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  "Grand Lit": "Grand Lit",
  "Standard 2 PAX": "Standard 2",
  "Standard 3 PAX": "Standard 3",
  "Standard 4 PAX": "Standard 4",
  "Mixte": "Mixte",
};

export default function HistoryPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [query, setQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFiche, setShowFiche] = useState(false);
  const [ficheTarget, setFicheTarget] = useState<{ guest: GuestInfo; label: string; childrenUnder15?: number } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        if (d.user.role !== "RECEPTIONIST" && d.user.role !== "ADMIN") router.push("/login");
      })
      .catch(() => { localStorage.removeItem("token"); router.push("/login"); });
  }, [router]);

  const fetchBookings = useCallback(async (q?: string) => {
    if (!token) return;
    try {
      const params = q?.trim() ? `?q=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/bookings${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchBookings();
  }, [token, fetchBookings]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => fetchBookings(query), 300);
    return () => clearTimeout(timer);
  }, [query, token, fetchBookings]);

  async function openDetail(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setSelectedBooking(data.booking);
      setShowFiche(false);
      setFicheTarget(null);
    } catch { /* ignore */ }
  }

  function openFiche(guest: GuestInfo, label: string, childrenUnder15?: number) {
    setFicheTarget({ guest, label, childrenUnder15 });
    setShowFiche(true);
  }

  function buildFicheData(target: { guest: GuestInfo; label: string; childrenUnder15?: number }, booking: BookingDetail): FicheData {
    return {
      hotel: booking.hotel,
      bookingRef: booking.bookingRef,
      rooms: booking.rooms,
      guest: target.guest,
      relationLabel: target.label,
      childrenUnder15: target.childrenUnder15,
      checkIn: booking.checkIn,
      acte: booking.acte,
    };
  }

  function printFiche(data: FicheData) {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow!.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:0}@media print{body{-webkit-print-color-adjust:exact}}body{margin:0;padding:0;font-family:Arial,sans-serif}</style></head><body></body></html>');
    doc.close();
    const root = createRoot(doc.body);
    root.render(<FicheVoyageur data={data} />);
    setTimeout(() => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }

  function guestToInfo(g: GuestEntry): GuestInfo {
    return {
      nom: g.nom,
      prenom: g.prenom,
      maidenName: g.maidenName,
      dateOfBirth: g.dateOfBirth,
      profession: g.profession,
      address: g.address,
      nationality: g.nationality,
      email: g.email,
      phone: g.phone || undefined,
      idDocument: g.idDocument,
      idDeliveryDate: g.idDeliveryDate,
      idDeliveryPlace: g.idDeliveryPlace,
      idAuthority: g.idAuthority,
      wilaya: g.wilaya,
    };
  }

  function childToInfo(c: ChildEntry): GuestInfo {
    return {
      nom: c.nom,
      prenom: c.prenom,
      dateOfBirth: c.dateOfBirth,
      wilaya: c.wilaya,
      profession: undefined,
      address: undefined,
      nationality: undefined,
      email: undefined,
      phone: undefined,
      idDocument: c.idDocument,
      idDeliveryDate: c.idDeliveryDate,
      idDeliveryPlace: c.idDeliveryPlace,
      idAuthority: c.idAuthority,
    };
  }

  const allFamilyMembers = selectedBooking
    ? [
        ...(selectedBooking.allGuests || []).map((g) => ({
          guest: g,
          label: g.isPrimary ? "Chef de famille" : "Conjoint(e)",
        })),
        ...(selectedBooking.children || []).map((c, i) => ({
          guest: c,
          label: `Enfant ${i + 1} (${c.age} ans)`,
        })),
      ]
    : [];

  return (
    <div className="h-screen flex flex-col" style={{ background: "#F1F5F9" }}>
      {/* Header */}
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
            <div style={{ fontSize: 17, fontWeight: 800, color: "white", lineHeight: 1.3 }}>Historique des réservations</div>
          </div>
        </div>
        <button onClick={() => router.push("/receptionist")}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#CBD5E1", fontSize: 13, cursor: "pointer" }}>
          Plan des chambres
        </button>
      </header>

      {/* Search */}
      <div style={{ padding: "16px 24px", flexShrink: 0 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone..."
            style={{
              width: "100%", height: 42, padding: "0 16px 0 38px", fontSize: 14,
              border: "1px solid #E2E8F0", borderRadius: 10, outline: "none",
              background: "white",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 24px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Chargement...</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Aucune réservation trouvée</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["Réf", "Client", "Téléphone", "Chambre", "Arrivée", "Départ", "Nuits", "Total", "Statut", "Créé le"].map((h) => (
                  <th key={h} style={{ padding: "12px 10px", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} onClick={() => openDetail(b.id)}
                  style={{ borderBottom: "1px solid #F1F5F9", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseOver={(e) => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 10px", fontSize: 13, fontFamily: "monospace", fontWeight: 600, color: "#2563EB" }}>{b.bookingRef}</td>
                  <td style={{ padding: "12px 10px", fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={14} color="#64748B" /> {b.guestName}
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px", fontSize: 12, color: "#64748B" }}>{b.guestPhone}</td>
                  <td style={{ padding: "12px 10px", fontSize: 12, color: "#1E293B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <BedDouble size={12} color="#64748B" /> {b.roomNumbers}
                    </div>
                  </td>
                  <td style={{ padding: "12px 10px", fontSize: 12, color: "#64748B" }}>{b.checkIn}</td>
                  <td style={{ padding: "12px 10px", fontSize: 12, color: "#64748B" }}>{b.checkOut}</td>
                  <td style={{ padding: "12px 10px", fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{b.nights}</td>
                  <td style={{ padding: "12px 10px", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{b.totalAmount.toLocaleString()} DA</td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: `${STATUS_COLORS[b.status] || "#94A3B8"}15`,
                      color: STATUS_COLORS[b.status] || "#94A3B8",
                    }}>
                      {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                    {new Date(b.createdAt).toLocaleDateString("fr-DZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selectedBooking && !showFiche && (
        <>
          <div className="fixed inset-0" style={{ background: "rgba(15,23,42,0.4)", zIndex: 40 }}
            onClick={() => setSelectedBooking(null)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 50, background: "white", borderRadius: 16, padding: 32,
            width: 640, maxHeight: "85vh", overflow: "auto",
            boxShadow: "0 32px 64px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", margin: 0 }}>
                  Réservation {selectedBooking.bookingRef}
                </h2>
                <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                  {new Date(selectedBooking.createdAt).toLocaleString("fr-DZ")}
                </p>
              </div>
              <button onClick={() => setSelectedBooking(null)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#64748B" />
              </button>
            </div>

            {/* Booking info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, fontSize: 13 }}>
              <div><span style={{ color: "#94A3B8" }}>Arrivée :</span> {selectedBooking.checkIn}</div>
              <div><span style={{ color: "#94A3B8" }}>Départ :</span> {selectedBooking.checkOut} ({selectedBooking.nights} nuits)</div>
              <div><span style={{ color: "#94A3B8" }}>Chambres :</span> {selectedBooking.rooms.map((r) => r.roomNumber.toString().padStart(2, "0")).join(", ")}</div>
              <div><span style={{ color: "#94A3B8" }}>Paiement :</span> {selectedBooking.paymentMethod === "CASH" ? "Espèces" : selectedBooking.paymentMethod === "TPE" ? "Carte" : `Partenaire (${selectedBooking.partner?.name || ""})`}</div>
              <div><span style={{ color: "#94A3B8" }}>Montant :</span> <span style={{ fontWeight: 700, fontSize: 15, color: "#2563EB" }}>{selectedBooking.totalAmount.toLocaleString()} DA</span></div>
              <div><span style={{ color: "#94A3B8" }}>Réceptionniste :</span> {selectedBooking.receptionist}</div>
            </div>

            {selectedBooking.isMarried && selectedBooking.acte && (
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                <span style={{ color: "#94A3B8" }}>Marié(e) - Acte N° :</span> {selectedBooking.acte}
              </div>
            )}

            {selectedBooking.discountAmount > 0 && (
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                <span style={{ color: "#94A3B8" }}>Remise :</span> -{selectedBooking.discountAmount.toLocaleString()} DA
                {selectedBooking.discountCode && ` (code: ${selectedBooking.discountCode})`}
              </div>
            )}

            {selectedBooking.notes && (
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16, background: "#F8FAFC", padding: 10, borderRadius: 8 }}>
                <span style={{ color: "#94A3B8" }}>Notes :</span> {selectedBooking.notes}
              </div>
            )}

            {/* Family members */}
            {allFamilyMembers.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Users size={15} color="#64748B" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Membres de la famille ({allFamilyMembers.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {allFamilyMembers.map((m, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", background: "#F8FAFC", borderRadius: 8,
                      border: "1px solid #E2E8F0",
                    }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1E293B" }}>{m.guest.nom + " " + m.guest.prenom}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", marginLeft: 6 }}>({m.label})</span>
                      </div>
                      <button onClick={() => {
                        const guestInfo = "age" in m.guest
                          ? childToInfo(m.guest as ChildEntry)
                          : guestToInfo(m.guest as GuestEntry);
                        const childrenUnder15 = "isPrimary" in m.guest && (m.guest as GuestEntry).isPrimary
                          ? (selectedBooking.children || []).filter((c: ChildEntry) => c.age < 15).length
                          : undefined;
                        openFiche(guestInfo, m.label, childrenUnder15);
                      }}
                        style={{
                          padding: "5px 12px", borderRadius: 6, border: "none",
                          background: "#0F172A", color: "white", fontSize: 11, fontWeight: 600,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                        }}>
                        <Printer size={12} /> Fiche
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom actions */}
            <div style={{ display: "flex", gap: 8, borderTop: "1px solid #E2E8F0", paddingTop: 16 }}>
              {/* Fiche button for primary guest when alone */}
              {allFamilyMembers.length <= 1 && selectedBooking.primaryGuest && (
                <button onClick={() => {
                  openFiche(
                    guestToInfo(selectedBooking.primaryGuest as GuestEntry),
                    "Chef de famille",
                    (selectedBooking.children || []).filter((c: ChildEntry) => c.age < 15).length,
                  );
                }}
                  style={{
                    padding: "10px 20px", borderRadius: 10, border: "none",
                    background: "#0F172A", color: "white", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}>
                  <Printer size={15} /> Fiche de Voyageur
                </button>
              )}
              <button onClick={async () => {
                const res = await fetch(`/api/bookings/${selectedBooking.id}/voucher/pdf`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const blob = await res.blob();
                window.open(URL.createObjectURL(blob), "_blank");
              }}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "2px solid #0F172A",
                  background: "white", color: "#0F172A", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                }}>
                <Printer size={15} /> Reçu PDF
              </button>
              <button onClick={() => setSelectedBooking(null)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "2px solid #E2E8F0", background: "white", fontSize: 13, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                Fermer
              </button>
            </div>
          </div>
        </>
      )}

      {/* Fiche de Voyageur modal */}
      {selectedBooking && showFiche && ficheTarget && (
        <>
          <div className="fixed inset-0" style={{ background: "rgba(15,23,42,0.4)", zIndex: 40 }}
            onClick={() => setShowFiche(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            zIndex: 50, background: "white", borderRadius: 16, overflow: "hidden",
            boxShadow: "0 32px 64px rgba(0,0,0,0.2)",
            width: "95vw", maxWidth: 1100, maxHeight: "90vh",
          }}>
            <div style={{ position: "sticky", top: 0, background: "white", borderBottom: "1px solid #E2E8F0", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: 0 }}>
                Fiche de Voyageur — {ficheTarget.guest.nom + " " + ficheTarget.guest.prenom}
                <span style={{ fontWeight: 400, color: "#94A3B8", marginLeft: 6 }}>({ficheTarget.label})</span>
              </h3>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => printFiche(buildFicheData(ficheTarget, selectedBooking!))}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#0F172A", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Printer size={14} /> Imprimer
                </button>
                <button onClick={() => {
                  // Show next person's fiche
                  const idx = allFamilyMembers.findIndex((m) => m.guest.nom === ficheTarget.guest.nom && m.guest.prenom === ficheTarget.guest.prenom && m.label === ficheTarget.label);
                  const next = (idx + 1) % allFamilyMembers.length;
                  const m = allFamilyMembers[next];
                  const guestInfo = "age" in m.guest
                    ? childToInfo(m.guest as ChildEntry)
                    : guestToInfo(m.guest as GuestEntry);
                  const childrenUnder15 = "isPrimary" in m.guest && (m.guest as GuestEntry).isPrimary
                    ? (selectedBooking.children || []).filter((c: ChildEntry) => c.age < 15).length
                    : undefined;
                  setFicheTarget({ guest: guestInfo, label: m.label, childrenUnder15 });
                }}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", color: "#1E293B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Suivant ({allFamilyMembers.length})
                </button>
                <button onClick={() => setShowFiche(false)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>
            </div>
            <div style={{ overflow: "auto", maxHeight: "calc(90vh - 52px)" }}>
              <FicheVoyageur data={buildFicheData(ficheTarget, selectedBooking)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
