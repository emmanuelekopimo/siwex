import type { Metadata, Viewport } from "next";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: { default: "SIWEX - Find your SIWES placement", template: "%s | SIWEX" },
  description: "Find SIWES placements at tech hubs in Uyo and across Nigeria.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#7d2ae8" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="footer">
          <div className="container row between">
            <span>SIWEX. A 300 level project for finding SIWES placements in Nigerian tech hubs.</span>
            <a href="/api/health">Status</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
