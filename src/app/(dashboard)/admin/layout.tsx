"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user.role !== "ADMIN") { router.push("/login"); return; }
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/login");
      });
  }, [router]);

  if (!user) return null;

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/clients", label: "Clients" },
    { href: "/admin/floors", label: "Floors" },
    { href: "/admin/rooms", label: "Rooms" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/partners", label: "Partners" },
    { href: "/admin/discounts", label: "Discounts" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen">
      <Toaster />
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Le Cheval Blanc Admin</h2>
          <p className="text-sm text-gray-400">{user.name}</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">
        {children}
        <OfflineIndicator />
        <InstallPrompt />
      </main>
    </div>
  );
}
