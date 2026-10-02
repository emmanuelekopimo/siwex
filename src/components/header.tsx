import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { Avatar } from "./ui";

export async function Header() {
  const session = await getSession();
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand" aria-label="SIWEX home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="SIWEX" width={143} height={40} />
        </Link>
        <nav className="nav" aria-label="Main">
          <Link href="/hubs" className="navlink">Hubs</Link>
          {session ? (
            <>
              <Link href={session.role === "hub" ? "/hub" : "/student"} className="navlink">Dashboard</Link>
              <span className="who">
                <Avatar name={session.name} size="sm" />
                <span className="who-name">{session.name.split(" ")[0]}</span>
              </span>
              <form action={signOutAction}>
                <button className="btn ghost sm" type="submit" aria-label="Sign out">
                  <LogOut size={16} /> <span className="hide-sm-text">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-up" className="navlink hide-sm">Join</Link>
              <Link href="/sign-in" className="btn sm">Sign in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
