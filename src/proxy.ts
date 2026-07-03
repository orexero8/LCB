import { verifyToken } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/api/auth/login", "/api/auth/users"];

// Routes where auth is handled by the route handler itself
const PASS_THROUGH_API_ROUTES = [
  "/api/auth/me",
  "/api/available-rooms",
  "/api/rooms/map",
  "/api/bookings",
  "/api/clients",
  "/api/checkout-alerts",
  "/api/discounts/validate",
  "/api/shift/last",
];

export function proxy(request: Request) {
  const { pathname } = new URL(request.url);

  // Public routes - always pass through
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return;
  }

  // Page routes pass through - client components handle auth via localStorage
  if (!pathname.startsWith("/api/")) {
    return;
  }

  // ---- API routes below this point require auth ----

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Pass-through for routes that handle their own auth
  if (PASS_THROUGH_API_ROUTES.some((r) => pathname.startsWith(r))) {
    return;
  }

  // Admin-only API routes
  if (
    pathname.startsWith("/api/floors") ||
    pathname.startsWith("/api/rooms") ||
    pathname.startsWith("/api/room-types") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/partners") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/discounts") ||
    pathname.startsWith("/api/users")
  ) {
    if (payload.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Receptionist-only API routes
  if (
    pathname.startsWith("/api/shift") ||
    pathname.startsWith("/api/expenses")
  ) {
    if (payload.role !== "RECEPTIONIST") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
