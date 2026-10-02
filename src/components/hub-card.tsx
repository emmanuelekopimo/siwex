import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { trackLabel } from "@/lib/catalog";
import type { HubCard as HubCardData } from "@/lib/data";
import { HubLogo } from "./ui";

export function HubCard({ hub }: { hub: HubCardData }) {
  return (
    <Link href={`/hubs/${hub.slug}`} className="card hub-card" data-testid="hub-card">
      <div className="row">
        <HubLogo name={hub.name} color={hub.color} />
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0 }}>{hub.name}</h3>
          <div className="muted small row" style={{ gap: 4 }}>
            <MapPin size={14} /> {hub.city}, {hub.state}
            {hub.addressVerified && <BadgeCheck size={14} color="#12805c" aria-label="Address verified" />}
          </div>
        </div>
      </div>
      <p className="muted small clamp-3" style={{ margin: 0 }}>{hub.about}</p>
      <div className="chips">
        {hub.tracks.map((t) => (
          <span className="chip" key={t}>{trackLabel(t)}</span>
        ))}
      </div>
      <div className="row between small">
        <span className="bold">
          {hub.openOpenings > 0 ? `${hub.openOpenings} open ${hub.openOpenings === 1 ? "role" : "roles"}` : "No open roles"}
        </span>
        <span className={`badge ${hub.openSlots > 0 ? "open" : "closed"}`}>{hub.openSlots} slots left</span>
      </div>
    </Link>
  );
}
