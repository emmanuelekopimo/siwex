// Signed JWT sessions. Kept free of next/headers so proxy.ts and tests can use it.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "siwex_session";
export const SESSION_DAYS = 7;

export interface SessionPayload {
  userId: number;
  role: "student" | "hub";
  name: string;
}

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set (16+ characters)");
    return new TextEncoder().encode("dev-only-insecure-secret-siwex");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const userId = Number(payload.sub);
    const role = payload.role;
    if (!Number.isInteger(userId) || (role !== "student" && role !== "hub")) return null;
    return { userId, role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
