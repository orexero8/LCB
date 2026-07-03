"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const REPORT_TYPES = [
  { value: "bookings", label: "Booking Report", desc: "List of all bookings with guest details, room, dates, and payment" },
  { value: "revenue", label: "Revenue Report", desc: "Daily revenue breakdown by payment method (Cash, TPE, Partner)" },
  { value: "occupancy", label: "Occupancy Report", desc: "Room occupancy rates and utilization statistics" },
  { value: "expenses", label: "Expense Report", desc: "All expenses across shifts, categorized" },
  { value: "staff", label: "Staff Performance", desc: "Receptionist booking counts, revenue, and shift stats" },
  { value: "summary", label: "Monthly Summary", desc: "Overall metrics: revenue, occupancy, expenses, net" },
  { value: "cashup", label: "Daily Cash-up", desc: "Shift-by-shift cash reconciliation with differences" },
  { value: "commission", label: "Partner Commission", desc: "Partner revenue and commission payable" },
  { value: "cancellation", label: "Cancellation Report", desc: "All cancellations with reasons and totals" },
];

export default function ReportsPage() {
  const [type, setType] = useState("bookings");
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports?type=${type}&from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load report data");
      const data = await res.json();
      setPreview(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: string) {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/reports?type=${type}&from=${from}&to=${to}&format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to generate ${format.toUpperCase()}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${from}-to-${to}.${format === "pdf" ? "pdf" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Reports &amp; Exports</h1>
      <p className="text-gray-500 mb-6">Generate and export hotel reports as PDF</p>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-4 lg:col-span-1 space-y-4">
          <h3 className="font-semibold">Report Settings</h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Report Type</Label>
              <div className="space-y-1.5">
                {REPORT_TYPES.map((rt) => (
                  <button key={rt.value} onClick={() => { setType(rt.value); setPreview(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      type === rt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="font-medium">{rt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{rt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-400">From</span>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-0.5" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">To</span>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-0.5" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handlePreview} disabled={loading || !from || !to}>
              {loading ? "Loading..." : "Preview"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleExport("csv")} disabled={loading || !from || !to}>
              {loading ? "..." : "CSV"}
            </Button>
            <Button className="flex-1" onClick={() => handleExport("pdf")} disabled={loading || !from || !to}>
              {loading ? "..." : "PDF"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">Report Preview</h3>
          {!preview ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No data to display</p>
              <p className="text-sm mt-1">Select a report type and click Preview</p>
            </div>
          ) : type === "bookings" ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{preview.count || 0} booking(s) &middot; Total: {(preview.total || 0).toLocaleString()} DA</p>
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Ref</th>
                        <th className="pb-2 pr-2">Guest</th>
                        <th className="pb-2 pr-2">Room</th>
                        <th className="pb-2 pr-2">Check-in</th>
                        <th className="pb-2 pr-2">Check-out</th>
                        <th className="pb-2 pr-2 text-right">Amount</th>
                        <th className="pb-2 pr-2">Status</th>
                        <th className="pb-2">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((b: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100 text-sm">
                          <td className="py-1.5 pr-2 font-mono text-xs">{b.bookingRef}</td>
                          <td className="py-1.5 pr-2">{b.guestName}</td>
                          <td className="py-1.5 pr-2">{b.roomNumbers}</td>
                          <td className="py-1.5 pr-2">{b.checkIn}</td>
                          <td className="py-1.5 pr-2">{b.checkOut}</td>
                          <td className="py-1.5 pr-2 text-right font-medium">{b.totalAmount.toLocaleString()} DA</td>
                          <td className="py-1.5 pr-2">{b.status}</td>
                          <td className="py-1.5">{b.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No bookings found for this period</p>
              )}
            </div>
          ) : type === "revenue" ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{preview.data?.length || 0} day(s) of data</p>
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Date</th>
                        <th className="pb-2 pr-2 text-right">Cash</th>
                        <th className="pb-2 pr-2 text-right">TPE</th>
                        <th className="pb-2 pr-2 text-right">Partner</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((d: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2">{d.date}</td>
                          <td className="py-1.5 pr-2 text-right">{d.cash > 0 ? `${d.cash.toLocaleString()} DA` : "-"}</td>
                          <td className="py-1.5 pr-2 text-right">{d.tpe > 0 ? `${d.tpe.toLocaleString()} DA` : "-"}</td>
                          <td className="py-1.5 pr-2 text-right">{d.partner > 0 ? `${d.partner.toLocaleString()} DA` : "-"}</td>
                          <td className="py-1.5 text-right font-medium">{d.total.toLocaleString()} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No revenue data for this period</p>
              )}
            </div>
          ) : type === "expenses" ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.totalExpenses?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">Total Expenses ({preview.count} entries)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-2">By Category</p>
                  {preview.categories?.map((c: any) => (
                    <div key={c.category} className="flex justify-between text-sm">
                      <span>{c.category}</span>
                      <span className="font-medium">{c.amount.toLocaleString()} DA</span>
                    </div>
                  ))}
                </div>
              </div>
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Date</th>
                        <th className="pb-2 pr-2">Category</th>
                        <th className="pb-2 pr-2">Description</th>
                        <th className="pb-2 pr-2">Staff</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((e: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 text-xs">{e.date}</td>
                          <td className="py-1.5 pr-2">{e.category}</td>
                          <td className="py-1.5 pr-2 text-gray-600">{e.description}</td>
                          <td className="py-1.5 pr-2 text-xs">{e.staffName}</td>
                          <td className="py-1.5 text-right font-medium">{e.amount.toLocaleString()} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No expenses for this period</p>
              )}
            </div>
          ) : type === "staff" ? (
            <div>
              {preview.totals && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{preview.totals.bookingsCount}</p>
                    <p className="text-xs text-gray-500">Total Bookings</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{preview.totals.totalRevenue.toLocaleString()} DA</p>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{preview.totals.totalExpenses.toLocaleString()} DA</p>
                    <p className="text-xs text-gray-500">Total Expenses</p>
                  </div>
                </div>
              )}
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Staff</th>
                        <th className="pb-2 pr-2 text-right">Bookings</th>
                        <th className="pb-2 pr-2 text-right">Revenue</th>
                        <th className="pb-2 pr-2 text-right">Cash</th>
                        <th className="pb-2 pr-2 text-right">TPE</th>
                        <th className="pb-2 pr-2 text-right">Expenses</th>
                        <th className="pb-2 text-right">Shifts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 font-medium">{s.name}</td>
                          <td className="py-1.5 pr-2 text-right">{s.bookingsCount}</td>
                          <td className="py-1.5 pr-2 text-right">{s.totalRevenue.toLocaleString()} DA</td>
                          <td className="py-1.5 pr-2 text-right">{s.cashRevenue.toLocaleString()} DA</td>
                          <td className="py-1.5 pr-2 text-right">{s.tpeRevenue.toLocaleString()} DA</td>
                          <td className="py-1.5 pr-2 text-right">{s.totalExpenses.toLocaleString()} DA</td>
                          <td className="py-1.5 text-right">{s.shiftsCompleted}{s.activeShift ? " *" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No staff data for this period</p>
              )}
              {preview.data?.some((s: any) => s.activeShift) && <p className="text-xs text-gray-400 mt-2">* Active shift in progress</p>}
            </div>
          ) : type === "summary" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.revenue?.total?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.expenses?.total?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">Total Expenses</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className={`text-2xl font-bold ${preview.netRevenue >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {preview.netRevenue?.toLocaleString()} DA
                  </p>
                  <p className="text-xs text-gray-500">Net Revenue</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{preview.occupancy?.current}%</p>
                  <p className="text-xs text-gray-500">Occupancy</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{preview.bookings?.count}</p>
                  <p className="text-xs text-gray-500">Bookings</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{preview.cancellations}</p>
                  <p className="text-xs text-gray-500">Cancellations</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{preview.bookings?.totalNights}</p>
                  <p className="text-xs text-gray-500">Room Nights</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold">{preview.bookings?.avgRevenuePerBooking?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">Avg / Booking</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-2">Revenue Breakdown</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Cash</span><span className="font-medium">{preview.revenue?.cash?.toLocaleString()} DA</span></div>
                    <div className="flex justify-between"><span>TPE</span><span className="font-medium">{preview.revenue?.tpe?.toLocaleString()} DA</span></div>
                    <div className="flex justify-between"><span>Partner</span><span className="font-medium">{preview.revenue?.partner?.toLocaleString()} DA</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-2">Expense Categories</p>
                  <div className="space-y-1 text-sm">
                    {preview.expenses?.categories?.map((c: any) => (
                      <div key={c.category} className="flex justify-between">
                        <span>{c.category}</span>
                        <span className="font-medium">{c.amount.toLocaleString()} DA</span>
                      </div>
                    )) || <p className="text-xs text-gray-400">None</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : type === "cashup" ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{preview.count} shift(s)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{preview.totals?.cashCollected?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">Cash Collected</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{preview.totals?.tpeCollected?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">TPE Collected</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{preview.totals?.expenses?.toLocaleString()} DA</p>
                  <p className="text-xs text-gray-500">Expenses</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className={`text-lg font-bold ${(preview.totals?.cashDiff + preview.totals?.tpeDiff + preview.totals?.partnerDiff) === 0 ? "text-green-600" : "text-red-600"}`}>
                    {(preview.totals?.cashDiff + preview.totals?.tpeDiff + preview.totals?.partnerDiff)?.toLocaleString()} DA
                  </p>
                  <p className="text-xs text-gray-500">Total Difference</p>
                </div>
              </div>
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Date</th>
                        <th className="pb-2 pr-2">Staff</th>
                        <th className="pb-2 pr-2 text-right">Cash</th>
                        <th className="pb-2 pr-2 text-right">TPE</th>
                        <th className="pb-2 pr-2 text-right">Diff</th>
                        <th className="pb-2 text-right">Expenses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 text-xs">{s.date}</td>
                          <td className="py-1.5 pr-2">{s.staffName}</td>
                          <td className="py-1.5 pr-2 text-right">{s.cashCollected.toLocaleString()}</td>
                          <td className="py-1.5 pr-2 text-right">{s.tpeCollected.toLocaleString()}</td>
                          <td className={`py-1.5 pr-2 text-right ${s.difference !== 0 ? "text-red-600 font-medium" : ""}`}>
                            {s.difference > 0 ? "+" : ""}{s.difference.toLocaleString()}
                          </td>
                          <td className="py-1.5 text-right">{s.expenses.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No shift data for this period</p>
              )}
            </div>
          ) : type === "commission" ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{preview.data?.length} partner(s) with bookings</p>
              {preview.totals && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{preview.totals.bookingsCount}</p>
                    <p className="text-xs text-gray-500">Total Bookings</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{preview.totals.totalRevenue.toLocaleString()} DA</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{preview.totals.commissionAmount.toLocaleString()} DA</p>
                    <p className="text-xs text-gray-500">Commission Payable</p>
                  </div>
                </div>
              )}
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Partner</th>
                        <th className="pb-2 pr-2">Phone</th>
                        <th className="pb-2 pr-2 text-right">Rate</th>
                        <th className="pb-2 pr-2 text-right">Bookings</th>
                        <th className="pb-2 pr-2 text-right">Revenue</th>
                        <th className="pb-2 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 font-medium">{p.partnerName}</td>
                          <td className="py-1.5 pr-2 text-xs">{p.contactPhone}</td>
                          <td className="py-1.5 pr-2 text-right">{p.commissionRate}%</td>
                          <td className="py-1.5 pr-2 text-right">{p.bookingsCount}</td>
                          <td className="py-1.5 pr-2 text-right">{p.totalRevenue.toLocaleString()} DA</td>
                          <td className="py-1.5 text-right font-medium">{p.commissionAmount.toLocaleString()} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No partner bookings for this period</p>
              )}
            </div>
          ) : type === "cancellation" ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">{preview.count} cancellation(s) &middot; Total lost: {preview.totalLost?.toLocaleString()} DA</p>
              {preview.reasons?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {preview.reasons.map((r: any) => (
                    <div key={r.category} className="bg-red-50 rounded-lg px-3 py-1.5 text-sm">
                      <span className="font-medium">{r.category}</span>: {r.count}
                    </div>
                  ))}
                </div>
              )}
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Date</th>
                        <th className="pb-2 pr-2">Ref</th>
                        <th className="pb-2 pr-2">Reason</th>
                        <th className="pb-2 pr-2">Details</th>
                        <th className="pb-2 pr-2">By</th>
                        <th className="pb-2 pr-2 text-right">Amount</th>
                        <th className="pb-2">Called</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 text-xs">{c.createdAt}</td>
                          <td className="py-1.5 pr-2 font-mono text-xs">{c.bookingRef}</td>
                          <td className="py-1.5 pr-2">{c.reasonCategory}</td>
                          <td className="py-1.5 pr-2 text-gray-600 text-xs max-w-[120px] truncate">{c.reasonText}</td>
                          <td className="py-1.5 pr-2 text-xs">{c.cancelledBy}</td>
                          <td className="py-1.5 pr-2 text-right">{c.totalAmount.toLocaleString()} DA</td>
                          <td className="py-1.5">{c.calledBack ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No cancellations for this period</p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-2">{preview.data?.length || 0} room(s)</p>
              {preview.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500">
                        <th className="pb-2 pr-2">Room</th>
                        <th className="pb-2 pr-2">Floor</th>
                        <th className="pb-2 pr-2">Type</th>
                        <th className="pb-2 pr-2 text-right">Available</th>
                        <th className="pb-2 pr-2 text-right">Occupied</th>
                        <th className="pb-2 text-right">Occupancy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.data.map((r: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-1.5 pr-2 font-medium">{r.roomNumber}</td>
                          <td className="py-1.5 pr-2">{r.floorName}</td>
                          <td className="py-1.5 pr-2">{r.roomType}</td>
                          <td className="py-1.5 pr-2 text-right">{r.totalDays}</td>
                          <td className="py-1.5 pr-2 text-right">{r.occupiedDays}</td>
                          <td className={`py-1.5 text-right font-medium ${r.occupancyPercent > 70 ? "text-green-600" : r.occupancyPercent > 30 ? "text-yellow-600" : "text-red-600"}`}>
                            {r.occupancyPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No occupancy data for this period</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
