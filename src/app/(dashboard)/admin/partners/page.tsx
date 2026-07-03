"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Partner {
  id: string;
  name: string;
  logoUrl: string | null;
  contactPhone: string | null;
  commissionRate: number;
  isActive: boolean;
}

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [saving, setSaving] = useState(false);

  function token() { return localStorage.getItem("token"); }

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetchPartners();
  }, [router]);

  async function fetchPartners() {
    const res = await fetch("/api/partners", { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) { const d = await res.json(); setPartners(d.partners); }
  }

  function resetForm() {
    setName(""); setLogoUrl(""); setContactPhone(""); setCommissionRate("10"); setEditing(null); setShowForm(false);
  }

  function edit(p: Partner) {
    setEditing(p); setName(p.name); setLogoUrl(p.logoUrl || ""); setContactPhone(p.contactPhone || ""); setCommissionRate(String(p.commissionRate)); setShowForm(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const body = { name: name.trim(), logoUrl: logoUrl.trim() || null, contactPhone: contactPhone.trim() || null, commissionRate: parseFloat(commissionRate) || 0 };
    const url = editing ? `/api/partners/${editing.id}` : "/api/partners";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    resetForm();
    fetchPartners();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this partner?")) return;
    await fetch(`/api/partners/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    fetchPartners();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partners</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>+ Add Partner</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editing ? "Edit Partner" : "New Partner"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Logo URL</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." /></div>
            <div className="space-y-1"><Label>Contact Phone</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
            <div className="space-y-1"><Label>Commission Rate (%)</Label><Input type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Saving..." : "Save"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {partners.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No partners yet</p>}
        {partners.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {p.logoUrl && <img src={p.logoUrl} alt="" className="w-8 h-8 rounded object-contain" />}
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.contactPhone || "No phone"} &middot; {p.commissionRate}% commission</p>
              </div>
              {!p.isActive && <span className="text-xs text-gray-400 border px-1.5 py-0.5 rounded">Inactive</span>}
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => edit(p)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(p.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
