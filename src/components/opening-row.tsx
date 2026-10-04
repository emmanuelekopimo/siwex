import Link from "next/link";
import { CalendarClock, Clock, MapPin, Users, Wallet } from "lucide-react";
import { trackLabel } from "@/lib/catalog";
import type { Hub } from "@/db/schema";
import type { OpeningView } from "@/lib/data";
import { formatDate, relativeDays } from "@/lib/dates";
import { formatStipend } from "@/lib/rules";
import { HubLogo, OpeningBadge } from "./ui";

/** One opening in a list, linking to its hub page. */
export function OpeningRow({ o, hub, today }: { o: OpeningView; hub: Hub; today: string }) {
  return (
    <Link href={`/hubs/${hub.slug}`} className="list-item opening-card" data-testid="opening-row">
      <HubLogo name={hub.name} color={hub.color} />
      <div className="grow">
        <div className="row between" style={{ gap: 8 }}>
          <span className="bold">{o.title}</span>
          <OpeningBadge status={o.status} />
        </div>
        <div className="muted small">{hub.name} - {trackLabel(o.track)}</div>
        <div className="meta" style={{ marginTop: 6 }}>
          <span><MapPin size={14} /> {hub.city}</span>
          <span><Users size={14} /> {o.slotsLeft} of {o.slots} slots</span>
          <span><Clock size={14} /> {o.durationWeeks} weeks</span>
          <span><Wallet size={14} /> {formatStipend(o.stipendNaira)}</span>
          <span><CalendarClock size={14} /> Apply by {formatDate(o.deadline)} ({relativeDays(o.deadline, today)})</span>
        </div>
      </div>
    </Link>
  );
}
