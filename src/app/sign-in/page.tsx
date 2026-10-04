import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_HUB_EMAIL, DEMO_PASSWORD, DEMO_STUDENT_EMAIL } from "@/lib/demo";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const sp = await props.searchParams;
  const asHub = sp.demo === "hub";
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const email = asHub ? DEMO_HUB_EMAIL : DEMO_STUDENT_EMAIL;
  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/software.svg" alt="" width={400} height={260} />
        <h2>Your placement, one dashboard</h2>
        <p>Apply to hubs across Nigeria and follow every reply, from pending to your first day.</p>
      </aside>
      <div className="auth-main">
      <div className="card auth-card stack">
        <div>
          <h1 style={{ fontSize: "1.7rem" }}>Welcome back</h1>
          <p className="muted small">Sign in to apply for placements or manage your hub.</p>
        </div>
        <div className="role-tabs" role="tablist" aria-label="Demo account">
          <Link href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`} className={asHub ? "" : "active"} role="tab" aria-selected={!asHub}>Student demo</Link>
          <Link href="/sign-in?demo=hub" className={asHub ? "active" : ""} role="tab" aria-selected={asHub}>Hub demo</Link>
        </div>
        <div className="demo-box" data-testid="demo-box">
          Demo login is filled in: <strong>{email}</strong> / <strong>{DEMO_PASSWORD}</strong>
        </div>
        <SignInForm key={email} email={email} password={DEMO_PASSWORD} next={next} />
        <p className="small muted" style={{ margin: 0 }}>
          New here? <Link href="/sign-up">Create an account</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
