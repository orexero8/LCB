"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Client {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  idDocument: string;
  wilaya: string;
  gender: string;
  createdAt: string;
  bookingCount: number;
  totalSpent: number;
  lastBooking: string | null;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  function token() { return localStorage.getItem("token"); }

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetchClients();
  }, [router]);

  async function fetchClients(q?: string) {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : "";
    const res = await fetch(`/api/clients${params}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) setClients((await res.json()).clients);
    setLoading(false);
  }

  async function loadHistory(clientId: string) {
    setHistoryLoading(true);
    const res = await fetch(`/api/clients/${clientId}/bookings`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) setHistory((await res.json()).bookings);
    setHistoryLoading(false);
  }

  function selectClient(c: Client) {
    setSelected(c);
    loadHistory(c.id);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Clients</h1>
      <p className="text-gray-500 mb-6">View client profiles and booking history</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Input placeholder="Search by name, phone, or ID..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchClients(search)} />
          <Button onClick={() => fetchClients(search)} disabled={loading} className="w-full">
            {loading ? "Searching..." : "Search"}
          </Button>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : clients.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{search ? "No matching clients" : "Search for clients above"}</p>
            ) : (
              clients.map((c) => (
                <button key={c.id} onClick={() => selectClient(c)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${selected?.id === c.id ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"}`}>
                  <p className="font-medium text-sm">{c.nom + " " + c.prenom}</p>
                  <p className="text-xs text-gray-500">{c.phone} &middot; {c.wilaya}</p>
                  <p className="text-xs text-gray-400">{c.bookingCount} booking(s) &middot; {c.totalSpent.toLocaleString()} DA</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Select a client</p>
              <p className="text-sm mt-1">Search for a client on the left to see their details and booking history</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-4">
                <h3 className="font-semibold mb-3">{selected.nom + " " + selected.prenom}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Phone</span><p>{selected.phone || "--"}</p></div>
                  <div><span className="text-gray-500">ID Document</span><p>{selected.idDocument || "--"}</p></div>
                  <div><span className="text-gray-500">Wilaya</span><p>{selected.wilaya || "--"}</p></div>
                  <div><span className="text-gray-500">Gender</span><p>{selected.gender}</p></div>
                  <div><span className="text-gray-500">Total Bookings</span><p>{selected.bookingCount}</p></div>
                  <div><span className="text-gray-500">Total Spent</span><p className="font-medium">{selected.totalSpent.toLocaleString()} DA</p></div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold mb-3">Booking History</h4>
                {historyLoading ? (
                  <div className="space-y-2">
                    {[1,2,3].map((i) => (
                      <div key={i} className="bg-gray-100 rounded p-3 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No booking history</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-gray-500">
                          <th className="pb-2 pr-2">Ref</th>
                          <th className="pb-2 pr-2">Room</th>
                          <th className="pb-2 pr-2">Check-in</th>
                          <th className="pb-2 pr-2">Check-out</th>
                          <th className="pb-2 pr-2 text-right">Amount</th>
                          <th className="pb-2 pr-2">Status</th>
                          <th className="pb-2">Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((b: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100">
                            <td className="py-1.5 pr-2 font-mono text-xs">{b.bookingRef}</td>
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
