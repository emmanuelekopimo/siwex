import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage(props: PageProps<"/sign-up">) {
  const sp = await props.searchParams;
  const role = sp.role === "hub" ? "hub" : "student";
  return (
    <div className="auth-wrap">
      <div className="card auth-card wide stack">
        <div>
          <h1 style={{ fontSize: "1.7rem" }}>Create your account</h1>
          <p className="muted small">Students find placements. Hubs list openings and pick interns.</p>
        </div>
        <div className="role-tabs" role="tablist">
          <Link href="/sign-up" className={role === "student" ? "active" : ""} role="tab" aria-selected={role === "student"}>I am a student</Link>
          <Link href="/sign-up?role=hub" className={role === "hub" ? "active" : ""} role="tab" aria-selected={role === "hub"}>I run a hub</Link>
        </div>
        <SignUpForm key={role} role={role} />
        <p className="small muted" style={{ margin: 0 }}>Already have an account? <Link href="/sign-in">Sign in</Link></p>
      </div>
    </div>
  );
}
