import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getDb } from "@/db";
import { ApplicationBadge, Avatar, Empty, HubLogo, OpeningBadge, Progress } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { trackLabel } from "@/lib/catalog";
import { getHubDashboard } from "@/lib/data";
import { addDays, formatDate, getToday, relativeDays } from "@/lib/dates";
import { STALE_PENDING_DAYS } from "@/lib/rules";
import { DecideButtons } from "./decide-buttons";
import { OpeningForm } from "./opening-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hub dashboard" };

export default async function HubDashboard() {
  const session = await requireRole("hub");
  const today = getToday();
  const dash = await getHubDashboard(getDb(), session.userId, today);
  if (!dash) return <div className="container section">No hub profile is linked to this account.</div>;
  const { hub, openings, pending, interns, stats } = dash;

  return (
    <>
      <div className="page-head">
        <div className="container row between">
          <div className="row">
            <HubLogo name={hub.name} color={hub.color} size="lg" />
            <div>
              <h1 style={{ marginBottom: 2 }}>{hub.name}</h1>
              <p className="small">Hub dashboard. Signed in as {session.name}.</p>
            </div>
          </div>
          <Link href={`/hubs/${hub.slug}`} className="btn white sm"><ExternalLink size={14} /> Public page</Link>
        </div>
      </div>

      <div className="container stack">
        <div className="grid-stats">
          <div className="card stat"><span className="num" data-testid="stat-live">{stats.liveOpenings}</span><span className="lbl">Live openings</span></div>
          <div className="card stat"><span className="num" data-testid="stat-pending">{stats.pending}</span><span className="lbl">Pending applications</span></div>
          <div className={`card stat ${stats.needsResponse ? "warn" : ""}`}><span className="num" data-testid="stat-needs">{stats.needsResponse}</span><span className="lbl">Waiting over {STALE_PENDING_DAYS} days</span></div>
          <div className="card stat"><span className="num" data-testid="stat-interns">{stats.interns}</span><span className="lbl">Accepted interns</span></div>
        </div>

        <div className="grid-2">
          <section className="stack">
            <div className="card">
              <h2>Applications to review</h2>
              {pending.length === 0 ? (
                <Empty>No pending applications.</Empty>
              ) : (
                <div className="list" data-testid="pending-list">
                  {pending.map((a) => (
                    <div className="list-item" key={a.application.id} data-testid="pending-row">
                      <Avatar name={a.user.name} />
                      <div className="grow">
                        <div className="row between">
                          <span className="bold">{a.user.name}</span>
                          <ApplicationBadge status={a.display} />
                        </div>
                        <div className="muted small">
                          {a.student.level} level {a.student.course}, {a.student.school}. Needs {a.student.requiredWeeks} weeks.
                        </div>
                        <div className="small" style={{ marginTop: 4 }}>
                          For <strong>{a.opening.title}</strong> ({a.opening.slotsLeft} of {a.opening.slots} slots left). Applied {relativeDays(a.application.appliedOn, today)}.
                        </div>
                        <p className="small muted" style={{ margin: "6px 0 0", fontStyle: "italic" }}>&quot;{a.application.note}&quot;</p>
                        <span className="badge teal" style={{ marginTop: 6 }}>{a.match.score}% match</span>
                        <DecideButtons applicationId={a.application.id} name={a.user.name} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2>Interns</h2>
              {interns.length === 0 ? (
                <p className="muted small">No accepted interns yet.</p>
              ) : (
                <div className="list" data-testid="intern-list">
                  {interns.map((a) => (
                    <div className="list-item" key={a.application.id}>
                      <Avatar name={a.user.name} />
                      <div className="grow">
                        <div className="row between">
                          <span className="bold">{a.user.name}</span>
                          <span className="badge accepted">
                            {a.progress?.state === "not_started" ? `Starts ${relativeDays(a.opening.startDate, today)}` : a.progress?.state === "completed" ? "Completed" : `Week ${a.progress?.currentWeek} of ${a.progress?.totalWeeks}`}
                          </span>
                        </div>
                        <div className="muted small" style={{ marginBottom: 6 }}>{a.opening.title}</div>
                        <Progress percent={a.progress?.percent ?? 0} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="stack">
            <div className="card">
              <h2>Your openings</h2>
              <div className="list" data-testid="hub-openings">
                {openings.map((o) => (
                  <div className="list-item" key={o.id}>
                    <div className="grow">
                      <div className="row between">
                        <span className="bold small">{o.title}</span>
                        <OpeningBadge status={o.status} />
                      </div>
                      <div className="muted tiny">{trackLabel(o.track)} - {o.accepted} of {o.slots} filled - deadline {formatDate(o.deadline)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <h2>Post a new opening</h2>
              <OpeningForm today={today} defaultDeadline={addDays(today, 21)} defaultStart={addDays(today, 35)} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
