import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { withdrawAction } from "@/app/actions";
import { getDb } from "@/db";
import { ApplicationBadge, Avatar, Empty, HubLogo, OpeningBadge, Progress } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { trackLabel } from "@/lib/catalog";
import { getMyApplications, getRecommendations, getStudentProfile } from "@/lib/data";
import { formatDate, getToday, relativeDays } from "@/lib/dates";
import { formatStipend, MAX_PENDING_APPLICATIONS, STALE_PENDING_DAYS } from "@/lib/rules";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Student dashboard" };

export default async function StudentDashboard() {
  const session = await requireRole("student");
  const db = getDb();
  const today = getToday();
  const [profile, apps, recs] = await Promise.all([
    getStudentProfile(db, session.userId),
    getMyApplications(db, session.userId, today),
    getRecommendations(db, session.userId, today),
  ]);
  if (!profile) return <div className="container section">Student profile not found.</div>;
  const placement = apps.find((a) => a.application.status === "accepted");
  const pendingCount = apps.filter((a) => a.application.status === "pending").length;
  const stale = apps.filter((a) => a.display === "no_response");

  return (
    <>
      <div className="page-head">
        <div className="container row">
          <Avatar name={profile.user.name} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ marginBottom: 2 }}>Hello, {profile.user.name.split(" ")[0]}</h1>
            <p className="row small" style={{ gap: 10 }}>
              <span className="row" style={{ gap: 4 }}><GraduationCap size={16} /> {profile.student.level} level {profile.student.course}, {profile.student.school}</span>
              <span className="row" style={{ gap: 4 }}><MapPin size={16} /> {profile.student.city}</span>
              <span className="row" style={{ gap: 4 }}><CalendarClock size={16} /> SIWES: {profile.student.requiredWeeks} weeks</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container grid-2">
        <section className="stack">
          {placement?.progress && (
            <div className="card stack" data-testid="placement-card" style={{ gap: 10 }}>
              <div className="row between">
                <h2 style={{ margin: 0 }}>Your placement</h2>
                <span className="badge accepted">
                  {placement.progress.state === "not_started" ? `Starts ${relativeDays(placement.opening.startDate, today)}` : placement.progress.state === "completed" ? "Completed" : `Week ${placement.progress.currentWeek} of ${placement.progress.totalWeeks}`}
                </span>
              </div>
              <div className="row">
                <HubLogo name={placement.hub.name} color={placement.hub.color} />
                <div>
                  <div className="bold">{placement.opening.title}</div>
                  <div className="muted small">{placement.hub.name}, {placement.hub.address}</div>
                </div>
              </div>
              <Progress percent={placement.progress.percent} />
              <div className="muted small">
                {formatDate(placement.opening.startDate)} to {formatDate(placement.progress.endDate)}. {formatStipend(placement.opening.stipendNaira)}.
              </div>
            </div>
          )}

          <div className="card">
            <div className="row between" style={{ marginBottom: 6 }}>
              <h2 style={{ margin: 0 }}>My applications</h2>
              <span className="muted small">{pendingCount} of {MAX_PENDING_APPLICATIONS} pending allowed</span>
            </div>
            {stale.length > 0 && (
              <div className="alert warn small" style={{ margin: "8px 0" }} data-testid="stale-alert">
                {stale.length === 1 ? "1 application has" : `${stale.length} applications have`} had no reply for over {STALE_PENDING_DAYS} days. Consider applying elsewhere.
              </div>
            )}
            {apps.length === 0 ? (
              <Empty>No applications yet. <Link href="/hubs">Browse hubs</Link> to find a placement.</Empty>
            ) : (
              <div className="list" data-testid="my-applications">
                {apps.map((a) => (
                  <div className="list-item" key={a.application.id} data-testid="application-row">
                    <HubLogo name={a.hub.name} color={a.hub.color} />
                    <div className="grow">
                      <div className="row between">
                        <Link href={`/hubs/${a.hub.slug}`} className="bold">{a.opening.title}</Link>
                        <ApplicationBadge status={a.display} />
                      </div>
                      <div className="muted small">{a.hub.name} - applied {formatDate(a.application.appliedOn)} ({relativeDays(a.application.appliedOn, today)})</div>
                      {a.application.status === "pending" && (
                        <form action={withdrawAction} style={{ marginTop: 6 }}>
                          <input type="hidden" name="applicationId" value={a.application.id} />
                          <button className="btn danger sm" type="submit">Withdraw</button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="stack">
          <div className="card">
            <h2 className="row" style={{ gap: 6 }}><Sparkles size={18} color="#7d2ae8" /> Recommended for you</h2>
            <p className="muted small">Ranked by your course, city and SIWES length.</p>
            {recs.length === 0 ? (
              <p className="muted small">No open roles to recommend right now.</p>
            ) : (
              <div className="list" data-testid="recommendations">
                {recs.map((r) => (
                  <div className="list-item" key={r.opening.id}>
                    <div className="grow">
                      <div className="row between">
                        <Link href={`/hubs/${r.hub.slug}`} className="bold small">{r.opening.title}</Link>
                        <span className="badge teal">{r.match.score}% match</span>
                      </div>
                      <div className="muted tiny">{r.hub.name} - {trackLabel(r.opening.track)}</div>
                      <div className="row tiny" style={{ gap: 6, marginTop: 4 }}>
                        <OpeningBadge status={r.opening.status} />
                        <span className="muted">Apply by {formatDate(r.opening.deadline)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
