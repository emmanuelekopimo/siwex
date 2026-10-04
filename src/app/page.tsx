import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, MapPin, Search, Shapes } from "lucide-react";
import { getDb } from "@/db";
import { sceneFor, Skyline } from "@/components/brand";
import { HubCard } from "@/components/hub-card";
import { OpeningRow } from "@/components/opening-row";
import { CITIES, TRACKS } from "@/lib/catalog";
import { browseSummary, platformStats, searchHubs } from "@/lib/data";
import { getToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const today = getToday();
  const [stats, hubs, summary] = await Promise.all([platformStats(db, today), searchHubs(db, {}, today), browseSummary(db, today)]);
  const featured = [...hubs].sort((a, b) => b.openSlots - a.openSlots || a.name.localeCompare(b.name)).slice(0, 6);
  const closingSoon = summary.live.filter((o) => o.status === "closing_soon").slice(0, 5);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <div className="eyebrow" style={{ color: "#bdbdbd" }}>SIWES placements in Nigerian tech hubs</div>
            <h1>Go where the work is. Find your SIWES placement.</h1>
            <p className="lead">
              Compare tech hubs in Uyo, Lagos, Abuja, Port Harcourt and more. See which roles still have slots, apply in one
              step and follow every reply in one place.
            </p>
            <form className="search-card" action="/openings" role="search">
              <div className="input-wrap">
                <Search size={18} />
                <input name="q" placeholder="Role or hub, e.g. frontend or RootHub" aria-label="Search openings" />
              </div>
              <div className="input-wrap">
                <MapPin size={18} />
                <select name="city" aria-label="City" defaultValue="">
                  <option value="">Any city</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-wrap">
                <Shapes size={18} />
                <select name="track" aria-label="Track" defaultValue="">
                  <option value="">Any track</option>
                  {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <button className="btn lg block" type="submit">Search openings</button>
            </form>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-art" src="/illustrations/hero.svg" alt="Students arriving at a tech hub" width={560} height={440} />
        </div>
      </section>

      <div className="container">
        <div className="stat-strip">
          <div><b data-testid="stat-hubs">{stats.hubs}</b><span>tech hubs listed</span></div>
          <div><b>{summary.cities.length}</b><span>cities</span></div>
          <div><b>{summary.live.length}</b><span>live openings</span></div>
          <div><b data-testid="stat-slots">{stats.openSlots}</b><span>open slots</span></div>
          <div><b>{stats.placed}</b><span>students placed</span></div>
        </div>
      </div>

      <section className="section container">
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0 }}>Browse by track</h2>
            <p>Pick the kind of work you want to learn.</p>
          </div>
          <Link href="/openings" className="btn secondary sm">All openings <ArrowRight size={16} /></Link>
        </div>
        <div className="grid-sm">
          {TRACKS.map((t) => (
            <Link key={t.id} href={`/openings?track=${t.id}`} className="tile" data-testid="track-tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sceneFor(t.id)} alt="" width={400} height={240} />
              <div className="tile-body">
                <b>{t.label}</b>
                <span className="muted small">{summary.byTrack.get(t.id) ?? 0} live openings</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0 }}>Hubs with the most open slots</h2>
            <p>Verified addresses carry a green tick.</p>
          </div>
          <Link href="/hubs" className="btn secondary sm">See all {stats.hubs} hubs <ArrowRight size={16} /></Link>
        </div>
        <div className="grid">
          {featured.map((h) => <HubCard key={h.id} hub={h} />)}
        </div>
      </section>

      {closingSoon.length > 0 && (
        <section className="section container" style={{ paddingTop: 8 }}>
          <div className="section-head">
            <div>
              <h2 style={{ margin: 0 }}>Closing this week</h2>
              <p>Deadlines in the next 7 days.</p>
            </div>
          </div>
          <div className="card" style={{ padding: "4px 20px" }}>
            <div className="list">
              {closingSoon.map((o) => <OpeningRow key={o.id} o={o} hub={o.hub} today={today} />)}
            </div>
          </div>
        </section>
      )}

      <section className="section container" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div>
            <h2 style={{ margin: 0 }}>Hubs by city</h2>
            <p>Start close to home or try a new city.</p>
          </div>
        </div>
        <div className="grid-sm">
          {summary.cities.map((c) => (
            <Link key={c.city} href={`/hubs?city=${encodeURIComponent(c.city)}`} className="city-card" data-testid="city-card">
              <Skyline city={c.city} />
              <div className="city-label">
                <b>{c.city}</b>
                <span>{c.hubs} {c.hubs === 1 ? "hub" : "hubs"} - {c.roles} live {c.roles === 1 ? "role" : "roles"}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 8 }}>
        <h2>How it works</h2>
        <div className="steps">
          <div className="card soft">
            <div className="step-num">1</div>
            <h3><Search size={18} className="icon-inline" /> Find a hub</h3>
            <p className="muted small" style={{ margin: 0 }}>Filter by city and track. Every role shows slots left, stipend and deadline.</p>
          </div>
          <div className="card soft">
            <div className="step-num">2</div>
            <h3><ClipboardCheck size={18} className="icon-inline" /> Apply once</h3>
            <p className="muted small" style={{ margin: 0 }}>Write a short note. SIWEX checks the deadline, slots and your SIWES length for you.</p>
          </div>
          <div className="card soft">
            <div className="step-num">3</div>
            <h3><Building2 size={18} className="icon-inline" /> Get placed</h3>
            <p className="muted small" style={{ margin: 0 }}>Hubs accept or decline from their dashboard. You see your placement week by week.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="band">
          <div className="band-text">
            <div className="eyebrow">For hubs</div>
            <h2>Take on SIWES interns without the paperwork pile</h2>
            <p className="muted">Post openings, review applications with a match score, accept with one click and follow every intern week by week.</p>
            <div className="row" style={{ marginTop: 16 }}>
              <Link href="/sign-up?role=hub" className="btn">List your hub</Link>
              <Link href="/sign-in?demo=hub" className="btn secondary">Try the hub demo</Link>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/team.svg" alt="Hub team reviewing applications" width={480} height={300} />
        </div>
      </section>
    </>
  );
}
