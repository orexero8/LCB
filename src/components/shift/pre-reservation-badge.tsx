"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Clock, X, Trash2 } from "lucide-react";

interface PreReservationData {
  id: string;
  guestName: string;
  phone: string;
  roomId: string;
  roomNumber: number;
  checkIn: string;
  checkOut: string;
  notes: string | null;
  createdAt: string;
}

export function PreReservationBadge({ token }: { token: string }) {
  const router = useRouter();
  const [preReservations, setPreReservations] = useState<PreReservationData[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchPreReservations = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/pre-reservations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPreReservations(data.preReservations || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!token) return;
    fetchPreReservations();
    const interval = setInterval(fetchPreReservations, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setDeleteConfirmId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/pre-reservations?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setPreReservations((prev) => prev.filter((pr) => pr.id !== id));
      setDeleteConfirmId(null);
    } catch { /* ignore */ }
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setOpen(!open); fetchPreReservations(); }}
        style={{
          padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
          background: preReservations.length > 0 ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.06)",
          color: preReservations.length > 0 ? "#D4A853" : "#CBD5E1", fontSize: 12,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap", position: "relative",
        }}>
        <Clock size={13} /> Pré-réservations
        {preReservations.length > 0 && (
          <span style={{
            background: "#D4A853", color: "#0F172A", borderRadius: 10,
            padding: "1px 7px", fontSize: 11, fontWeight: 800, lineHeight: "18px",
            minWidth: 20, textAlign: "center",
          }}>
            {preReservations.length}
          </span>
        )}
      </button>

      {open && (
        <div ref={dropdownRef} style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 380, maxHeight: 400, overflow: "auto",
          background: "white", borderRadius: 14,
          boxShadow: "0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.08)",
          border: "1px solid #E2E8F0", zIndex: 100,
        }}>
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid #E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>
              Pré-réservations ({preReservations.length})
            </span>
            <button onClick={() => setOpen(false)}
              style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color="#64748B" />
            </button>
          </div>

          {preReservations.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              Aucune pré-réservation
            </div>
          ) : (
            preReservations.map((pr) => (
              <div key={pr.id} style={{
                padding: "12px 16px", borderBottom: "1px solid #F1F5F9",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Clock size={16} color="#D97706" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>{pr.guestName}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>Tél: {pr.phone}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>
                    Ch. {pr.roomNumber} &middot; {pr.checkIn} → {pr.checkOut}
                  </div>
                  {pr.notes && (
                    <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", marginTop: 1 }}>
                      {pr.notes}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button onClick={() => { router.push(`/receptionist/book?preReservationId=${pr.id}`); setOpen(false); }}
                      style={{
                        padding: "4px 12px", borderRadius: 6, border: "1px solid #D4A853",
                        background: "#FFFBEB", fontSize: 11, fontWeight: 600,
                        color: "#92400E", cursor: "pointer",
                      }}>
                      Ouvrir
                    </button>
                    {deleteConfirmId === pr.id ? (
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button onClick={() => handleDelete(pr.id)}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#EF4444", fontSize: 11, fontWeight: 600, color: "white", cursor: "pointer" }}>
                          Confirmer
                        </button>
                        <button onClick={() => setDeleteConfirmId(null)}
                          style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "white", fontSize: 11, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(pr.id)}
                        style={{
                          padding: "4px 8px", borderRadius: 6, border: "1px solid #FECACA",
                          background: "#FEF2F2", fontSize: 11, color: "#DC2626",
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                        }}>
                        <Trash2 size={11} /> Suppr.
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
