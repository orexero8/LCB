import { verifyToken, getTokenFromHeader, type JwtPayload } from "./auth";

type AuthResult =
  | { authorized: true; payload: JwtPayload }
  | { authorized: false; response: Response };

function checkAuth(request: Request, requiredRole?: "ADMIN" | "RECEPTIONIST"): AuthResult {
  const token = getTokenFromHeader(request);
  if (!token) {
    return { authorized: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { authorized: false, response: Response.json({ error: "Invalid token" }, { status: 401 }) };
  }

  if (requiredRole && payload.role !== requiredRole) {
    return { authorized: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, payload };
}

export function requireAdmin(request: Request) {
  return checkAuth(request, "ADMIN");
}

export function requireReceptionist(request: Request) {
  return checkAuth(request, "RECEPTIONIST");
}

export function requireAnyUser(request: Request) {
  return checkAuth(request);
}
