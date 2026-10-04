import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarClock, Clock, Globe, MapPin, Phone, Users, Wallet } from "lucide-react";
import { getDb } from "@/db";
import { Cover, hubScene } from "@/components/brand";
import { HubLogo, OpeningBadge } from "@/components/ui";
import { getSession } from "@/lib/auth";
import { trackLabel } from "@/lib/catalog";
import { canStudentApply, getHubBySlug } from "@/lib/data";
import { formatDate, getToday, relativeDays } from "@/lib/dates";
import { formatStipend } from "@/lib/rules";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/hubs/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await getHubBySlug(getDb(), slug, getToday());
  return { title: found?.hub.name ?? "Hub not found" };
}

export default async function HubPage(props: PageProps<"/hubs/[slug]">) {
  const { slug } = await props.params;
  const db = getDb();
  const today = getToday();
  const found = await getHubBySlug(db, slug, today);
  if (!found) notFound();
  const { hub, openings } = found;
  const session = await getSession();
  const checks =
    session?.role === "student"
      ? new Map(await Promise.all(openings.map(async (o) => [o.id, await canStudentApply(db, session.userId, o.id, today)] as const)))
      : null;

  return (
    <>
      <Cover track={hubScene(hub.slug)} color={hub.color} className="hub-banner" alt={`People at work at ${hub.name}`} />
      <div className="container">
        <div className="hub-banner-bar">
          <HubLogo name={hub.name} color={hub.color} size="lg" />
          <div style={{ minWidth: 0, paddingBottom: 4 }}>
            <h1>{hub.name}</h1>
            <p className="row muted" style={{ gap: 6, margin: 0 }}><MapPin size={16} /> {hub.city}, {hub.state}
              {hub.addressVerified && <span className="badge open"><BadgeCheck size={14} /> Verified</span>}
            </p>
          </div>
        </div>
      </div>
      <div className="container grid-2">
        <section className="stack">
          <h2 style={{ margin: 0 }}>Openings</h2>
          {openings.length === 0 && <div className="card muted">This hub has no openings yet.</div>}
          {openings.map((o) => {
            const check = checks?.get(o.id);
            const live = o.status === "open" || o.status === "closing_soon";
            return (
              <article className="opening" key={o.id} data-testid="opening">
                <div className="row between">
                  <h3 style={{ margin: 0 }}>{o.title}</h3>
                  <OpeningBadge status={o.status} />
                </div>
                <div className="chips"><span className="chip">{trackLabel(o.track)}</span></div>
                <p className="small" style={{ margin: 0 }}>{o.description}</p>
                <div className="meta">
                  <span><Users size={14} /> {o.slotsLeft} of {o.slots} slots left</span>
                  <span><Clock size={14} /> {o.durationWeeks} weeks</span>
                  <span><CalendarClock size={14} /> Starts {formatDate(o.startDate)}</span>
                  <span><Wallet size={14} /> {formatStipend(o.stipendNaira)}</span>
                </div>
                <div className={`small bold ${o.status === "closing_soon" ? "" : "muted"}`} style={o.status === "closing_soon" ? { color: "var(--amber)" } : undefined}>
                  {o.status === "closed" ? `Closed on ${formatDate(o.deadline)}` : `Apply by ${formatDate(o.deadline)} (${relativeDays(o.deadline, today)})`}
                </div>
                {live && !session && (
                  <Link className="btn secondary" href={`/sign-in?next=/hubs/${hub.slug}`}>Sign in as a student to apply</Link>
                )}
                {live && session?.role === "hub" && <p className="muted small" style={{ margin: 0 }}>Signed in as a hub. Students apply from this page.</p>}
                {check && (check.ok ? (
                  <details>
                    <summary>Apply for this role</summary>
                    <div style={{ marginTop: 10 }}><ApplyForm openingId={o.id} /></div>
                  </details>
                ) : check.code === "already_applied" ? (
                  <div className="alert success small" data-testid="applied">
                    You applied for this role. <Link href="/student">Track it on your dashboard</Link>.
                  </div>
                ) : (
                  live && <div className="alert info small" data-testid="apply-blocked">{check.reason}</div>
                ))}
              </article>
            );
          })}
        </section>
        <aside className="stack">
          <div className="card stack" style={{ gap: 10 }}>
            <h2 style={{ margin: 0 }}>About</h2>
            <p className="small" style={{ margin: 0 }}>{hub.about}</p>
            <div className="chips">{hub.tracks.map((t) => <span className="chip" key={t}>{trackLabel(t)}</span>)}</div>
            <div className="small stack" style={{ gap: 6 }}>
              <span className="row" style={{ gap: 6, alignItems: "flex-start", flexWrap: "nowrap" }}><MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {hub.address}</span>
              {hub.addressVerified ? (
                <span className="badge open" style={{ alignSelf: "flex-start" }}><BadgeCheck size={14} /> Address verified</span>
              ) : (
                <span className="badge closing_soon" style={{ alignSelf: "flex-start" }}>Address to be confirmed</span>
              )}
              {hub.phone && <span className="row" style={{ gap: 6 }}><Phone size={16} /> {hub.phone}</span>}
              {hub.website && <span className="row" style={{ gap: 6 }}><Globe size={16} /> {hub.website}</span>}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
