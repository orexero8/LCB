"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface UserData {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: "ADMIN" | "RECEPTIONIST";
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserData | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "RECEPTIONIST">("RECEPTIONIST");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function token() { return localStorage.getItem("token"); }

  useEffect(() => {
    if (!token()) { router.push("/login"); return; }
    fetchUsers();
  }, [router]);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) { const d = await res.json(); setUsers(d.users); }
    setLoading(false);
  }

  function resetForm() {
    setEmail(""); setPhone(""); setName(""); setPassword(""); setRole("RECEPTIONIST"); setIsActive(true);
    setEditing(null); setShowForm(false); setError(null);
  }

  function edit(u: UserData) {
    setEditing(u); setEmail(u.email || ""); setPhone(u.phone || ""); setName(u.name); setPassword("");
    setRole(u.role); setIsActive(u.isActive); setShowForm(true); setError(null);
  }

  async function handleSave() {
    if (!name.trim()) return;
    if (!editing && !password.trim()) return;
    setSaving(true); setError(null);

    const body: any = { email: email.trim() || null, phone: phone.trim() || null, name: name.trim(), role };
    if (!editing) body.password = password;
    if (editing) {
      if (password) body.password = password;
      body.isActive = isActive;
    }

    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error || "Failed to save");
      return;
    }
    toast.success(editing ? "User updated" : "User created");
    resetForm();
    fetchUsers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    toast.success("User deleted");
    fetchUsers();
  }

  async function handleResetPassword(id: string) {
    const newPwd = prompt("Enter new password (min 6 chars):");
    if (!newPwd || newPwd.length < 6) { alert("Password must be at least 6 characters"); return; }
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPwd }),
    });
    if (res.ok) toast.success("Password reset");
    fetchUsers();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }} disabled={showForm}>+ Add User</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editing ? "Edit User" : "New User"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1"><Label>Email (optional)</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" /></div>
              <div className="space-y-1"><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" /></div>
              <div className="space-y-1">
                <Label>Password {editing ? "(leave blank to keep)" : ""}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? "Optional" : "Required"} />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "RECEPTIONIST")}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm">
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {editing && (
                <div className="space-y-1 flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving ? "Saving..." : "Save"}</Button>
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
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No users yet</p> : null}
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.role === "ADMIN" ? "bg-purple-500" : "bg-blue-500"}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {u.role}
                    </span>
                    {!u.isActive && <span className="text-xs text-gray-400 border px-1.5 py-0.5 rounded">Inactive</span>}
                  </div>
                  <p className="text-sm text-gray-500">{u.email || u.phone || "No contact"}</p>
                  <p className="text-xs text-gray-400">
                    Created {u.createdAt.split("T")[0]}
                    {u.phone && ` · ${u.phone}`}
                    {u.lastLogin && ` · Last login ${u.lastLogin.split("T")[0]}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => handleResetPassword(u.id)}>Reset Pwd</Button>
                <Button variant="outline" size="sm" onClick={() => edit(u)}>Edit</Button>
                {u.role !== "ADMIN" && (
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(u.id)}>Delete</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
