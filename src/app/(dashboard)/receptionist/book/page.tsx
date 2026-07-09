"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SoldeCaisse } from "@/components/shift/solde-caisse";
import { Check, ChevronLeft, Minus, Plus, BedSingle, BedDouble, Banknote, CreditCard, Handshake, Wallet, Clock } from "lucide-react";
import { toast } from "sonner";
import { WILAYAS } from "@/lib/wilayas";
import { NATIONALITES } from "@/lib/nationalites";

interface RoomData {
  id: string;
  roomNumber: number;
  bedLayout: string;
  pricePerNight: number;
  status: string;
  floor: { name: string };
  roomType: { name: string };
}

interface ClientData {
  id: string;
  nom: string;
  prenom: string;
  maidenName: string | null;
  dateOfBirth: string | null;
  profession: string | null;
  address: string | null;
  nationality: string | null;
  email: string | null;
  phone: string;
  idDocument: string;
  wilaya: string;
  gender: "MALE" | "FEMALE";
}

interface GuestInfo {
  nom: string;
  prenom: string;
  maidenName?: string;
  dateOfBirth?: string;
  profession?: string;
  address?: string;
  email?: string;
  idDocument: string;
  nationality?: string;
  idDeliveryDate?: string;
  idDeliveryPlace?: string;
  idAuthority?: string;
  phone?: string;
  wilaya?: string;
  gender?: "MALE" | "FEMALE";
}

interface WizardState {
  step: number;
  guestCount: number;
  isMarried: boolean;
  acte: string;
  numChildren: number;
  childrenAges: { nom: string; prenom: string; age: number; dateOfBirth: string; wilaya: string }[];
  checkIn: string;
  checkOut: string;
  availableRooms: RoomData[];
  selectedRoomIds: string[];
  clientQuery: string;
  searchResults: ClientData[];
  selectedClient: ClientData | null;
  clientNom: string;
  clientPrenom: string;
  clientMaidenName: string;
  clientDateOfBirth: string;
  clientProfession: string;
  clientAddress: string;
  clientNationality: string;
  clientEmail: string;
  clientPhone: string;
  clientIdDocument: string;
  clientIdDeliveryDate: string;
  clientIdDeliveryPlace: string;
  clientIdAuthority: string;
  clientWilaya: string;
  clientGender: "MALE" | "FEMALE";
  additionalGuests: GuestInfo[];
  paymentMethod: "CASH" | "TPE" | "PARTNER";
  partnerId: string;
  partners: { id: string; name: string }[];
  discountCode: string;
  discountAmount: string;
  discountValidated: boolean;
  discountError: string;
  manualDiscount: string;
  notes: string;
  isSubmitting: boolean;
  noShift: boolean;
  error: string | null;
}

const STEP_LABELS = ["Dates & Chambres", "Client & Paiement", "Confirmation"];

function parseBedLayout(layout: string): { count: number; mixCount: number } {
  const clean = layout?.toLowerCase() || "";
  const hasPlus = clean.includes("+");
  if (hasPlus) {
    const segments = clean.split("+").map(s => s.trim());
    const grandSegments = segments.filter(s => s.includes("grand"));
    const simpleSegments = segments.filter(s => !s.includes("grand"));
    const grandCount = grandSegments.reduce((sum, s) => { const m = s.match(/(\d+)/); return sum + (m ? parseInt(m[1], 10) : 1); }, 0);
    const simpleCount = simpleSegments.reduce((sum, s) => { const m = s.match(/(\d+)/); return sum + (m ? parseInt(m[1], 10) : 1); }, 0);
    return { count: grandCount + simpleCount, mixCount: grandCount };
  }
  const count = parseInt(clean.match(/^(\d+)/)?.[1] || "1", 10);
  const isDouble = clean.includes("grand");
  return { count, mixCount: isDouble ? count : 0 };
}

function BedIcons({ layout, size = 24, color = "#2563EB" }: { layout: string; size?: number; color?: string }) {
  const { count, mixCount } = parseBedLayout(layout);
  if (count === 0) return null;
  const icons: ("double" | "single")[] = [];
  for (let i = 0; i < mixCount; i++) icons.push("double");
  for (let i = mixCount; i < count; i++) icons.push("single");
  if (icons.length === 1) {
    const Icon = icons[0] === "double" ? BedDouble : BedSingle;
    return <Icon size={size} color={color} strokeWidth={1.8} />;
  }
  return (
    <div style={{ display: "flex", gap: count > 2 ? 2 : 3, alignItems: "center", justifyContent: "center" }}>
      {icons.map((type, i) => {
        const Icon = type === "double" ? BedDouble : BedSingle;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(37,99,235,0.08)", borderRadius: 3, padding: "1px 1px" }}>
            <Icon size={count > 2 ? size - 3 : size} color={color} strokeWidth={1.8} />
          </div>
        );
      })}
    </div>
  );
}

function Counter({ value, onChange, min = 0, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: value <= min ? "#F1F5F9" : "#EFF6FF",
          border: value <= min ? "1px solid #E2E8F0" : "1px solid #BFDBFE",
          cursor: value <= min ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: value <= min ? "#CBD5E1" : "#2563EB",
        }}>
        <Minus size={16} />
      </button>
      <span style={{ fontSize: 22, fontWeight: 800, color: "#1E293B", width: 32, textAlign: "center" }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: value >= max ? "#F1F5F9" : "#EFF6FF",
          border: value >= max ? "1px solid #E2E8F0" : "1px solid #BFDBFE",
          cursor: value >= max ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: value >= max ? "#CBD5E1" : "#2563EB",
        }}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRoomId = searchParams.get("roomId");
  const preReservationId = searchParams.get("preReservationId");
  const prefillNom = searchParams.get("nom");
  const prefillPrenom = searchParams.get("prenom");
  const prefillPhone = searchParams.get("phone");
  const prefillCheckIn = searchParams.get("checkIn");
  const prefillCheckOut = searchParams.get("checkOut");
  const prefillRoomId = searchParams.get("roomId");

  const [token, setToken] = useState<string | null>(null);
  const [s, setS] = useState<WizardState>({
    step: 0,
    guestCount: 1,
    isMarried: false,
    acte: "",
    numChildren: 0,
    childrenAges: [], // { nom, prenom, age, dateOfBirth, wilaya }[]
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: "",
    availableRooms: [],
    selectedRoomIds: preselectedRoomId ? [preselectedRoomId] : [],
    clientQuery: "",
    searchResults: [],
    selectedClient: null,
    clientNom: "",
    clientPrenom: "",
    clientMaidenName: "",
    clientDateOfBirth: "",
    clientProfession: "",
    clientAddress: "",
    clientNationality: "Algérienne",
    clientEmail: "",
    clientPhone: "",
    clientIdDocument: "",
    clientIdDeliveryDate: "",
    clientIdDeliveryPlace: "",
    clientIdAuthority: "",
    clientWilaya: "",
    clientGender: "MALE",
    additionalGuests: [],
    paymentMethod: "CASH",
    partnerId: "",
    partners: [],
    discountCode: "",
    discountAmount: "0",
    discountValidated: false,
    discountError: "",
    manualDiscount: "",
    notes: "",
    isSubmitting: true,
    noShift: false,
    error: null,
  });

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);

    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user.role !== "RECEPTIONIST" && data.user.role !== "ADMIN") {
          router.push("/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      });

    fetch("/api/partners", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) update({ partners: d.partners.map((p: any) => ({ id: p.id, name: p.name })) }); })
      .catch(() => {});

    fetch("/api/shift", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) update({ noShift: !d.shift }); })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => {
      fetch("/api/shift", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) update({ noShift: !d.shift }); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, [token]);

  // Pre-fill form from pre-reservation (data passed via URL params)
  useEffect(() => {
    if (prefillNom && prefillPrenom) {
      update({
        clientNom: prefillNom,
        clientPrenom: prefillPrenom,
        clientPhone: prefillPhone || "",
        ...(prefillCheckIn && { checkIn: prefillCheckIn }),
        ...(prefillCheckOut && { checkOut: prefillCheckOut }),
        ...(prefillRoomId && { selectedRoomIds: [prefillRoomId] }),
      });
    }
  }, []);

  const update = useCallback((partial: Partial<WizardState>) => {
    setS((prev) => ({ ...prev, ...partial }));
  }, []);

  async function checkAvailability() {
    if (!token || !s.checkIn || !s.checkOut) return;
    if (s.checkOut <= s.checkIn) { update({ error: "La date de sortie doit être après la date d'arrivée" }); return; }

    update({ error: null, isSubmitting: true });
    try {
      const params = new URLSearchParams({
        checkIn: s.checkIn,
        checkOut: s.checkOut,
      });
      const res = await fetch(`/api/available-rooms?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { update({ error: data.error || "Erreur", isSubmitting: false }); return; }
      const rooms: RoomData[] = data.rooms || [];

      let selected = s.selectedRoomIds.filter((id) => rooms.some((r) => r.id === id));
      if (preselectedRoomId && !selected.includes(preselectedRoomId) && rooms.some((r) => r.id === preselectedRoomId)) {
        selected = [preselectedRoomId];
      }

      update({ availableRooms: rooms, selectedRoomIds: selected, isSubmitting: false });
    } catch {
      update({ error: "Erreur de connexion", isSubmitting: false });
    }
  }

  const initialMount = useRef(true);

  useEffect(() => {
    if (s.step === 0 && s.checkIn && s.checkOut && s.checkOut > s.checkIn && token) {
      if (initialMount.current) {
        initialMount.current = false;
        checkAvailability();
      } else {
        const timer = setTimeout(() => checkAvailability(), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [s.checkIn, s.checkOut, s.guestCount, s.numChildren, s.childrenAges, s.step, token]);

  function toggleRoom(roomId: string) {
    setS((prev) => ({
      ...prev,
      selectedRoomIds: prev.selectedRoomIds.includes(roomId)
        ? prev.selectedRoomIds.filter((id) => id !== roomId)
        : [...prev.selectedRoomIds, roomId],
    }));
  }

  async function searchClients(q: string) {
    if (!token || q.length < 2) { update({ searchResults: [] }); return; }
    try {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      update({ searchResults: data.clients || [] });
    } catch {
      update({ searchResults: [] });
    }
  }

  function selectClient(client: ClientData) {
    update({
      selectedClient: client,
      clientNom: client.nom,
      clientPrenom: client.prenom,
      clientMaidenName: client.maidenName || "",
      clientDateOfBirth: client.dateOfBirth || "",
      clientProfession: client.profession || "",
      clientAddress: client.address || "",
      clientNationality: client.nationality || "Algérienne",
      clientEmail: client.email || "",
      clientPhone: client.phone,
      clientIdDocument: client.idDocument,
      clientIdDeliveryDate: (client as any).idDeliveryDate || "",
      clientIdDeliveryPlace: (client as any).idDeliveryPlace || "",
      clientIdAuthority: (client as any).idAuthority || "",
      clientWilaya: client.wilaya,
      clientGender: client.gender,
      clientQuery: `${client.nom} ${client.prenom} (${client.phone})`,
      searchResults: [],
    });
  }

  const nights = s.checkIn && s.checkOut
    ? Math.max(0, Math.ceil((new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const selectedRooms = s.availableRooms.filter((r) => s.selectedRoomIds.includes(r.id));
  const totalPerNight = selectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0);
  const totalBeforeDiscount = totalPerNight * nights;
  const promoDiscount = parseFloat(s.discountAmount) || 0;
  const manualDiscount = parseFloat(s.manualDiscount) || 0;
  const discountVal = promoDiscount + manualDiscount;
  const totalAmount = Math.max(0, totalBeforeDiscount - discountVal);

  let validateTimeout: ReturnType<typeof setTimeout> | null = null;

  async function validateDiscount(code: string) {
    if (!code.trim() || !token) { update({ discountValidated: false, discountError: "", discountAmount: "0" }); return; }
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ code, totalAmount: totalBeforeDiscount }),
      });
      const data = await res.json();
      if (data.valid) {
        update({ discountValidated: true, discountError: "", discountAmount: String(data.discount.discountAmount) });
      } else {
        update({ discountValidated: false, discountError: "Code invalide", discountAmount: "0" });
      }
    } catch {
      update({ discountValidated: false, discountError: "Erreur de validation", discountAmount: "0" });
    }
  }

  function handleDiscountCodeChange(code: string) {
    update({ discountCode: code, discountValidated: false, discountError: "", discountAmount: "0" });
    if (validateTimeout) clearTimeout(validateTimeout);
    if (code.trim().length >= 2) {
      validateTimeout = setTimeout(() => validateDiscount(code), 500);
    }
  }

  async function submitBooking() {
    if (!token) return;
    update({ isSubmitting: true, error: null });

    try {
      const body = {
        roomIds: s.selectedRoomIds,
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        client: (s.selectedClient
          ? { id: s.selectedClient.id, nom: s.clientNom, prenom: s.clientPrenom, maidenName: s.clientMaidenName, dateOfBirth: s.clientDateOfBirth, profession: s.clientProfession, address: s.clientAddress, nationality: s.clientNationality, email: s.clientEmail, phone: s.clientPhone, idDocument: s.clientIdDocument, idDeliveryDate: s.clientIdDeliveryDate, idDeliveryPlace: s.clientIdDeliveryPlace, idAuthority: s.clientIdAuthority, wilaya: s.clientWilaya, gender: s.clientGender }
          : { nom: s.clientNom, prenom: s.clientPrenom, maidenName: s.clientMaidenName, dateOfBirth: s.clientDateOfBirth, profession: s.clientProfession, address: s.clientAddress, nationality: s.clientNationality, email: s.clientEmail, phone: s.clientPhone, idDocument: s.clientIdDocument, idDeliveryDate: s.clientIdDeliveryDate, idDeliveryPlace: s.clientIdDeliveryPlace, idAuthority: s.clientIdAuthority, wilaya: s.clientWilaya, gender: s.clientGender }),
        isMarried: s.isMarried,
        acte: s.acte || undefined,
        childrenAges: s.childrenAges.filter((c) => c.age > 0).map((c) => ({ nom: c.nom, prenom: c.prenom, age: c.age, dateOfBirth: c.dateOfBirth, wilaya: c.wilaya })),
        additionalGuests: s.additionalGuests.filter((g) => g.nom.trim() && g.prenom.trim()),
        discountCode: s.discountCode || undefined,
        discountAmount: discountVal,
        notes: s.notes || undefined,
        paymentMethod: s.paymentMethod,
        partnerId: s.paymentMethod === "PARTNER" ? s.partnerId || undefined : undefined,
        preReservationId: preReservationId || undefined,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { update({ error: data.error || "Erreur", isSubmitting: false }); return; }

      router.push("/receptionist/history");
    } catch {
      update({ error: "Erreur lors de la création", isSubmitting: false });
    }
  }

  async function handlePreReservation() {
    if (!token || !s.selectedRoomIds[0] || !s.clientNom || !s.clientPrenom || !s.clientPhone || !s.checkIn || !s.checkOut) return;
    update({ isSubmitting: true, error: null });
    try {
      const res = await fetch("/api/pre-reservations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: s.clientNom,
          prenom: s.clientPrenom,
          phone: s.clientPhone,
          roomId: s.selectedRoomIds[0],
          checkIn: s.checkIn,
          checkOut: s.checkOut,
          notes: s.notes || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur"); }
      toast.success("Pré-réservation créée !");
      router.push("/receptionist");
    } catch (e: any) {
      update({ error: e.message || "Erreur lors de la pré-réservation", isSubmitting: false });
    }
  }

  if (!token) return null;

  const canGoNext = (): boolean => {
    switch (s.step) {
      case 0: return s.selectedRoomIds.length > 0;
      case 1: return s.clientNom.length > 0 && s.clientPrenom.length > 0;
      case 2: return !s.isSubmitting;
      default: return false;
    }
  };

  function renderStep() {
    switch (s.step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  }

  function renderStep0() {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Date picker + Nights */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Arrivée</Label>
            <Input type="date" value={s.checkIn} onChange={(e) => {
              const d = new Date(e.target.value);
              const nights = s.checkOut && s.checkIn ? Math.max(1, Math.ceil((new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime()) / (1000 * 60 * 60 * 24))) : 1;
              d.setDate(d.getDate() + nights);
              update({ checkIn: e.target.value, checkOut: d.toISOString().split("T")[0] });
            }}
              min={new Date().toISOString().split("T")[0]} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Nuits</Label>
            <Counter value={nights || 1} onChange={(n) => {
              if (s.checkIn) {
                const d = new Date(s.checkIn);
                d.setDate(d.getDate() + Math.max(1, n));
                update({ checkOut: d.toISOString().split("T")[0] });
              }
            }} min={1} max={30} />
            {s.checkIn && s.checkOut && (
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                Départ: <strong>{new Date(s.checkOut).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</strong>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Adultes</Label>
            <Counter value={s.guestCount} onChange={(n) => {
              const guests = s.additionalGuests.slice(0, n - 1);
              while (guests.length < n - 1) guests.push({ nom: "", prenom: "", maidenName: "", dateOfBirth: "", profession: "", address: "", email: "", idDocument: "", nationality: "", idDeliveryDate: "", idDeliveryPlace: "", idAuthority: "", phone: "", wilaya: "", gender: "MALE" });
              update({ guestCount: n, additionalGuests: guests });
            }} min={1} max={20} />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Enfants</Label>
            <Counter value={s.numChildren} onChange={(n) => {
              const ages = s.childrenAges.slice(0, n);
              while (ages.length < n) ages.push({ nom: "", prenom: "", age: 0, dateOfBirth: "", wilaya: "" });
              update({ numChildren: n, childrenAges: ages });
            }} max={10} />
          </div>
        </div>

        {s.numChildren > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {Array.from({ length: s.numChildren }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", padding: "8px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ flex: 2, minWidth: 120 }}>
                  <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Nom Enfant {i + 1}</Label>
                  <Input value={s.childrenAges[i]?.nom || ""}
                    onChange={(e) => {
                      const ages = [...s.childrenAges];
                      ages[i] = { ...ages[i], nom: e.target.value };
                      update({ childrenAges: ages });
                    }}
                    className="h-10 text-sm w-full" placeholder="Nom" />
                </div>
                <div style={{ flex: 2, minWidth: 120 }}>
                  <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Prénom Enfant {i + 1}</Label>
                  <Input value={s.childrenAges[i]?.prenom || ""}
                    onChange={(e) => {
                      const ages = [...s.childrenAges];
                      ages[i] = { ...ages[i], prenom: e.target.value };
                      update({ childrenAges: ages });
                    }}
                    className="h-10 text-sm w-full" placeholder="Prénom" />
                </div>
                <div>
                  <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Date de naissance</Label>
                  <Input type="date" value={s.childrenAges[i]?.dateOfBirth || ""}
                    onChange={(e) => {
                      const ages = [...s.childrenAges];
                      ages[i] = { ...ages[i], dateOfBirth: e.target.value };
                      update({ childrenAges: ages });
                    }}
                    className="h-10 text-sm" />
                </div>
                <div>
                  <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Wilaya</Label>
                  <input list={`wilayas-child-${i}`} value={s.childrenAges[i]?.wilaya || ""}
                    onChange={(e) => {
                      const ages = [...s.childrenAges];
                      ages[i] = { ...ages[i], wilaya: e.target.value };
                      update({ childrenAges: ages });
                    }}
                    className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                  <datalist id={`wilayas-child-${i}`}>{WILAYAS.map((w) => <option key={w} value={w} />)}</datalist>
                </div>
                <div>
                  <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Âge</Label>
                  <select value={s.childrenAges[i]?.age || 0}
                    onChange={(e) => {
                      const ages = [...s.childrenAges];
                      ages[i] = { ...ages[i], age: parseInt(e.target.value) || 0 };
                      update({ childrenAges: ages });
                    }}
                    style={{ height: 40, width: 80, borderRadius: 8, border: "1px solid #E2E8F0", padding: "0 8px", fontSize: 13, background: "white" }}>
                    {Array.from({ length: 13 }, (_, a) => <option key={a} value={a}>{a} {a === 0 ? "an" : "ans"}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "12px 16px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
          <input type="checkbox" checked={s.isMarried} onChange={(e) => update({ isMarried: e.target.checked })}
            style={{ width: 18, height: 18, cursor: "pointer" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1E293B", cursor: "pointer" }} onClick={() => update({ isMarried: !s.isMarried })}>Marié(e)</span>
          {s.isMarried && (
            <Input value={s.acte} onChange={(e) => update({ acte: e.target.value })} placeholder="N° Acte de Mariage"
              className="h-9 text-sm ml-auto" style={{ maxWidth: 220 }} />
          )}
        </div>

        <Separator style={{ marginBottom: 16 }} />

        {/* Room grid */}
        {s.isSubmitting ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 14 }}>Recherche des chambres...</div>
        ) : s.availableRooms.length === 0 && s.checkIn && s.checkOut && s.checkOut > s.checkIn ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94A3B8", fontSize: 14 }}>Aucune chambre disponible pour ces dates</div>
        ) : s.availableRooms.length > 0 ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                Chambres disponibles ({s.availableRooms.length})
              </h3>
              {selectedRooms.length > 0 && (
                <span style={{ fontSize: 12, color: "#2563EB", fontWeight: 600 }}>
                  {selectedRooms.length} sélectionnée(s)
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(() => {
                // Rooming List soria.pdf — hallway pairs
                const BOOK_LAYOUTS: Record<string, { top: number[]; bottom?: number[] }> = {
                  "Rez-de-chaussée": { top: [1, 2, 3, 4, 5] },
                  "1er étage": { top: [6, 7, 8, 9, 10], bottom: [15, 14, 13, 12, 11] },
                  "2ème étage": { top: [16, 17, 18, 19, 20], bottom: [25, 24, 23, 22, 21] },
                };
                function byNum(rooms: RoomData[]): Map<number, RoomData> {
                  const m = new Map(); for (const r of rooms) m.set(r.roomNumber, r); return m;
                }
                const floorOrder = ["Rez-de-chaussée", "1er étage", "2ème étage"];
                return floorOrder.map((fName) => {
                  const layout = BOOK_LAYOUTS[fName];
                  const floorRooms = s.availableRooms.filter((r) => r.floor.name === fName);
                  const byNumber = byNum(floorRooms);
                  const topRooms = layout.top.map((n) => byNumber.get(n)).filter(Boolean) as RoomData[];
                  const bottomRooms = layout.bottom?.map((n) => byNumber.get(n)).filter(Boolean) as RoomData[] || [];
                  if (topRooms.length === 0) return null;
                  return (
                    <div key={fName}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {fName} — {floorRooms.length} chambre{floorRooms.length > 1 ? "s" : ""}
                      </div>
                      {/* Top row */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {topRooms.map((room) => { const selected = s.selectedRoomIds.includes(room.id); return (
                          <button key={room.id} onClick={() => toggleRoom(room.id)}
                            style={{
                              borderRadius: 10, border: selected ? "2px solid #2563EB" : "2px solid #E2E8F0",
                              background: selected ? "#EFF6FF" : "white",
                              padding: "10px 6px", cursor: "pointer", textAlign: "center", width: 110,
                              transition: "all 0.15s", boxShadow: selected ? "0 0 0 3px rgba(37,99,235,0.15)" : "none",
                            }}>
                            <div style={{ marginBottom: 2 }}><BedIcons layout={room.bedLayout} size={20} /></div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: selected ? "#2563EB" : "#1E293B" }}>{room.roomNumber}</div>
                            <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{room.bedLayout}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#2563EB" : "#1E293B", marginTop: 2 }}>
                              {room.pricePerNight.toLocaleString()} DA
                            </div>
                          </button>
                        );})}
                      </div>
                      {/* Hallway + bottom row */}
                      {bottomRooms.length > 0 && (
                        <>
                          <div style={{ margin: "4px 0", height: 6, borderRadius: 2, background: "#E2E8F0" }} />
                          <div style={{ display: "flex", gap: 8 }}>
                            {bottomRooms.map((room) => { const selected = s.selectedRoomIds.includes(room.id); return (
                              <button key={room.id} onClick={() => toggleRoom(room.id)}
                                style={{
                                  borderRadius: 10, border: selected ? "2px solid #2563EB" : "2px solid #E2E8F0",
                                  background: selected ? "#EFF6FF" : "white",
                                  padding: "10px 6px", cursor: "pointer", textAlign: "center", width: 110,
                                  transition: "all 0.15s", boxShadow: selected ? "0 0 0 3px rgba(37,99,235,0.15)" : "none",
                                }}>
                                <div style={{ marginBottom: 2 }}><BedIcons layout={room.bedLayout} size={20} /></div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: selected ? "#2563EB" : "#1E293B" }}>{room.roomNumber}</div>
                                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{room.bedLayout}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: selected ? "#2563EB" : "#1E293B", marginTop: 2 }}>
                                  {room.pricePerNight.toLocaleString()} DA
                                </div>
                              </button>
                            );})}
                          </div>
                        </>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </>
        ) : null}

        {s.noShift && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 12, textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}>Aucun service actif. Veuillez démarrer un service depuis le tableau de bord.</p>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28, paddingTop: 20, borderTop: "1px solid #E2E8F0" }}>
          <button onClick={() => update({ step: 1 })} disabled={s.selectedRoomIds.length === 0 || s.availableRooms.length === 0}
            style={{
              padding: "14px 36px", borderRadius: 12, border: "none",
              background: s.selectedRoomIds.length === 0 || s.availableRooms.length === 0 ? "#94A3B8" : "#2563EB",
              color: "white", fontSize: 16, fontWeight: 700, cursor: s.selectedRoomIds.length === 0 || s.availableRooms.length === 0 ? "not-allowed" : "pointer",
            }}>
            Continuer
          </button>
        </div>
      </div>
    );
  }

  function renderStep1() {
    const paymentMethods = [
      { key: "CASH" as const, label: "Espèces", icon: <Banknote size={22} /> },
      { key: "TPE" as const, label: "Carte", icon: <CreditCard size={22} /> },
      { key: "PARTNER" as const, label: "Partenaire", icon: <Handshake size={22} /> },
    ];

    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Client search */}
        <div style={{ marginBottom: 20 }}>
          <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Chercher un client existant</Label>
          <Input placeholder="Nom ou téléphone..." value={s.clientQuery}
            onChange={(e) => { update({ clientQuery: e.target.value }); searchClients(e.target.value); }}
            className="h-12 text-base" />
          {s.searchResults.length > 0 && (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 10, maxHeight: 140, overflow: "auto", marginTop: 4 }}>
              {s.searchResults.map((c) => (
                <button key={c.id} onClick={() => selectClient(c)}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    borderBottom: "1px solid #F1F5F9", cursor: "pointer",
                    background: "white", border: "none", fontSize: 14,
                    display: "flex", justifyContent: "space-between",
                  }}>
                  <span style={{ fontWeight: 500, color: "#1E293B" }}>{c.nom + " " + c.prenom}</span>
                  <span style={{ color: "#94A3B8", fontSize: 12 }}>{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator style={{ marginBottom: 20 }} />

        {/* Client form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Nom *</Label>
            <Input value={s.clientNom} onChange={(e) => update({ clientNom: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Prénom *</Label>
            <Input value={s.clientPrenom} onChange={(e) => update({ clientPrenom: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Nom de jeune fille</Label>
            <Input value={s.clientMaidenName} onChange={(e) => update({ clientMaidenName: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Date de naissance</Label>
            <Input type="date" value={s.clientDateOfBirth} onChange={(e) => update({ clientDateOfBirth: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Profession</Label>
            <Input value={s.clientProfession} onChange={(e) => update({ clientProfession: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Adresse</Label>
            <Input value={s.clientAddress} onChange={(e) => update({ clientAddress: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Nationalité</Label>
            <select value={s.clientNationality} onChange={(e) => update({ clientNationality: e.target.value })}
              className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {NATIONALITES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Email</Label>
            <Input value={s.clientEmail} onChange={(e) => update({ clientEmail: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Téléphone</Label>
            <Input value={s.clientPhone} onChange={(e) => update({ clientPhone: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Pièce d'identité</Label>
            <Input value={s.clientIdDocument} onChange={(e) => update({ clientIdDocument: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Wilaya</Label>
            <input list="wilayas-client" value={s.clientWilaya} onChange={(e) => update({ clientWilaya: e.target.value })}
              className="h-12 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
            <datalist id="wilayas-client">{WILAYAS.map((w) => <option key={w} value={w} />)}</datalist>
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Délivré le</Label>
            <Input type="date" value={s.clientIdDeliveryDate} onChange={(e) => update({ clientIdDeliveryDate: e.target.value })} className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Lieu de délivrance</Label>
            <Input value={s.clientIdDeliveryPlace} onChange={(e) => update({ clientIdDeliveryPlace: e.target.value })} placeholder="Oran" className="h-12 text-base" />
          </div>
          <div>
            <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Autorité de délivrance</Label>
            <Input value={s.clientIdAuthority} onChange={(e) => update({ clientIdAuthority: e.target.value })} placeholder="APC/Ambassade" className="h-12 text-base" />
          </div>
        </div>

        {/* Additional guests */}
        {s.guestCount > 1 && (
          <div style={{ marginBottom: 20 }}>
            <Separator style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 10 }}>
              Conjoint / Autres invités ({s.guestCount - 1})
            </p>
            {s.additionalGuests.map((g, i) => (
              <div key={i} style={{ padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, marginBottom: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  Invité {i + 1}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Nom</Label>
                    <Input value={g.nom} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], nom: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Prénom</Label>
                    <Input value={g.prenom} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], prenom: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Nom de jeune fille</Label>
                    <Input value={g.maidenName || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], maidenName: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Date de naissance</Label>
                    <Input type="date" value={g.dateOfBirth || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], dateOfBirth: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Profession</Label>
                    <Input value={g.profession || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], profession: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Adresse</Label>
                    <Input value={g.address || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], address: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Nationalité</Label>
                    <select value={g.nationality || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], nationality: e.target.value };
                      update({ additionalGuests: guests });
                    }}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                      <option value="">---</option>
                      {NATIONALITES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Email</Label>
                    <Input type="email" value={g.email || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], email: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Téléphone</Label>
                    <Input value={g.phone || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], phone: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Pièce d'identité</Label>
                    <Input value={g.idDocument} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], idDocument: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Délivré le</Label>
                    <Input type="date" value={g.idDeliveryDate || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], idDeliveryDate: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Lieu de délivrance</Label>
                    <Input value={g.idDeliveryPlace || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], idDeliveryPlace: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" placeholder="Oran" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Autorité de délivrance</Label>
                    <Input value={g.idAuthority || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], idAuthority: e.target.value };
                      update({ additionalGuests: guests });
                    }} className="h-9 text-sm" placeholder="APC/Ambassade" />
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Wilaya</Label>
                    <input list={`wilayas-guest-${i}`} value={g.wilaya || ""} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], wilaya: e.target.value };
                      update({ additionalGuests: guests });
                    }}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
                    <datalist id={`wilayas-guest-${i}`}>{WILAYAS.map((w) => <option key={w} value={w} />)}</datalist>
                  </div>
                  <div>
                    <Label style={{ fontSize: 11, color: "#64748B", marginBottom: 4, display: "block" }}>Genre</Label>
                    <select value={g.gender || "MALE"} onChange={(e) => {
                      const guests = [...s.additionalGuests];
                      guests[i] = { ...guests[i], gender: e.target.value as "MALE" | "FEMALE" };
                      update({ additionalGuests: guests });
                    }}
                      className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                      <option value="MALE">Masculin</option>
                      <option value="FEMALE">Féminin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator style={{ marginBottom: 20 }} />

        {/* Payment method */}
        <div style={{ marginBottom: 20 }}>
          <Label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#1E293B", marginBottom: 10 }}>Moyen de paiement</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {paymentMethods.map((pm) => {
              const active = s.paymentMethod === pm.key;
              return (
                <button key={pm.key} onClick={() => { update({ paymentMethod: pm.key, partnerId: "" }); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                    border: active ? "2px solid #2563EB" : "2px solid #E2E8F0",
                    background: active ? "#EFF6FF" : "white",
                    transition: "all 0.15s",
                  }}>
                  <span style={{ color: active ? "#2563EB" : "#64748B" }}>{pm.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#2563EB" : "#1E293B" }}>{pm.label}</span>
                </button>
              );
            })}
          </div>
          {s.paymentMethod === "PARTNER" && (
            <select value={s.partnerId} onChange={(e) => update({ partnerId: e.target.value })}
              className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              style={{ marginTop: 10 }}>
              <option value="">Choisir un partenaire...</option>
              {s.partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {/* Collapsible options */}
        <details style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, marginBottom: 8 }}>Options supplémentaires</summary>
          <div style={{ padding: "12px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
            <div style={{ marginBottom: 12 }}>
              <Label style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6, display: "block" }}>Code promo</Label>
              <Input placeholder="Entrez le code" value={s.discountCode}
                onChange={(e) => handleDiscountCodeChange(e.target.value)} className="h-10 text-sm" />
              {s.discountValidated && <p style={{ fontSize: 12, color: "#22C55E", marginTop: 4 }}>Code valide ! -{parseInt(s.discountAmount).toLocaleString()} DA</p>}
              {s.discountError && <p style={{ fontSize: 12, color: "#EF4444", marginTop: 4 }}>{s.discountError}</p>}
            </div>
            <div>
              <Label style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", marginBottom: 6, display: "block" }}>Notes</Label>
              <textarea value={s.notes} onChange={(e) => update({ notes: e.target.value })}
                style={{
                  width: "100%", padding: "10px 12px", fontSize: 14,
                  border: "1px solid #E2E8F0", borderRadius: 8, outline: "none",
                  resize: "none", height: 72, fontFamily: "inherit",
                }}
              />
            </div>
          </div>
        </details>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 20, borderTop: "1px solid #E2E8F0" }}>
          <button onClick={() => update({ step: 2 })} disabled={!s.clientNom || !s.clientPrenom}
            style={{
              padding: "14px 36px", borderRadius: 12, border: "none",
              background: !s.clientNom || !s.clientPrenom ? "#94A3B8" : "#2563EB",
              color: "white", fontSize: 16, fontWeight: 700, cursor: !s.clientNom || !s.clientPrenom ? "not-allowed" : "pointer",
            }}>
            Voir le récapitulatif
          </button>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <Card style={{ padding: 20, marginBottom: 16, borderRadius: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 14 }}>Récapitulatif</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748B" }}>Arrivée</span>
              <span style={{ fontWeight: 600, color: "#1E293B" }}>{s.checkIn}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748B" }}>Départ</span>
              <span style={{ fontWeight: 600, color: "#1E293B" }}>{s.checkOut}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748B" }}>Nuits</span>
              <span style={{ fontWeight: 600, color: "#1E293B" }}>{nights}</span>
            </div>
            <Separator />
            {selectedRooms.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>Ch. {r.roomNumber} &middot; {r.bedLayout}</span>
                <span>{r.pricePerNight.toLocaleString()} DA/nuit</span>
              </div>
            ))}
            <Separator />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#64748B" }}>Sous-total</span>
              <span style={{ fontWeight: 600 }}>{totalBeforeDiscount.toLocaleString()} DA</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <Label style={{ fontSize: 12, color: "#64748B" }}>Remise manuelle (DZD)</Label>
              <Input type="number" placeholder="0" min="0" value={s.manualDiscount}
                onChange={(e) => update({ manualDiscount: e.target.value })}
                className="h-9 text-sm mt-1" />
            </div>
            {discountVal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#EF4444" }}>
                <span>Remise totale</span>
                <span>-{discountVal.toLocaleString()} DA</span>
              </div>
            )}
            <Separator />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800 }}>
              <span style={{ color: "#1E293B" }}>Total</span>
              <span style={{ color: "#2563EB" }}>{totalAmount.toLocaleString()} DA</span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 16, borderRadius: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
            <p><span style={{ color: "#64748B" }}>Client:</span> <span style={{ fontWeight: 600 }}>{s.clientNom + " " + s.clientPrenom}</span></p>
            {s.clientPhone && <p><span style={{ color: "#64748B" }}>Tél:</span> {s.clientPhone}</p>}
            <p><span style={{ color: "#64748B" }}>Paiement:</span> {s.paymentMethod === "CASH" ? "Espèces" : s.paymentMethod === "TPE" ? "Carte" : `Partenaire (${s.partners.find((p) => p.id === s.partnerId)?.name || ""})`}</p>
          </div>
        </Card>

        {s.noShift && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 12, textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}>Aucun service actif. Veuillez démarrer un service depuis le tableau de bord.</p>
          </div>
        )}
        {s.error && <p style={{ fontSize: 14, color: "#EF4444", textAlign: "center", marginBottom: 12 }}>{s.error}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          {s.selectedRoomIds.length === 1 && s.clientPhone && (
            <button onClick={handlePreReservation} disabled={s.isSubmitting}
              style={{
                flex: 1, padding: "16px", borderRadius: 14, border: "2px solid #D4A853",
                background: "white", color: "#92400E", fontSize: 15, fontWeight: 700,
                cursor: s.isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: s.isSubmitting ? 0.5 : 1,
              }}>
              <Clock size={18} /> Pré-réserver
            </button>
          )}
          <button onClick={submitBooking} disabled={s.isSubmitting || selectedRooms.length === 0 || s.noShift}
            style={{
              flex: s.selectedRoomIds.length === 1 && s.clientPhone ? 1 : undefined,
              width: s.selectedRoomIds.length === 1 && s.clientPhone ? undefined : "100%",
              padding: "16px", borderRadius: 14, border: "none",
              background: s.isSubmitting || selectedRooms.length === 0 ? "#94A3B8" : "#2563EB",
              color: "white", fontSize: 17, fontWeight: 700, cursor: s.isSubmitting || selectedRooms.length === 0 ? "not-allowed" : "pointer",
            }}>
            {s.isSubmitting ? "Création en cours..." : `Confirmer la réservation (${totalAmount > 0 ? totalAmount.toLocaleString() : "..."} DA)`}
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <p style={{ fontSize: 16, color: "#64748B" }}>Redirection vers l'historique...</p>
      </div>
    );
  }



  const backLabel = s.step === 0 ? "Plan des chambres" : "Retour";

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <header style={{
        background: "white", borderBottom: "1px solid #E2E8F0",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div className="max-w-3xl mx-auto" style={{ padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => s.step === 0 ? router.push("/receptionist") : update({ step: s.step - 1, error: null })}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#64748B", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
            <ChevronLeft size={18} /> {backLabel}
          </button>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>Nouvelle réservation</h1>
          <div style={{ minWidth: 180, display: "flex", justifyContent: "flex-end" }}>
            <SoldeCaisse token={token!} />
          </div>
        </div>
      </header>

      {/* Step indicator */}
      {s.step < 3 && (
        <div className="max-w-3xl mx-auto" style={{ padding: "20px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 16px", borderRadius: 20,
                  background: i === s.step ? "#2563EB" : i < s.step ? "#F0FDF4" : "#F1F5F9",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                    background: i === s.step ? "white" : i < s.step ? "#22C55E" : "#CBD5E1",
                    color: i === s.step ? "#2563EB" : "white",
                  }}>
                    {i < s.step ? <Check size={12} /> : i + 1}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: i === s.step ? "white" : i < s.step ? "#16A34A" : "#94A3B8",
                    display: "none" as const,
                  }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    width: 60, height: 2,
                    background: i < s.step ? "#22C55E" : "#E2E8F0",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-3xl mx-auto" style={{ padding: "16px 24px 40px" }}>
        {s.error && s.step < 3 && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", background: "#FEF2F2",
            border: "1px solid #FECACA", borderRadius: 10, fontSize: 14, color: "#B91C1C",
          }}>
            {s.error}
          </div>
        )}

        {renderStep()}
      </main>
    </div>
  );
}



export default function BookingWizard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    }>
      <WizardContent />
    </Suspense>
  );
}
