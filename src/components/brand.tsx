// Visual building blocks: SIWEX logo, generated hub logos, covers and city skylines.
// Everything is inline SVG or a local file in public/, so no image CDN is needed.

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: string) {
  let x = hash(seed) || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

/** SIWEX mark: a route from a dot to a map pin, inside a rounded square. */
export function LogoMark({ size = 32, inverted = false }: { size?: number; inverted?: boolean }) {
  const bg = inverted ? "#fff" : "#000";
  const fg = inverted ? "#000" : "#fff";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill={bg} />
      <circle cx="17" cy="47" r="5" fill={fg} />
      <path d="M17 47 C 17 36, 30 40, 33 31" stroke={fg} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M42 12c-6.6 0-12 5.1-12 11.4C30 32 42 43 42 43s12-11 12-19.6C54 17.1 48.6 12 42 12z" fill={fg} />
      <circle cx="42" cy="23.5" r="4.5" fill={bg} />
    </svg>
  );
}

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <>
      <LogoMark inverted={inverted} />
      <span>SIWEX</span>
    </>
  );
}

const MARKS = [
  // circle and square
  (fg: string) => <><circle cx="27" cy="30" r="13" fill={fg} /><rect x="34" y="34" width="16" height="16" fill={fg} opacity=".55" /></>,
  // two bars
  (fg: string) => <><rect x="16" y="14" width="10" height="36" rx="5" fill={fg} /><rect x="32" y="22" width="10" height="28" rx="5" fill={fg} opacity=".6" /><circle cx="47" cy="17" r="5" fill={fg} /></>,
  // triangle
  (fg: string) => <><path d="M32 13 L52 49 H12 Z" fill={fg} /><circle cx="32" cy="38" r="6" fill="currentColor" /></>,
  // ring
  (fg: string) => <><circle cx="32" cy="32" r="17" fill="none" stroke={fg} strokeWidth="8" /><circle cx="32" cy="32" r="4" fill={fg} /></>,
  // grid
  (fg: string) => <><rect x="15" y="15" width="15" height="15" rx="3" fill={fg} /><rect x="34" y="15" width="15" height="15" rx="3" fill={fg} opacity=".55" /><rect x="15" y="34" width="15" height="15" rx="3" fill={fg} opacity=".55" /><rect x="34" y="34" width="15" height="15" rx="8" fill={fg} /></>,
  // arch
  (fg: string) => <><path d="M14 48 V32 a18 18 0 0 1 36 0 V48 H40 V32 a8 8 0 0 0 -16 0 V48 Z" fill={fg} /></>,
  // diamond
  (fg: string) => <><rect x="20" y="20" width="24" height="24" transform="rotate(45 32 32)" fill={fg} /><rect x="27" y="27" width="10" height="10" transform="rotate(45 32 32)" fill="currentColor" /></>,
  // wave
  (fg: string) => <><path d="M12 26 q10 -10 20 0 t20 0" stroke={fg} strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M12 42 q10 -10 20 0 t20 0" stroke={fg} strokeWidth="7" fill="none" strokeLinecap="round" opacity=".6" /></>,
];

/** A distinct geometric logo for each hub, coloured with the hub's brand colour. */
export function HubLogo({ name, color, size }: { name: string; color: string; size?: "lg" }) {
  const mark = MARKS[hash(name) % MARKS.length];
  return (
    <svg className={`hub-logo ${size ?? ""}`} viewBox="0 0 64 64" role="img" aria-label={`${name} logo`} style={{ color }}>
      <rect width="64" height="64" rx="14" fill={color} />
      {mark("#fff")}
    </svg>
  );
}

const TRACK_SCENES = ["software", "uiux", "data", "marketing", "networking", "hardware", "product"];

/** Cover scene for a hub: spread across all scenes so neighbouring cards differ. */
export function hubScene(slug: string): string {
  return TRACK_SCENES[hash(slug) % TRACK_SCENES.length];
}

export function sceneFor(track: string): string {
  return `/illustrations/${TRACK_SCENES.includes(track) ? track : "software"}.svg`;
}

/** Light tint of a hub colour for cover backgrounds. */
export function tint(color: string, amount = 0.16): string {
  const n = parseInt(color.replace("#", ""), 16);
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount));
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

export function Cover({ track, color, className = "cover", alt = "" }: { track: string; color: string; className?: string; alt?: string }) {
  return (
    <div className={className} style={{ backgroundColor: tint(color) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sceneFor(track)} alt={alt} width={400} height={260} />
    </div>
  );
}

const CITY_COLORS: Record<string, string> = {
  Uyo: "#05944f",
  Eket: "#0e8a7f",
  Lagos: "#276ef1",
  Abuja: "#7356bf",
  "Port Harcourt": "#ff6937",
  Ibadan: "#c27c0e",
  Kaduna: "#99644c",
  Enugu: "#e11900",
  Ilorin: "#1f7a8c",
  Calabar: "#d6457a",
};

/** Procedural skyline, different for every city name. */
export function Skyline({ city }: { city: string }) {
  const r = rng(city);
  const color = CITY_COLORS[city] ?? "#276ef1";
  const buildings: React.ReactNode[] = [];
  let x = -6;
  let i = 0;
  while (x < 400) {
    const w = 26 + Math.floor(r() * 40);
    const h = 50 + Math.floor(r() * 110);
    const y = 200 - h;
    const shade = r() > 0.5 ? "#111" : "#262626";
    buildings.push(<rect key={`b${i}`} x={x} y={y} width={w} height={h} fill={shade} />);
    for (let wy = y + 10; wy < 186; wy += 16) {
      for (let wx = x + 6; wx < x + w - 8; wx += 11) {
        if (r() > 0.55) buildings.push(<rect key={`w${i}-${wx}-${wy}`} x={wx} y={wy} width="5" height="7" fill={r() > 0.7 ? "#ffc043" : "#3d3d3d"} />);
      }
    }
    if (r() > 0.75) buildings.push(<rect key={`a${i}`} x={x + w / 2 - 1} y={y - 18} width="2" height="18" fill="#111" />);
    x += w + 2;
    i++;
  }
  return (
    <svg viewBox="0 0 400 200" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="200" fill={color} />
      <circle cx={60 + r() * 280} cy={46} r="22" fill="#fff" opacity=".25" />
      {buildings}
      <rect y="150" width="400" height="50" fill="url(#fade)" />
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".75" />
        </linearGradient>
      </defs>
    </svg>
  );
}
