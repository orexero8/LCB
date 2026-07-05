"use client";

import { useEffect, useState, useRef } from "react";
import { Wallet } from "lucide-react";

export function SoldeCaisse({ token, refreshKey = 0 }: { token: string; refreshKey?: number }) {
  const [solde, setSolde] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSolde = async () => {
    try {
      const res = await fetch("/api/shift", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setSolde(null); return; }
      const json = await res.json();
      if (!json.shift) { setSolde(null); return; }
      const s = json.shift;
      const expTotal = s.expenses?.reduce((a: number, e: any) => a + e.amount, 0) || 0;
      setSolde(s.startingCash + s.cashCollected - expTotal);
    } catch { setSolde(null); }
  };

  useEffect(() => {
    fetchSolde();
    intervalRef.current = setInterval(fetchSolde, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [token, refreshKey]);

  if (solde === null) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "#FEF3C7", borderRadius: 8,
      padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#92400E",
      whiteSpace: "nowrap",
    }}>
      <Wallet size={14} color="#D97706" />
      <span>Caisse: <strong>{solde.toFixed(0)} DA</strong></span>
    </div>
  );
}
