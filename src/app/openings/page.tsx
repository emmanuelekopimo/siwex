import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/db";
import { OpeningRow } from "@/components/opening-row";
import { Empty } from "@/components/ui";
import { CITIES, TRACKS } from "@/lib/catalog";
import { listOpenings } from "@/lib/data";
import { getToday } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Openings" };

export default async function OpeningsPage(props: PageProps<"/openings">) {
  const sp = await props.searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const filters = { q: pick("q"), city: pick("city"), track: pick("track"), status: pick("status") === "all" ? ("all" as const) : ("live" as const) };
  const today = getToday();
  const list = await listOpenings(getDb(), filters, today);
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(filters.q && { q: filters.q }), ...(filters.city && { city: filters.city }), ...(filters.status === "all" && { status: "all" }), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    const s = p.toString();
    return s ? `/openings?${s}` : "/openings";
  };

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>SIWES openings</h1>
          <p>Every live role across all hubs, with the closest deadlines first.</p>
        </div>
      </div>
      <div className="container stack">
        <form className="card filters" role="search" key={JSON.stringify(filters)}>
          <input className="q" name="q" defaultValue={filters.q} placeholder="Search roles or hubs" aria-label="Search" />
          <select name="city" defaultValue={filters.city} aria-label="City">
            <option value="">All cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="track" defaultValue={filters.track} aria-label="Track">
            <option value="">All tracks</option>
            {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button className="btn" type="submit">Filter</button>
        </form>
        <div className="chip-row" aria-label="Tracks">
          <Link href={qs({ track: "" })} className={`chip-link ${filters.track ? "" : "active"}`}>All tracks</Link>
          {TRACKS.map((t) => (
            <Link key={t.id} href={qs({ track: t.id })} className={`chip-link ${filters.track === t.id ? "active" : ""}`}>{t.label}</Link>
          ))}
        </div>
        <div className="row between">
          <p className="muted small" style={{ margin: 0 }} data-testid="opening-count">{list.length} {list.length === 1 ? "opening" : "openings"}</p>
          <Link className="small" href={qs({ status: filters.status === "all" ? "" : "all", track: filters.track })}>
            {filters.status === "all" ? "Show live only" : "Include closed and full"}
          </Link>
        </div>
        {list.length ? (
          <div className="card" style={{ padding: "4px 20px" }}>
            <div className="list">{list.map((o) => <OpeningRow key={o.id} o={o} hub={o.hub} today={today} />)}</div>
          </div>
        ) : (
          <div className="card"><Empty>No openings match these filters.</Empty></div>
        )}
      </div>
    </>
  );
}
