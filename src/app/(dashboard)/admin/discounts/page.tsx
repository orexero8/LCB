"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Discount {
  id: string;
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  minAmount: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function futureDateStr(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [value, setValue] = useState("");
  const [minAmount, setMinAmount] = useState("0");
  const [validFrom, setValidFrom] = useState(todayStr());
  const [validUntil, setValidUntil] = useState(futureDateStr(30));
  const [maxUses, setMaxUses] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function token() { return localStorage.getItem("token"); }

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetchDiscounts();
  }, [router]);

  async function fetchDiscounts() {
    setLoading(true);
    const res = await fetch("/api/discounts", { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) { const d = await res.json(); setDiscounts(d.discounts); }
    setLoading(false);
  }

  function resetForm() {
    setCode(""); setType("FIXED"); setValue(""); setMinAmount("0");
    setValidFrom(todayStr()); setValidUntil(futureDateStr(30));
    setMaxUses("0"); setIsActive(true); setEditing(null); setShowForm(false);
  }

  function edit(d: Discount) {
    setEditing(d);
    setCode(d.code); setType(d.type); setValue(String(d.value));
    setMinAmount(String(d.minAmount));
    setValidFrom(d.validFrom.split("T")[0]); setValidUntil(d.validUntil.split("T")[0]);
    setMaxUses(String(d.maxUses)); setIsActive(d.isActive);
    setShowForm(true);
  }

  async function handleSave() {
    if (!code.trim() || !value) return;
    setSaving(true);
    const body = {
      code: code.trim(), type, value: parseFloat(value),
      minAmount: parseFloat(minAmount) || 0,
      validFrom, validUntil,
      maxUses: parseInt(maxUses) || 0, isActive,
    };
    const url = editing ? `/api/discounts/${editing.id}` : "/api/discounts";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.error || "Failed to save"); return; }
    toast.success(editing ? "Discount updated" : "Discount created");
    resetForm();
    fetchDiscounts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount code?")) return;
    const res = await fetch(`/api/discounts/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) toast.success("Discount deleted");
    fetchDiscounts();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discount Codes</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>+ Add Discount</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editing ? "Edit Discount" : "New Discount"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Code</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER20" /></div>
              <div className="space-y-1"><Label>Type</Label>
                <select value={type} onChange={(e) => setType(e.target.value as "FIXED" | "PERCENTAGE")}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm">
                  <option value="FIXED">Fixed Amount (DA)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>
              <div className="space-y-1"><Label>Value</Label><Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENTAGE" ? "e.g. 20" : "e.g. 5000"} /></div>
              <div className="space-y-1"><Label>Min Amount (DA)</Label><Input type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(e.target.value)} /></div>
              <div className="space-y-1"><Label>Valid From</Label><Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} /></div>
              <div className="space-y-1"><Label>Valid Until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
              <div className="space-y-1"><Label>Max Uses (0 = unlimited)</Label><Input type="number" min={0} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></div>
              <div className="space-y-1 flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !code.trim() || !value}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : discounts.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No discount codes yet</p> : null}
        {discounts.map((d) => {
          const expired = new Date(d.validUntil) < new Date();
          return (
            <div key={d.id} className={`bg-white rounded-lg border p-4 flex items-center justify-between ${expired ? "opacity-60" : ""}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{d.code}</span>
                  {!d.isActive && <span className="text-xs text-gray-400 border px-1.5 py-0.5 rounded">Inactive</span>}
                  {expired && <span className="text-xs text-red-400 border border-red-200 px-1.5 py-0.5 rounded">Expired</span>}
                </div>
                <p className="text-sm text-gray-600">
                  {d.type === "PERCENTAGE" ? `${d.value}% off` : `${d.value.toLocaleString()} DA off`}
                  {Number(d.minAmount) > 0 && ` (min ${Number(d.minAmount).toLocaleString()} DA)`}
                </p>
                <p className="text-xs text-gray-400">
                  Valid: {d.validFrom.split("T")[0]} to {d.validUntil.split("T")[0]}
                  {d.maxUses > 0 && ` · Used ${d.usedCount}/${d.maxUses}`}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => edit(d)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(d.id)}>Delete</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
