import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { Header } from "@/components/header";
import { LogoMark } from "@/components/brand";

export const metadata: Metadata = {
  title: { default: "SIWEX - Find your SIWES placement", template: "%s | SIWEX" },
  description: "Find SIWES placements at tech hubs in Uyo and across Nigeria.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                  <LogoMark inverted />
                  <strong style={{ fontSize: "1.2rem", letterSpacing: "-0.03em" }}>SIWEX</strong>
                </div>
                <p style={{ color: "#cfcfcf", maxWidth: "28em" }}>
                  SIWES placements at tech hubs in Uyo, Lagos, Abuja, Port Harcourt and more. Built as a 300 level project.
                </p>
              </div>
              <div>
                <h4>Students</h4>
                <ul>
                  <li><Link href="/openings">Browse openings</Link></li>
                  <li><Link href="/hubs">Find a hub</Link></li>
                  <li><Link href="/sign-up">Create an account</Link></li>
                </ul>
              </div>
              <div>
                <h4>Hubs</h4>
                <ul>
                  <li><Link href="/sign-up?role=hub">List your hub</Link></li>
                  <li><Link href="/sign-in?demo=hub">Hub sign in</Link></li>
                </ul>
              </div>
              <div>
                <h4>Cities</h4>
                <ul>
                  {["Uyo", "Lagos", "Abuja", "Port Harcourt"].map((c) => (
                    <li key={c}><Link href={`/hubs?city=${encodeURIComponent(c)}`}>{c}</Link></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="footer-bottom row between">
              <span>SIWEX. Sample openings and students are demo data.</span>
              <Link href="/api/health">System status</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
