"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Floor {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count: { rooms: number };
}

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFloor, setEditFloor] = useState<Floor | null>(null);
  const [formName, setFormName] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchFloors = useCallback(async () => {
    const res = await fetch("/api/floors", { headers });
    if (res.ok) {
      const data = await res.json();
      setFloors(data.floors);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFloors(); }, [fetchFloors]);

  function openCreate() {
    setEditFloor(null);
    setFormName("");
    setDialogOpen(true);
  }

  function openEdit(floor: Floor) {
    setEditFloor(floor);
    setFormName(floor.name);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error("Name is required"); return; }

    if (editFloor) {
      const res = await fetch(`/api/floors/${editFloor.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name: formName.trim() }),
      });
      if (res.ok) {
        toast.success("Floor updated");
        setDialogOpen(false);
        fetchFloors();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    } else {
      const res = await fetch("/api/floors", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: formName.trim() }),
      });
      if (res.ok) {
        toast.success("Floor created");
        setDialogOpen(false);
        fetchFloors();
      } else {
        const err = await res.json();
        toast.error(err.error);
      }
    }
  }

  async function toggleActive(floor: Floor) {
    const res = await fetch(`/api/floors/${floor.id}/deactivate`, {
      method: "PATCH",
      headers,
    });
    if (res.ok) {
      toast.success(floor.isActive ? "Floor deactivated" : "Floor activated");
      fetchFloors();
    }
  }

  async function moveUp(index: number) {
    if (index === 0) return;
    const newOrder = [...floors];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorder(newOrder);
  }

  async function moveDown(index: number) {
    if (index === floors.length - 1) return;
    const newOrder = [...floors];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorder(newOrder);
  }

  async function reorder(newOrder: Floor[]) {
    const res = await fetch("/api/floors/reorder", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ order: newOrder.map((f) => f.id) }),
    });
    if (res.ok) {
      fetchFloors();
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Floors</h1>
        <Button onClick={openCreate}>Add Floor</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead className="w-40">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {floors.map((floor, index) => (
            <TableRow key={floor.id} className={!floor.isActive ? "opacity-50" : ""}>
              <TableCell>
                <div className="flex gap-1">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="text-xs px-1 hover:text-blue-600 disabled:text-gray-300">↑</button>
                  <button onClick={() => moveDown(index)} disabled={index === floors.length - 1} className="text-xs px-1 hover:text-blue-600 disabled:text-gray-300">↓</button>
                </div>
              </TableCell>
              <TableCell className="font-medium">{floor.name}</TableCell>
              <TableCell>
                <Badge variant={floor.isActive ? "default" : "secondary"}>
                  {floor.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>{floor._count.rooms}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(floor)}>Edit</Button>
                  <Button
                    variant={floor.isActive ? "secondary" : "default"}
                    size="sm"
                    onClick={() => toggleActive(floor)}
                  >
                    {floor.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {floors.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                No floors yet. Click "Add Floor" to create one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editFloor ? "Edit Floor" : "Add Floor"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Floor name (e.g. Ground Floor, 1st Floor)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editFloor ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
