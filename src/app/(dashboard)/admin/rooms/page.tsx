"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Floor {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  rooms: Room[];
}

interface RoomType {
  id: string;
  name: string;
  bedLayoutLabel: string;
}

interface Room {
  id: string;
  roomNumber: number;
  name: string | null;
  floorId: string;
  roomTypeId: string;
  bedLayout: string;
  pricePerNight: number;
  photoUrl: string | null;
  notes: string | null;
  status: string;
  floor?: Floor;
  roomType?: RoomType;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-500 hover:bg-green-600",
  OCCUPIED: "bg-red-500 hover:bg-red-600",
  RESERVED: "bg-yellow-500 hover:bg-yellow-600",
  BLOCKED: "bg-red-700 hover:bg-red-800",
  MAINTENANCE: "bg-purple-500 hover:bg-purple-600",

};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  RESERVED: "Reserved",
  BLOCKED: "Blocked",
  MAINTENANCE: "Maintenance",

};

export default function RoomsPage() {
  const [floorData, setFloorData] = useState<Floor[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);

  const [formName, setFormName] = useState("");
  const [formRoomNumber, setFormRoomNumber] = useState("");
  const [formFloorId, setFormFloorId] = useState("");
  const [formBedConfig, setFormBedConfig] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("AVAILABLE");

  // Room type creation sub-dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    const [mapRes, typesRes] = await Promise.all([
      fetch("/api/rooms/map", { headers }),
      fetch("/api/room-types", { headers }),
    ]);
    if (mapRes.ok) {
      const data = await mapRes.json();
      setFloorData(data.floors);
    }
    if (typesRes.ok) {
      const data = await typesRes.json();
      setRoomTypes(data.roomTypes);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditRoom(null);
    setFormName("");
    setFormRoomNumber("");
    setFormFloorId(floorData[0]?.id || "");
    setFormBedConfig(roomTypes[0]?.bedLayoutLabel || "");
    setFormPrice("");
    setFormPhotoUrl("");
    setFormNotes("");
    setFormStatus("AVAILABLE");
    setDialogOpen(true);
  }

  function openEdit(room: Room) {
    setEditRoom(room);
    setFormName(room.name || "");
    setFormRoomNumber(room.roomNumber.toString());
    setFormFloorId(room.floorId);
    setFormBedConfig(room.bedLayout);
    setFormPrice(room.pricePerNight.toString());
    setFormPhotoUrl(room.photoUrl || "");
    setFormNotes(room.notes || "");
    setFormStatus(room.status);
    setDialogOpen(true);
  }

  async function handleCreateType() {
    if (!newTypeName || !newTypeLabel) {
      toast.error("Name and bed layout are required");
      return;
    }
    const res = await fetch("/api/room-types", {
      method: "POST",
      headers,
      body: JSON.stringify({ name: newTypeName, bedLayoutLabel: newTypeLabel }),
    });
    if (res.ok) {
      toast.success("Room type created");
      setTypeDialogOpen(false);
      setNewTypeName("");
      setNewTypeLabel("");
      const data = await res.json();
      // Auto-select the new type
      setFormBedConfig(data.roomType.bedLayoutLabel);
      // Refresh types list
      const typesRes = await fetch("/api/room-types", { headers });
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setRoomTypes(typesData.roomTypes);
      }
    } else {
      const err = await res.json();
      toast.error(err.error);
    }
  }

  async function handleSave() {
    if (!formRoomNumber || !formFloorId || !formBedConfig || !formPrice) {
      toast.error("Room Number, Floor, Bed Configuration, and Price are required");
      return;
    }

    const matchedType = roomTypes.find((rt) => rt.bedLayoutLabel === formBedConfig);
    const body = {
      name: formName.trim() || null,
      roomNumber: parseInt(formRoomNumber),
      floorId: formFloorId,
      roomTypeId: matchedType?.id || null,
      bedLayout: formBedConfig,
      pricePerNight: parseFloat(formPrice),
      photoUrl: formPhotoUrl || null,
      notes: formNotes || null,
      status: editRoom ? formStatus : undefined,
    };

    if (editRoom) {
      const res = await fetch(`/api/rooms/${editRoom.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Room updated");
        setDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } else {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Room created");
        setDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    }
  }

  async function handleDelete(room: Room) {
    if (!confirm(`Delete Room ${room.roomNumber}?`)) return;
    const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE", headers });
    if (res.ok) {
      toast.success("Room deleted");
      fetchData();
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <Button onClick={openCreate}>Add Room</Button>
      </div>

      <div className="space-y-8">
        {floorData.map((floor) => (
          <div key={floor.id}>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              {floor.name}
              <Badge variant="outline">{floor.rooms.length} rooms</Badge>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {floor.rooms.map((room) => (
                <div
                  key={room.id}
                  className={`${STATUS_COLORS[room.status] || "bg-gray-400"} text-white rounded-lg p-3 transition-transform hover:scale-105 min-h-[80px]`}
                >
                  <div className="flex items-start justify-between">
                    <button onClick={() => openEdit(room)} className="text-left flex-1">
                      <div className="font-bold text-lg">{room.name || room.roomNumber}</div>
                      <div className="text-xs opacity-90">Ch. {room.roomNumber} &middot; {room.bedLayout}</div>
                      <div className="text-xs opacity-75">{room.pricePerNight.toLocaleString()} DA</div>
                    </button>
                    <button
                      onClick={async () => {
                        const newStatus = room.status === "BLOCKED" ? "AVAILABLE" : "BLOCKED";
                        await fetch(`/api/rooms/${room.id}`, {
                          method: "PUT",
                          headers,
                          body: JSON.stringify({ status: newStatus }),
                        });
                        fetchData();
                      }}
                      className="ml-2 text-white/80 hover:text-white text-[10px] uppercase font-bold px-1.5 py-1 rounded border border-white/30 hover:border-white/60 transition-colors"
                      title={room.status === "BLOCKED" ? "Unblock" : "Block"}
                    >
                      {room.status === "BLOCKED" ? "UNBLOCK" : "BLOCK"}
                    </button>
                  </div>
                  <div className="text-[10px] opacity-70 mt-1">{STATUS_LABELS[room.status] || room.status}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {floorData.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No floors or rooms yet. Create floors first, then add rooms.
          </p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editRoom ? `Edit Room ${editRoom.roomNumber}` : "Add Room"}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input
                  type="number"
                  placeholder="101"
                  value={formRoomNumber}
                  onChange={(e) => setFormRoomNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Room Name</Label>
                <Input
                  placeholder="e.g. Chambre Vue Mer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (DA/night)</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select value={formFloorId} onValueChange={(v) => v && setFormFloorId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floorData.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Configuration des lits</Label>
              <div className="flex gap-2">
                <Select value={formBedConfig} onValueChange={(v) => v && setFormBedConfig(v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((rt) => (
                      <SelectItem key={rt.id} value={rt.bedLayoutLabel}>{rt.bedLayoutLabel}</SelectItem>
                    ))}
                    {roomTypes.length === 0 && (
                      <SelectItem value="__none__" disabled>Aucune configuration</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { setNewTypeName(""); setNewTypeLabel(""); setTypeDialogOpen(true); }}
                  title="Ajouter une configuration de lit"
                >
                  +
                </Button>
              </div>
            </div>
            {editRoom && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => v && setFormStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Photo URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={formPhotoUrl}
                onChange={(e) => setFormPhotoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any notes about this room"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editRoom && (
              <Button variant="destructive" onClick={() => handleDelete(editRoom)} className="mr-auto">
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editRoom ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room type creation sub-dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouvelle configuration de lit</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Nom du type</Label>
              <Input
                placeholder="Ex: Mixte, Familiale..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Configuration des lits</Label>
              <Input
                placeholder="Ex: 1 grand lit + 1 petit lit"
                value={newTypeLabel}
                onChange={(e) => setNewTypeLabel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Formats reconnus: <code>1 grand lit</code>, <code>2 lits</code>, <code>1 grand lit + 1 petit lit</code>
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateType}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
