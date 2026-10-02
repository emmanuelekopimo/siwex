import Link from "next/link";
import { Building2, ClipboardCheck, Search } from "lucide-react";
import { getDb } from "@/db";
import { HubCard } from "@/components/hub-card";
import { platformStats, searchHubs } from "@/lib/data";
import { getToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const today = getToday();
  const [stats, hubs] = await Promise.all([platformStats(db, today), searchHubs(db, {}, today)]);
  const featured = [...hubs].sort((a, b) => b.openSlots - a.openSlots).slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div>
            <h1>Find your SIWES placement in a tech hub near you</h1>
            <p className="lead">
              Browse hubs in Uyo and across Nigeria, see which roles still have slots, apply in one step and track every
              reply in one place.
            </p>
            <form className="searchbar" action="/hubs" role="search">
              <input name="q" placeholder="Search hubs, e.g. RootHub or design" aria-label="Search hubs" />
              <button className="btn" type="submit"><Search size={16} /> Search</button>
            </form>
            <div className="stat-pills">
              <span className="stat-pill" data-testid="stat-hubs">{stats.hubs} hubs</span>
              <span className="stat-pill" data-testid="stat-slots">{stats.openSlots} open slots</span>
              <span className="stat-pill">{stats.placed} students placed</span>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-art" src="/hero.svg" alt="" width={480} height={400} />
        </div>
      </section>

      <section className="section container">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Hubs with the most open slots</h2>
          <Link href="/hubs" className="btn secondary sm">See all hubs</Link>
        </div>
        <div className="grid">
          {featured.map((h) => <HubCard key={h.id} hub={h} />)}
        </div>
      </section>

      <section className="section container">
        <h2>How it works</h2>
        <div className="steps">
          <div className="card">
            <div className="step-num">1</div>
            <h3><Search size={18} className="icon-inline" /> Find a hub</h3>
            <p className="muted small">Filter by city and track. Every role shows slots left, stipend and deadline.</p>
          </div>
          <div className="card">
            <div className="step-num">2</div>
            <h3><ClipboardCheck size={18} className="icon-inline" /> Apply once</h3>
            <p className="muted small">Write a short note. SIWEX checks the deadline, slots and your SIWES length for you.</p>
          </div>
          <div className="card">
            <div className="step-num">3</div>
            <h3><Building2 size={18} className="icon-inline" /> Get placed</h3>
            <p className="muted small">Hubs accept or decline from their dashboard. You see your placement week by week.</p>
          </div>
        </div>
      </section>
    </>
  );
}
