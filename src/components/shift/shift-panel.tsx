"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, X } from "lucide-react";

interface ExpenseData {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string;
}

interface ShiftData {
  id: string;
  startedAt: string;
  endedAt: string | null;
  startingCash: number;
  endingCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  cashCollected: number;
  tpeCollected: number;
  partnerCollected: number;
  status: "ACTIVE" | "CLOSED";
  expenses: ExpenseData[];
}

interface LastShiftInfo {
  userName: string;
  endedAt: string;
  endingCash: number;
  expectedCash: number;
  cashDifference: number;
}

export function ShiftPanel({ token, onAction, triggerEndShift, onEndShiftDone, onShiftActive }: {
  token: string;
  onAction: () => void;
  triggerEndShift?: number;
  onEndShiftDone?: () => void;
  onShiftActive?: (active: boolean) => void;
}) {
  const [shift, setShift] = useState<ShiftData | null>(null);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [startingCash, setStartingCash] = useState("");
  const [endingCash, setEndingCash] = useState("");

  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expenseListOpen, setExpenseListOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastShift, setLastShift] = useState<LastShiftInfo | null>(null);

  // Load last closed shift info for reference
  const fetchLastShift = useCallback(async () => {
    try {
      const res = await fetch("/api/shift/last", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setLastShift(d.last); }
    } catch { /* ignore */ }
  }, [token]);

  const fetchShift = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch("/api/shift", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      const data = await res.json();
      setShift(data.shift);
      onShiftActive?.(!!data.shift);
      return data.shift;
    } catch { return null; }
  }, [token, onShiftActive]);

  useEffect(() => {
    if (!token) return;
    fetchShift().then((s) => {
      if (!s) { fetchLastShift(); setShowStart(true); }
    });
    const id = setInterval(fetchShift, 30000);
    return () => clearInterval(id);
  }, [token, fetchShift, fetchLastShift]);

  // External trigger: open end-shift modal
  useEffect(() => {
    if (triggerEndShift && triggerEndShift > 0 && shift) {
      setEndingCash("");
      setError(null);
      setShowEnd(true);
    }
  }, [triggerEndShift, shift]);

  async function handleStartShift() {
    const cash = parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) { setError("Entrez un montant valide"); return; }
    setIsProcessing(true); setError(null);
    try {
      const res = await fetch("/api/shift", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startingCash: cash }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      setShowStart(false); setStartingCash(""); setLastShift(null); fetchShift(); onAction();
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  }

  async function handleEndShift() {
    const cash = parseFloat(endingCash);
    if (isNaN(cash) || cash < 0) { setError("Entrez un montant valide"); return; }
    setIsProcessing(true); setError(null);
    try {
      const res = await fetch("/api/shift/end", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ endingCash: cash }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      localStorage.removeItem("token");
      setShowEnd(false); setEndingCash("");
      window.location.href = "/login";
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  }

  async function handleAddExpense() {
    const amount = parseFloat(expAmount);
    if (isNaN(amount) || amount <= 0) { setError("Le montant doit être > 0"); return; }
    if (!expCategory.trim()) { setError("Catégorie requise"); return; }
    if (!expDescription.trim()) { setError("Description requise"); return; }
    setIsProcessing(true); setError(null);
    try {
      const res = await fetch("/api/shift/expenses", {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ amount, category: expCategory, description: expDescription }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      setShowAddExpense(false); setExpAmount(""); setExpCategory(""); setExpDescription(""); fetchShift();
    } catch (e: any) { setError(e.message); }
    finally { setIsProcessing(false); }
  }

  const totalExpenses = shift?.expenses.reduce((s, e) => s + e.amount, 0) || 0;

  function formatDuration(startedAt: string): string {
    const diff = Date.now() - new Date(startedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        {!shift ? (
          <>
            <span className="text-gray-400">Aucun service</span>
            <Button size="sm" variant="outline" onClick={() => { fetchLastShift(); setShowStart(true); }}>Démarrer</Button>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Service {formatDuration(shift.startedAt)}
            </span>
            <Button size="sm" variant="outline" onClick={() => setShowAddExpense(true)}>+ Dépense</Button>
            <button onClick={() => setExpenseListOpen(!expenseListOpen)} className="text-xs text-gray-500 hover:text-gray-700 underline">
              {shift.expenses.length} dépense(s) &middot; {totalExpenses.toLocaleString()} DA
            </button>
            <Button size="sm" variant="outline" onClick={() => { setEndingCash(""); setShowEnd(true); setError(null); }}>Fin de service</Button>
          </>
        )}
      </div>

      {expenseListOpen && shift && shift.expenses.length > 0 && (
        <div className="mt-2 bg-white border rounded-lg p-2 text-xs max-h-48 overflow-y-auto space-y-1">
          {shift.expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{e.category}</span>
                <span className="text-gray-400 ml-1">{e.description}</span>
              </div>
              <span className="font-medium text-red-600">-{e.amount.toLocaleString()} DA</span>
            </div>
          ))}
        </div>
      )}

      <ModalStart open={showStart} onClose={() => setShowStart(false)}
        startingCash={startingCash} onCashChange={setStartingCash} error={error}
        onStart={handleStartShift} isProcessing={isProcessing}
        lastShift={lastShift}
        onCancel={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
      />

      <ModalEnd open={showEnd} force={triggerEndShift ? triggerEndShift > 0 : false}
        shift={shift} totalExpenses={totalExpenses} endingCash={endingCash}
        onCashChange={setEndingCash} error={error} onEnd={handleEndShift}
        isProcessing={isProcessing}
        onCancel={() => { setShowEnd(false); if (onEndShiftDone) onEndShiftDone(); }}
      />

      <ModalAddExpense open={showAddExpense} onClose={() => setShowAddExpense(false)}
        expAmount={expAmount} onAmountChange={setExpAmount}
        expCategory={expCategory} onCategoryChange={setExpCategory}
        expDescription={expDescription} onDescriptionChange={setExpDescription}
        error={error} onAdd={handleAddExpense} isProcessing={isProcessing}
        onCancel={() => setShowAddExpense(false)}
      />
    </>
  );
}

function ModalStart({ open, onClose, title, startingCash, onCashChange, error, onStart, isProcessing, onCancel, lastShift }: {
  open: boolean; onClose: () => void; title?: string; startingCash: string; onCashChange: (v: string) => void;
  error: string | null; onStart: () => void; isProcessing: boolean; onCancel: () => void;
  lastShift: LastShiftInfo | null;
}) {
  if (!open) return null;

  const diff = lastShift ? lastShift.expectedCash - lastShift.endingCash : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 32px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={22} color="#22C55E" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1E293B" }}>{title || "Démarrer le service"}</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Montant en caisse au début du service</div>
          </div>
        </div>

        {lastShift && (
          <div style={{
            background: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 20,
            border: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 10 }}>
              Service précédent ({lastShift.userName})
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#64748B" }}>Solde théorique</span>
              <span style={{ fontWeight: 600 }}>{lastShift.expectedCash.toLocaleString()} DA</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#64748B" }}>Caisse finale</span>
              <span style={{ fontWeight: 600 }}>{lastShift.endingCash.toLocaleString()} DA</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#64748B" }}>Écart</span>
              <span style={{ fontWeight: 700, color: diff === 0 ? "#22C55E" : diff > 0 ? "#EF4444" : "#EAB308" }}>
                {diff >= 0 ? "+" : ""}{diff.toLocaleString()} DA
              </span>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <Label style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Fond de caisse (DA)</Label>
          <Input type="number" min={0} value={startingCash} onChange={(e) => onCashChange(e.target.value)} autoFocus
            className="h-12 text-lg font-semibold" />
        </div>

        {error && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12 }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} disabled={isProcessing}
            style={{ padding: "10px 24px", borderRadius: 10, border: "2px solid #E2E8F0", background: "white", fontSize: 14, fontWeight: 600, color: "#64748B", cursor: isProcessing ? "not-allowed" : "pointer" }}>
            Annuler
          </button>
          <button onClick={onStart} disabled={isProcessing || !startingCash}
            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#22C55E", fontSize: 14, fontWeight: 700, color: "white", cursor: isProcessing || !startingCash ? "not-allowed" : "pointer", opacity: isProcessing || !startingCash ? 0.5 : 1 }}>
            {isProcessing ? "Démarrage..." : "Démarrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEnd({ open, force, shift, totalExpenses, endingCash, onCashChange, error, onEnd, isProcessing, onCancel }: {
  open: boolean; force: boolean;
  shift: ShiftData | null; totalExpenses: number;
  endingCash: string; onCashChange: (v: string) => void; error: string | null;
  onEnd: () => void; isProcessing: boolean; onCancel: () => void;
}) {
  if (!open) return null;

  const totalEncaissements = shift ? shift.cashCollected + shift.tpeCollected + shift.partnerCollected : 0;
  const soldeTheorique = shift ? shift.startingCash + totalEncaissements - totalExpenses : 0;

  const rows = [
    { label: "Début du service", value: shift ? new Date(shift.startedAt).toLocaleString() : "--", highlight: false },
    { label: "Fond de caisse initial", value: shift ? `${shift.startingCash.toLocaleString()} DA` : "--", highlight: false },
    { label: "Total encaissements", value: `${totalEncaissements.toLocaleString()} DA`, highlight: true, color: "#22C55E" },
    { label: "Total dépenses", value: `${totalExpenses.toLocaleString()} DA`, highlight: true, color: "#EF4444" },
    { label: "Solde théorique", value: `${soldeTheorique.toLocaleString()} DA`, highlight: false },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget && !force) onCancel(); }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: 440, boxShadow: "0 32px 64px rgba(0,0,0,0.28)", maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={24} color="#F97316" />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1E293B" }}>Fin de Service</div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Clôture obligatoire pour se déconnecter</div>
            </div>
          </div>
          {!force && (
            <button onClick={onCancel}
              style={{ width: 36, height: 36, borderRadius: 10, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={18} color="#64748B" />
            </button>
          )}
        </div>

        {/* Info rows */}
        <div style={{ background: "#F8FAFC", borderRadius: 12, overflow: "hidden", marginBottom: 20, border: "1px solid #E2E8F0" }}>
          {rows.map(({ label, value, highlight, color }, i) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 18px",
              borderBottom: i < rows.length - 1 ? "1px solid #E2E8F0" : "none",
              background: i === rows.length - 1 ? "#F1F5F9" : "transparent",
            }}>
              <span style={{ color: "#64748B", fontSize: 14 }}>{label}</span>
              <span style={{ color: highlight && color ? color : "#1E293B", fontWeight: highlight ? 700 : 600, fontSize: 15 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Final cash input */}
        <div style={{ marginBottom: 20 }}>
          <Label style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>
            Caisse finale (DA) *
          </Label>
          <Input type="number" min={0} value={endingCash} onChange={(e) => onCashChange(e.target.value)} autoFocus
            className="h-14 text-2xl font-bold"
            style={{ border: "2px solid #E2E8F0", borderRadius: 12 }}
            onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
            onBlur={(e) => e.target.style.borderColor = "#E2E8F0"}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: "#EF4444", marginBottom: 12 }}>{error}</p>}

        {/* Action button */}
        <button onClick={onEnd} disabled={isProcessing || !endingCash}
          style={{
            width: "100%", padding: "16px", background: isProcessing || !endingCash ? "#F87171" : "#EF4444",
            color: "white", fontSize: 17, fontWeight: 700, borderRadius: 12, border: "none",
            cursor: isProcessing || !endingCash ? "not-allowed" : "pointer", transition: "background 0.15s",
          }}>
          {isProcessing ? "Fermeture..." : "Clôturer le Service"}
        </button>
      </div>
    </div>
  );
}

function ModalAddExpense({ open, onClose, expAmount, onAmountChange, expCategory, onCategoryChange, expDescription, onDescriptionChange, error, onAdd, isProcessing, onCancel }: {
  open: boolean; onClose: () => void; expAmount: string; onAmountChange: (v: string) => void;
  expCategory: string; onCategoryChange: (v: string) => void; expDescription: string; onDescriptionChange: (v: string) => void;
  error: string | null; onAdd: () => void; isProcessing: boolean; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 32px 64px rgba(0,0,0,0.2)" }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1E293B", marginBottom: 20 }}>Ajouter une dépense</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Montant (DA)</Label>
            <Input type="number" min={0} step="0.01" value={expAmount} onChange={(e) => onAmountChange(e.target.value)} autoFocus
              className="h-11 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Catégorie</Label>
            <select value={expCategory} onChange={(e) => onCategoryChange(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="">Choisir une catégorie</option>
              <option value="Supplies">Fournitures</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Refund">Remboursement</option>
              <option value="Transport">Transport</option>
              <option value="Other">Autre</option>
            </select>
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#1E293B", marginBottom: 6 }}>Description</Label>
            <Input value={expDescription} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="À quoi ça sert ?"
              className="h-11 text-base" />
          </div>
          {error && <p style={{ fontSize: 13, color: "#EF4444" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onCancel} disabled={isProcessing}
              style={{ padding: "10px 24px", borderRadius: 10, border: "2px solid #E2E8F0", background: "white", fontSize: 14, fontWeight: 600, color: "#64748B", cursor: isProcessing ? "not-allowed" : "pointer" }}>
              Annuler
            </button>
            <button onClick={onAdd} disabled={isProcessing || !expAmount || !expCategory || !expDescription}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#2563EB", fontSize: 14, fontWeight: 700, color: "white", cursor: isProcessing || !expAmount || !expCategory || !expDescription ? "not-allowed" : "pointer", opacity: isProcessing || !expAmount || !expCategory || !expDescription ? 0.5 : 1 }}>
              {isProcessing ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
