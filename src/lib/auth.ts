import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireRole(role: SessionPayload["role"]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== role) redirect(session.role === "hub" ? "/hub" : "/student");
  return session;
}

export async function startSession(payload: SessionPayload): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
