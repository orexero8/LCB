"use client";

import { useEffect, useState, useRef } from "react";
import { Wallet, CreditCard, Handshake, TrendingUp, Landmark } from "lucide-react";

interface ShiftSoldeData {
  startingCash: number;
  cashCollected: number;
  tpeCollected: number;
  partnerCollected: number;
  expensesTotal: number;
  expectedCash: number;
}

export function SoldeCaisse({ token, refreshKey = 0 }: { token: string; refreshKey?: number }) {
  const [data, setData] = useState<ShiftSoldeData | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSolde = async () => {
    try {
      const res = await fetch("/api/shift", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setData(null); return; }
      const json = await res.json();
      if (!json.shift) { setData(null); return; }
      const s = json.shift;
      const expTotal = s.expenses?.reduce((a: number, e: any) => a + e.amount, 0) || 0;
      setData({
        startingCash: s.startingCash,
        cashCollected: s.cashCollected,
        tpeCollected: s.tpeCollected,
        partnerCollected: s.partnerCollected,
        expensesTotal: expTotal,
        expectedCash: s.startingCash + s.cashCollected - expTotal,
      });
    } catch { setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSolde();
    intervalRef.current = setInterval(fetchSolde, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [token, refreshKey]);

  if (loading) {
    return (
      <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "10px 16px", border: "1px solid #E2E8F0", fontSize: 13, color: "#94A3B8" }}>
        Chargement...
      </div>
    );
  }

  if (!data) return null;

  const totalCollected = data.cashCollected + data.tpeCollected + data.partnerCollected;

  return (
    <div style={{
      background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
      borderRadius: 12,
      padding: "12px 16px",
      border: "1px solid #E2E8F0",
      fontSize: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <Wallet size={16} color="#F59E0B" />
        <span style={{ fontWeight: 700, color: "#1E293B", fontSize: 14 }}>Solde de caisse</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Row icon={Landmark} label="Fond de caisse" value={`${data.startingCash.toFixed(2)} DA`} />
        <Row icon={Wallet} label="Espèces" value={`${data.cashCollected.toFixed(2)} DA`} color="#22C55E" />
        <Row icon={CreditCard} label="TPE/CB" value={`${data.tpeCollected.toFixed(2)} DA`} color="#3B82F6" />
        <Row icon={Handshake} label="Partenaire" value={`${data.partnerCollected.toFixed(2)} DA`} color="#8B5CF6" />
        <Row icon={TrendingUp} label="Total perçu" value={`${totalCollected.toFixed(2)} DA`} bold />
        {data.expensesTotal > 0 && (
          <Row icon={TrendingUp} label="Dépenses" value={`-${data.expensesTotal.toFixed(2)} DA`} color="#EF4444" />
        )}
      </div>
      <div style={{
        marginTop: 8, paddingTop: 8, borderTop: "1px solid #E2E8F0",
        display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 14, color: "#1E293B",
      }}>
        <span>Solde théorique</span>
        <span>{data.expectedCash.toFixed(2)} DA</span>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, color, bold }: {
  icon: any; label: string; value: string; color?: string; bold?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B" }}>
        <Icon size={13} color={color || "#64748B"} />
        {label}
      </span>
      <span style={{ fontWeight: bold ? 700 : 600, color: "#1E293B" }}>{value}</span>
    </div>
  );
}
