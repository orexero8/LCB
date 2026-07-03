"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UserInfo {
  id: string;
  name: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selected, setSelected] = useState<UserInfo | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setError("Failed to load users"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selected.name, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setError("Server returned invalid response");
        return;
      }

      if (!res.ok) {
        setError(data.error || `Login failed (${res.status})`);
        return;
      }

      if (!data.token) {
        setError("No token received from server");
        return;
      }

      localStorage.setItem("token", data.token);

      if (data.user.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user.role === "RECEPTIONIST") {
        router.push("/receptionist");
      } else {
        setError("Unknown user role");
      }
    } catch {
      setError("Network error. Check that the server is running.");
    } finally {
      setLoading(false);
    }
  }

  if (selected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Le Cheval Blanc</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, <span className="font-semibold">{selected.name}</span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setSelected(null); setPassword(""); setError(""); }}>
                Back to user selection
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Le Cheval Blanc</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Select your name to sign in
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-2">
              {error}
            </div>
          )}
          {users.map((u) => (
            <Button
              key={u.id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-4"
              onClick={() => setSelected(u)}
            >
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.role === "ADMIN" ? "Administrator" : "Receptionist"}</div>
              </div>
            </Button>
          ))}
          {users.length === 0 && !error && (
            <p className="text-sm text-center text-muted-foreground py-4">Loading users...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
