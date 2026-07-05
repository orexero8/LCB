"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { RotateCcw, X, AlertTriangle } from "lucide-react";

interface AlertData {
  pendingCheckouts: { id: string; roomNumber: number; checkedOutAt: string; bookingRef: string }[];
  cancellations: { id: string; bookingRef: string; reasonCategory: string; reasonText: string; cancelledBy: string; calledBack: boolean; createdAt: string }[];
  stats: { totalRooms: number; statusCounts: Record<string, number> };
  recentBookingsCount: number;
  recentCancellationsCount: number;
}

interface KpiData {
  today: { revenue: number; cashRevenue: number; tpeRevenue: number; partnerRevenue: number; checkIns: number; checkOuts: number };
  weekRevenue: number;
  monthRevenue: number;
  occupancy: { rate: number; occupied: number; reserved: number; total: number };
  chart: { date: string; revenue: number }[];
}

const STATUS_BADGES: Record<string, string> = {
  AVAILABLE: "default",
  OCCUPIED: "destructive",
  RESERVED: "secondary",
  BLOCKED: "outline",
  MAINTENANCE: "default",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  BLOCKED: "Blocked",
  MAINTENANCE: "Maintenance",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [data, setData] = useState<AlertData | null>(null);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (meRes) => {
        if (!meRes.ok) throw new Error("Unauthorized");
        const meData = await meRes.json();
        if (meData.user.role !== "ADMIN") { router.push("/login"); return; }
        setUser(meData.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      });

    fetch("/api/admin/alerts", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((d) => setData(d));

    fetch("/api/admin/kpis", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((d) => setKpis(d));
  }, [router]);

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}</h1>
      <p className="text-gray-500 mb-6">Admin Dashboard</p>

      {!kpis ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Today Revenue</p>
              <p className="text-2xl font-bold mt-1">{kpis.today.revenue.toLocaleString()} DA</p>
              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                <span>Cash: {kpis.today.cashRevenue.toLocaleString()}</span>
                <span>TPE: {kpis.today.tpeRevenue.toLocaleString()}</span>
                <span>Partner: {kpis.today.partnerRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Occupancy</p>
              <p className="text-2xl font-bold mt-1">{kpis.occupancy.rate}%</p>
              <p className="text-xs text-gray-400 mt-1">{kpis.occupancy.occupied + kpis.occupancy.reserved} / {kpis.occupancy.total} rooms</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Check-ins Today</p>
              <p className="text-2xl font-bold mt-1">{kpis.today.checkIns}</p>
              <p className="text-xs text-gray-400 mt-1">Check-outs: {kpis.today.checkOuts}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Revenue (7d / 30d)</p>
              <p className="text-2xl font-bold mt-1">{kpis.weekRevenue.toLocaleString()} DA</p>
              <p className="text-xs text-gray-400 mt-1">30d: {kpis.monthRevenue.toLocaleString()} DA</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kpis.chart.map((c) => ({ ...c, label: c.date.slice(5) }))}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} DA`} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-3 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-1" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {Object.entries(data.stats.statusCounts).map(([status, count]) => (
              <div key={status} className="bg-white rounded-lg border p-3 text-center">
                <div className="text-2xl font-bold">{count as number}</div>
                <div className="text-sm text-gray-500">{STATUS_LABELS[status] || status.replace(/_/g, " ")}</div>
              </div>
            ))}
            <div className="bg-white rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{data.stats.totalRooms}</div>
              <div className="text-sm text-gray-500">Total Rooms</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                Recent Cancellations
                {data.cancellations.length > 0 && (
                  <Badge variant="secondary">{data.cancellations.length}</Badge>
                )}
              </h3>
              {data.cancellations.length === 0 ? (
                <p className="text-sm text-gray-400">No recent cancellations</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {data.cancellations.map((c) => (
                    <div key={c.id} className="text-sm bg-red-50 rounded px-2.5 py-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{c.bookingRef}</span>
                        <span className="text-xs text-gray-500">{c.reasonCategory}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.reasonText}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span>by {c.cancelledBy}</span>
                        {c.calledBack && <Badge variant="outline" className="text-[10px] px-1 py-0">Called back</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reset section — always visible */}
      <div style={{ background: "#FEF2F2", border: "2px solid #FECACA", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <AlertTriangle size={18} color="#DC2626" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#991B1B", margin: 0 }}>Réinitialisation du système</h3>
        </div>
        <p style={{ fontSize: 13, color: "#B91C1C", marginBottom: 12 }}>
          Remet toutes les chambres à "Libre", ferme les caisses actives, et supprime les pré-réservations. Action irréversible.
        </p>
        <button onClick={() => setShowResetConfirm(true)} disabled={resetting}
          style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#DC2626", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <RotateCcw size={16} /> {resetting ? "Réinitialisation..." : "Réinitialiser"}
        </button>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: 400, boxShadow: "0 32px 64px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#991B1B", marginBottom: 8 }}>Confirmer la réinitialisation</h3>
            <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>
              Toutes les chambres seront marquées disponibles. Les caisses actives seront fermées avec un solde à zéro. Les pré-réservations seront supprimées.
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginBottom: 16 }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowResetConfirm(false)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "2px solid #E2E8F0", background: "white", fontSize: 14, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
                Annuler
              </button>
              <button onClick={async () => {
                setResetting(true);
                try {
                  const token = localStorage.getItem("token");
                  const res = await fetch("/api/admin/reset", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                  if (!res.ok) throw new Error("Erreur");
                  toast.success("Système réinitialisé");
                  setShowResetConfirm(false);
                  window.location.reload();
                } catch { toast.error("Erreur"); }
                finally { setResetting(false); }
              }} disabled={resetting}
                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#DC2626", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <RotateCcw size={16} /> {resetting ? "..." : "Confirmer la réinitialisation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/bookings" className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-1">Bookings</h3>
          <p className="text-sm text-gray-500">Search and filter all bookings</p>
        </Link>
        <Link href="/admin/clients" className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-1">Clients</h3>
          <p className="text-sm text-gray-500">View client profiles and booking history</p>
        </Link>
        <Link href="/admin/floors" className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-1">Floors</h3>
          <p className="text-sm text-gray-500">Add, rename, reorder, and deactivate floors</p>
        </Link>
        <Link href="/admin/rooms" className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-lg mb-1">Rooms</h3>
          <p className="text-sm text-gray-500">Manage individual rooms, prices, and statuses</p>
        </Link>
      </div>
    </div>
  );
}
