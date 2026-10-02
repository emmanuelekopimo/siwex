import Link from "next/link";
import { Empty } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="card"><Empty>That page does not exist. <Link href="/hubs">Browse hubs</Link></Empty></div>
    </div>
  );
}
