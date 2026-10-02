import type { Metadata } from "next";
import { getDb } from "@/db";
import { HubCard } from "@/components/hub-card";
import { Empty } from "@/components/ui";
import { CITIES, TRACKS } from "@/lib/catalog";
import { searchHubs } from "@/lib/data";
import { getToday } from "@/lib/dates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tech hubs" };

export default async function HubsPage(props: PageProps<"/hubs">) {
  const sp = await props.searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  const filters = { q: pick("q"), city: pick("city"), track: pick("track") };
  const hubs = await searchHubs(getDb(), filters, getToday());

  return (
    <>
      <div className="page-head">
        <div className="container">
          <h1>Tech hubs</h1>
          <p>Hubs taking SIWES students. Search by name, city or track.</p>
        </div>
      </div>
      <div className="container stack">
        <form className="card filters" role="search" key={JSON.stringify(filters)}>
          <input className="q" name="q" defaultValue={filters.q} placeholder="Search by name or keyword" aria-label="Search" />
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
        <p className="muted small" data-testid="result-count">{hubs.length} {hubs.length === 1 ? "hub" : "hubs"} found</p>
        {hubs.length ? (
          <div className="grid">{hubs.map((h) => <HubCard key={h.id} hub={h} />)}</div>
        ) : (
          <div className="card"><Empty>No hubs match these filters. Try another city or track.</Empty></div>
        )}
      </div>
    </>
  );
}
