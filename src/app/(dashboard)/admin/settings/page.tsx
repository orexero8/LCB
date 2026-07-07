"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HotelSettings {
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelWhatsApp: string;
  hotelEmail: string;
  logoUrl: string;
  checkInTime: string;
  checkOutTime: string;
  cancellationPolicy: string;
  footerMessage: string;
  currencySymbol: string;
  rc: string;
  nif: string;
  nis: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState<HotelSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setForm(d.settings); });
  }, [router]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  }

  if (!form) return null;

  const fields: { key: keyof HotelSettings; label: string; type?: string; placeholder?: string }[] = [
    { key: "hotelName", label: "Hotel Name" },
    { key: "hotelAddress", label: "Address" },
    { key: "hotelPhone", label: "Phone" },
    { key: "hotelWhatsApp", label: "WhatsApp" },
    { key: "hotelEmail", label: "Email", type: "email" },
    { key: "logoUrl", label: "Logo URL" },
    { key: "checkInTime", label: "Check-in Time", placeholder: "14:00" },
    { key: "checkOutTime", label: "Check-out Time", placeholder: "12:00" },
    { key: "currencySymbol", label: "Currency Symbol", placeholder: "DA" },
    { key: "rc", label: "RC (Registre de Commerce)" },
    { key: "nif", label: "NIF" },
    { key: "nis", label: "NIS" },
    { key: "cancellationPolicy", label: "Cancellation Policy" },
    { key: "footerMessage", label: "Receipt Footer Message" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Hotel Settings</h1>
      <Card>
        <CardHeader><CardTitle>Branding & Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label>{f.label}</Label>
              {f.key === "logoUrl" && form.logoUrl && (
                <img src={form.logoUrl} alt="Logo preview" className="h-12 mb-1 rounded border" style={{ objectFit: "contain" }} />
              )}
              <Input
                type={f.type || "text"}
                value={form[f.key] || ""}
                placeholder={f.placeholder || ""}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
