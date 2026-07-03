import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BedSingle, BedDouble, Crown, X } from "lucide-react";

interface RoomDetail {
  id: string;
  roomNumber: number;
  bedLayout: string;
  pricePerNight: number;
  status: string;
  photoUrl: string | null;
  notes: string | null;
  floor: { name: string };
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
  BLOCKED: "#94A3B8",
  MAINTENANCE: "#94A3B8",

};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Libre",
  OCCUPIED: "Occupée",
  RESERVED: "Réservée",
  BLOCKED: "Bloquée",
  MAINTENANCE: "Maintenance",

};

const roomTypeIcon = (bedLayout: string, size = 30) => {
  const layout = bedLayout?.toLowerCase() || "";
  if (layout.includes("grand lit") && (layout.includes("simple") || layout.includes("petit"))) return <BedDouble size={size} color="#1E293B" />;
  if (layout.includes("1 grand") && !layout.includes("+")) return <Crown size={size} color="#1E293B" />;
  if (layout.includes("2 lits") || layout.includes("séparés")) return <BedDouble size={size} color="#1E293B" />;
  return <BedSingle size={size} color="#1E293B" />;
};

export function DetailPanel({
  room,
  onClose,
  role,
  onAction,
  token,
}: {
  room: RoomDetail;
  onClose: () => void;
  role: string;
  onAction: () => void;
  token: string;
}) {
  const router = useRouter();
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState<any>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelText, setCancelText] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!room.currentBooking) return;
    setIsProcessing(true); setError(null);
    try {
      const res = await fetch(`/api/bookings/${room.currentBooking.bookingId}/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ markReady: true }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      toast.success(`Chambre ${room.roomNumber} libérée et prête`);
      setShowCheckoutConfirm(false); onAction();
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  }

  async function handleCancel() {
    if (!room.currentBooking || !cancelReason) return;
    setIsProcessing(true); setError(null);
    try {
      const res = await fetch(`/api/bookings/${room.currentBooking.bookingId}/cancel`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reasonCategory: cancelReason, reasonText: cancelText }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      toast.success("Réservation annulée");
      setShowCancelConfirm(false); setCancelReason(""); setCancelText(""); onAction();
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  }

  async function handleShowVoucher() {
    if (!room.currentBooking) return;
    setIsProcessing(true); setError(null);
    try {
      const res = await fetch(`/api/bookings/${room.currentBooking.bookingId}/voucher`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setVoucherData(data.voucher); setShowVoucher(true);
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  }

  const bg = STATUS_COLORS[room.status] || "#94A3B8";

  return (
    <>
      <div style={{
        position: "fixed", inset: "0 0 0 auto", width: 330, background: "white",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", zIndex: 50,
        display: "flex", flexDirection: "column",
      }}>
        {/* Header with room icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 20px 16px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center",
            justifyContent: "center", background: bg,
          }}>
            {roomTypeIcon(room.bedLayout, 28)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>Chambre {room.roomNumber}</h2>
              <span style={{
                display: "inline-block", padding: "2px 10px", borderRadius: 8,
                fontSize: 12, fontWeight: 700, background: bg, color: "white",
              }}>{STATUS_LABELS[room.status] || room.status}</span>
            </div>
            <span style={{ fontSize: 13, color: "#64748B" }}>{room.floor.name}</span>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10, background: "#F1F5F9", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={18} color="#64748B" />
          </button>
        </div>

        {/* Info rows */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 20px" }}>
          <div style={{ borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", marginTop: 8 }}>
            {[
              { label: "Lits", value: room.bedLayout || "--" },
              { label: "Lit", value: room.bedLayout },
              { label: "Prix", value: `${room.pricePerNight.toLocaleString()} DA/nuit` },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #E2E8F0" : "none",
              }}>
                <span style={{ color: "#64748B", fontSize: 14 }}>{row.label}</span>
                <span style={{ color: "#1E293B", fontWeight: 600, fontSize: 14 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {room.currentBooking && (
            <div style={{ borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", marginTop: 12 }}>
              <div style={{ padding: "14px 16px", background: "#F8FAFC", fontSize: 13, fontWeight: 700, color: "#64748B", borderBottom: "1px solid #E2E8F0" }}>
                Réservation en cours
              </div>
              <div style={{ padding: "12px 16px" }}>
                {[
                  { label: "Client", value: room.currentBooking.guestName },
                  { label: "Réf", value: room.currentBooking.bookingRef },
                  { label: "Arrivée", value: room.currentBooking.checkIn },
                  { label: "Départ", value: room.currentBooking.checkOut },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between", padding: "5px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid #F1F5F9" : "none",
                  }}>
                    <span style={{ color: "#94A3B8", fontSize: 13 }}>{row.label}</span>
                    <span style={{ color: "#1E293B", fontWeight: 600, fontSize: 13 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {room.notes && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "#FFFBEB", borderRadius: 12, fontSize: 13, color: "#92400E" }}>
              {room.notes}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#FEF2F2", borderRadius: 10, fontSize: 13, color: "#B91C1C" }}>
              {error}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ padding: "12px 20px 20px", borderTop: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 8 }}>
          {room.status === "AVAILABLE" && (
            <ActionBtn primary onClick={() => router.push(`/receptionist/book?roomId=${room.id}`)}>Réserver</ActionBtn>
          )}
          {(room.status === "OCCUPIED" || room.status === "RESERVED") && room.currentBooking && (
            <ActionBtn onClick={() => setShowCheckoutConfirm(true)} disabled={isProcessing}>
              {isProcessing ? "En cours..." : "Libérer"}
            </ActionBtn>
          )}
          {(room.status === "OCCUPIED" || room.status === "RESERVED") && room.currentBooking && (
            <ActionBtn outline onClick={handleShowVoucher} disabled={isProcessing}>
              Reçu
            </ActionBtn>
          )}
          {(room.status === "OCCUPIED" || room.status === "RESERVED") && room.currentBooking && (
            <ActionBtn ghost onClick={() => { setCancelReason(""); setCancelText(""); setShowCancelConfirm(true); }}>
              Annuler
            </ActionBtn>
          )}
        </div>
      </div>

      {showCheckoutConfirm && <ConfirmDialog
        title={`Libérer la chambre ${room.roomNumber} ?`}
        subtitle={`Client: ${room.currentBooking?.guestName}`}
        note="La chambre sera directement marquée disponible."
        error={error}
        loading={isProcessing}
        onConfirm={handleCheckout}
        onCancel={() => setShowCheckoutConfirm(false)}
        confirmLabel={isProcessing ? "Traitement..." : "Confirmer"}
      />}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 32px 64px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>Annuler la réservation</h3>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>Chambre {room.roomNumber} &middot; {room.currentBooking?.guestName}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Motif</label>
                <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 15, border: "2px solid #E2E8F0",
                    borderRadius: 10, color: "#1E293B", outline: "none", background: "white",
                  }}>
                  <option value="">Choisir un motif</option>
                  <option value="Guest request">Demande du client</option>
                  <option value="No-show">Absent</option>
                  <option value="Double booking">Double réservation</option>
                  <option value="Maintenance">Problème technique</option>
                  <option value="Other">Autre</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Détails</label>
                <textarea value={cancelText} onChange={(e) => setCancelText(e.target.value)} rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 15, border: "2px solid #E2E8F0",
                    borderRadius: 10, color: "#1E293B", outline: "none", resize: "none", fontFamily: "inherit",
                  }} />
              </div>
              {error && <p style={{ fontSize: 13, color: "#EF4444" }}>{error}</p>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                <ActionBtnCancel onClick={() => setShowCancelConfirm(false)} disabled={isProcessing}>Retour</ActionBtnCancel>
                <ActionBtnDestructive onClick={handleCancel} disabled={isProcessing || !cancelReason || !cancelText}>
                  {isProcessing ? "Annulation..." : "Confirmer l'annulation"}
                </ActionBtnDestructive>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVoucher && voucherData && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[60]" onClick={() => { setShowVoucher(false); setVoucherData(null); }} />
          <div className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none">
            <div style={{ background: "white", borderRadius: 16, padding: 24, width: 400, pointerEvents: "auto", maxHeight: "90vh", overflow: "auto", boxShadow: "0 32px 64px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>Reçu</h3>
                <button onClick={() => { setShowVoucher(false); setVoucherData(null); }}
                  style={{ width: 32, height: 32, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={16} color="#64748B" />
                </button>
              </div>
              <div style={{ border: "2px dashed #CBD5E1", borderRadius: 12, padding: 16, fontSize: 13 }}>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  {voucherData.hotel?.logoUrl && (
                    <img src={voucherData.hotel.logoUrl} alt="Logo" style={{ width: 100, height: 100, objectFit: "contain", marginBottom: 4 }} />
                  )}
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#1E293B" }}>{voucherData.hotel?.name || "Le Cheval Blanc"}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8" }}>Reçu de réservation</p>
                </div>
                {[
                  ["Réf. Réservation", voucherData.bookingRef], ["Client", voucherData.guestName],
                  ["Chambre(s)", voucherData.rooms?.map((r: any) => String(r.roomNumber).padStart(2, "0")).join(", ")],
                  ["Arrivée", voucherData.checkIn], ["Départ", voucherData.checkOut],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #F1F5F9" }}>
                    <span style={{ color: "#94A3B8" }}>{String(label)}</span><span style={{ fontWeight: 600, color: "#1E293B" }}>{String(value)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #CBD5E1", marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                    <span style={{ color: "#94A3B8" }}>Sous-total</span>
                    <span>{(Number(voucherData.totalAmount) + Number(voucherData.discountAmount) - (Number(voucherData.childrenCharge) || 0)).toLocaleString()} DA</span>
                  </div>
                  {(Number(voucherData.childrenCharge) || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#d00" }}>
                      <span>Suppl. enfants</span>
                      <span>+{Number(voucherData.childrenCharge).toLocaleString()} DA</span>
                    </div>
                  )}
                  {Number(voucherData.discountAmount) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#d00", marginBottom: 2 }}>
                      <span>Remise{voucherData.discountCode ? ` (${voucherData.discountCode})` : ""}</span>
                      <span>-{Number(voucherData.discountAmount).toLocaleString()} DA</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, borderTop: "1px solid #CBD5E1", paddingTop: 4, marginTop: 4 }}>
                    <span>Total</span>
                    <span>{Number(voucherData.totalAmount).toLocaleString()} DA</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button onClick={() => { setShowVoucher(false); setVoucherData(null); }}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "2px solid #E2E8F0", background: "white", fontSize: 14, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                  Fermer
                </button>
                <button onClick={() => window.print()}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#2563EB", fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer" }}>
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {voucherData && (
        <div className="print-receipt">
          <div style={{ textAlign: "center", marginBottom: "3mm" }}>
            {voucherData.hotel?.logoUrl && (
              <img src={voucherData.hotel.logoUrl} alt="Logo" style={{ width: "14mm", height: "14mm", objectFit: "contain", marginBottom: "0.5mm" }} />
            )}
            <div style={{ fontSize: "14pt", fontWeight: 700 }}>{voucherData.hotel?.name || "Le Cheval Blanc"}</div>
            <div style={{ fontSize: "7pt", color: "#666", marginTop: "0.5mm" }}>Reçu de réservation</div>
          </div>
          <hr />
          <table style={{ width: "100%", fontSize: "8pt", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ color: "#666", width: "22mm", padding: "0.5mm 0" }}>Réf. Réservation</td><td style={{ fontWeight: 600 }}>{voucherData.bookingRef}</td></tr>
              <tr><td style={{ color: "#666", padding: "0.5mm 0" }}>Client</td><td>{voucherData.guestName}</td></tr>
              <tr><td style={{ color: "#666", padding: "0.5mm 0" }}>Chambre(s)</td><td>{voucherData.rooms?.map((r: any) => String(r.roomNumber).padStart(2, "0")).join(", ")}</td></tr>
              <tr><td style={{ color: "#666", padding: "0.5mm 0" }}>Arrivée</td><td>{voucherData.checkIn}</td></tr>
              <tr><td style={{ color: "#666", padding: "0.5mm 0" }}>Départ</td><td>{voucherData.checkOut}</td></tr>
            </tbody>
          </table>
          <hr />
          <table style={{ width: "100%", fontSize: "8pt", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ color: "#666", width: "22mm", padding: "0.5mm 0" }}>Sous-total</td><td style={{ textAlign: "right" }}>{(Number(voucherData.totalAmount) + Number(voucherData.discountAmount) - (Number(voucherData.childrenCharge) || 0)).toLocaleString()} DA</td></tr>
              {(Number(voucherData.childrenCharge) || 0) > 0 && (
                <tr><td style={{ color: "#d00", width: "22mm", padding: "0.5mm 0" }}>Suppl. enfants</td><td style={{ textAlign: "right", color: "#d00" }}>+{Number(voucherData.childrenCharge).toLocaleString()} DA</td></tr>
              )}
              {Number(voucherData.discountAmount) > 0 && (
                <tr><td style={{ color: "#d00", width: "22mm", padding: "0.5mm 0" }}>Remise{voucherData.discountCode ? ` (${voucherData.discountCode})` : ""}</td><td style={{ textAlign: "right", color: "#d00" }}>-{Number(voucherData.discountAmount).toLocaleString()} DA</td></tr>
              )}
              <tr><td style={{ fontWeight: 700, fontSize: "10pt", borderTop: "1px solid #333", paddingTop: "1mm" }}>Total</td><td style={{ fontWeight: 700, fontSize: "10pt", textAlign: "right", borderTop: "1px solid #333", paddingTop: "1mm" }}>{Number(voucherData.totalAmount).toLocaleString()} DA</td></tr>
            </tbody>
          </table>
          <hr />
          <div style={{ textAlign: "center", fontSize: "6.5pt", color: "#999", marginTop: "2mm" }}>
            Ce reçu sert de confirmation de réservation.
          </div>
          <div style={{ textAlign: "center", fontSize: "6.5pt", color: "#999", marginTop: "0.5mm" }}>
            Imprimé le {new Date().toLocaleDateString("fr-FR")}
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({ children, onClick, disabled, primary, destructive, outline, ghost, style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  primary?: boolean; destructive?: boolean; outline?: boolean; ghost?: boolean;
  style?: React.CSSProperties;
}) {
  let bg = "#2563EB", color = "white", bd = "none";
  if (destructive) { bg = "#EF4444"; }
  else if (outline) { bg = "white"; color = "#1E293B"; bd = "2px solid #E2E8F0"; }
  else if (ghost) { bg = "transparent"; color = "#EF4444"; bd = "none"; }

  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: "100%", padding: "14px 20px", fontSize: 16, fontWeight: 700,
        background: bg, color, border: bd, borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1, transition: "all 0.15s", ...style,
      }}
      onMouseEnter={e => { if (!disabled && !ghost && !outline) (e.target as HTMLButtonElement).style.opacity = "0.9"; }}
      onMouseLeave={e => { if (!disabled && !ghost && !outline) (e.target as HTMLButtonElement).style.opacity = "1"; }}>
      {children}
    </button>
  );
}

function ActionBtnCancel({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "10px 24px", borderRadius: 10, border: "2px solid #E2E8F0", background: "white", fontSize: 14, fontWeight: 600, color: "#64748B", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function ActionBtnDestructive({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#EF4444", fontSize: 14, fontWeight: 700, color: "white", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function ConfirmDialog({ title, subtitle, note, error, loading, onConfirm, onCancel, confirmLabel }: {
  title: string; subtitle?: string; note?: string; error?: string | null; loading?: boolean;
  onConfirm: () => void; onCancel: () => void; confirmLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 28, width: 380, boxShadow: "0 32px 64px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", marginBottom: 4 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 14, color: "#64748B" }}>{subtitle}</p>}
        {note && <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>{note}</p>}
        {error && <p style={{ fontSize: 13, color: "#EF4444", marginTop: 8 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <ActionBtnCancel onClick={onCancel} disabled={loading}>Annuler</ActionBtnCancel>
          <ActionBtnDestructive onClick={onConfirm} disabled={loading}>{confirmLabel}</ActionBtnDestructive>
        </div>
      </div>
    </div>
  );
}
