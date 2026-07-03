"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = ["", "ACTIVE", "CHECKED_OUT", "CANCELLED"];

export default function BookingsSearchPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function token() { return localStorage.getItem("token"); }

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetchBookings();
  }, [page]);

  async function fetchBookings() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));
    params.set("limit", "20");

    const res = await fetch(`/api/bookings?${params}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) {
      const d = await res.json();
      setData(d.bookings);
      setTotal(d.total);
      setPages(d.pages);
    }
    setLoading(false);
  }

  function handleSearch() {
    setPage(1);
    fetchBookings();
  }

  function badgeColor(status: string) {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "CHECKED_OUT": return "bg-blue-100 text-blue-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Bookings</h1>
      <p className="text-gray-500 mb-6">Search and filter bookings</p>

      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Search</Label>
            <Input placeholder="Name, ref, phone..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none">
              <option value="">All</option>
              {STATUS_OPTIONS.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-gray-500">{total} booking(s)</p>
          <Button onClick={handleSearch} disabled={loading}>{loading ? "..." : "Search"}</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-center py-12 text-gray-400">No bookings found</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500 bg-gray-50">
                  <th className="p-3 pr-2">Ref</th>
                  <th className="p-3 pr-2">Guest</th>
                  <th className="p-3 pr-2">Room</th>
                  <th className="p-3 pr-2">Check-in</th>
                  <th className="p-3 pr-2">Check-out</th>
                  <th className="p-3 pr-2 text-right">Amount</th>
                  <th className="p-3 pr-2">Status</th>
                  <th className="p-3 pr-2">Payment</th>
                  <th className="p-3">Receptionist</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 pr-2 font-mono text-xs">{b.bookingRef}</td>
                    <td className="p-3 pr-2">
                      <p className="font-medium">{b.guestName}</p>
                      {b.guestPhone && <p className="text-xs text-gray-400">{b.guestPhone}</p>}
                    </td>
                    <td className="p-3 pr-2">{b.roomNumbers}</td>
                    <td className="p-3 pr-2 text-xs">{b.checkIn}</td>
                    <td className="p-3 pr-2 text-xs">{b.checkOut}</td>
                    <td className="p-3 pr-2 text-right font-medium">{b.totalAmount.toLocaleString()} DA</td>
                    <td className="p-3 pr-2">
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded ${badgeColor(b.status)}`}>
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-3 pr-2 text-xs">{b.paymentMethod}</td>
                    <td className="p-3 text-xs text-gray-500">{b.receptionist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
