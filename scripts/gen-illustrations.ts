// Generates the flat illustrations in public/illustrations/.
// Run: npx tsx scripts/gen-illustrations.ts
// Pure SVG, no external images, so nothing depends on an image CDN.
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../public/illustrations");

const C = {
  ink: "#000000",
  g1: "#f3f3f3",
  g2: "#e8e8e8",
  g3: "#cbcbcb",
  g4: "#757575",
  white: "#ffffff",
  blue: "#276ef1",
  green: "#05944f",
  yellow: "#ffc043",
  red: "#e11900",
  orange: "#ff6937",
  purple: "#7356bf",
  teal: "#0e8a7f",
  brown: "#99644c",
  skin1: "#8d5524",
  skin2: "#5c3a21",
  skin3: "#a86b3c",
  hair: "#141414",
};

type P = { x: number; y: number; skin: string; shirt: string; pants?: string; hair?: "short" | "bun" | "puff" | "cap"; capColor?: string };

const svg = (w: number, h: number, body: string, label: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">\n${body}\n</svg>\n`;

function hairShape(x: number, cy: number, kind: P["hair"], capColor = C.ink) {
  switch (kind) {
    case "bun":
      return `<circle cx="${x}" cy="${cy - 15}" r="7" fill="${C.hair}"/><path d="M${x - 13} ${cy} a13 13 0 0 1 26 0 q-6 -6 -13 -6 q-7 0 -13 6z" fill="${C.hair}"/>`;
    case "puff":
      return `<path d="M${x - 16} ${cy + 2} q-3 -18 10 -21 q6 -6 13 -1 q13 2 9 22 q-4 -9 -16 -10 q-11 1 -16 10z" fill="${C.hair}"/>`;
    case "cap":
      return `<path d="M${x - 13} ${cy - 2} a13 13 0 0 1 26 0z" fill="${capColor}"/><rect x="${x}" y="${cy - 4}" width="20" height="4" rx="2" fill="${capColor}"/>`;
    default:
      return `<path d="M${x - 13} ${cy} a13 13 0 0 1 26 0 q-4 -5 -13 -5 q-9 0 -13 5z" fill="${C.hair}"/>`;
  }
}

/** Standing person, feet on y. arm: "down" | "point" | "hold" */
function standing(p: P & { arm?: "down" | "point" | "hold"; prop?: string }) {
  const { x, y, skin, shirt, pants = C.ink } = p;
  const headY = y - 112;
  let arms = "";
  if (p.arm === "point") {
    arms = `<path d="M${x + 14} ${y - 92} l26 -24" stroke="${shirt}" stroke-width="10" stroke-linecap="round"/><circle cx="${x + 42}" cy="${y - 118}" r="5" fill="${skin}"/>
      <path d="M${x - 14} ${y - 90} l-6 34" stroke="${shirt}" stroke-width="10" stroke-linecap="round"/><circle cx="${x - 20}" cy="${y - 52}" r="5" fill="${skin}"/>`;
  } else if (p.arm === "hold") {
    arms = `<path d="M${x + 14} ${y - 90} l10 22 l-10 6" stroke="${shirt}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M${x - 14} ${y - 90} l-4 22 l18 6" stroke="${shirt}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="${x + 12}" cy="${y - 62}" r="5" fill="${skin}"/>${p.prop ?? ""}`;
  } else {
    arms = `<path d="M${x + 15} ${y - 90} l5 34" stroke="${shirt}" stroke-width="10" stroke-linecap="round"/><circle cx="${x + 20}" cy="${y - 52}" r="5" fill="${skin}"/>
      <path d="M${x - 15} ${y - 90} l-5 34" stroke="${shirt}" stroke-width="10" stroke-linecap="round"/><circle cx="${x - 20}" cy="${y - 52}" r="5" fill="${skin}"/>`;
  }
  return `<g>
    <rect x="${x - 13}" y="${y - 52}" width="11" height="50" rx="4" fill="${pants}"/>
    <rect x="${x + 2}" y="${y - 52}" width="11" height="50" rx="4" fill="${pants}"/>
    <rect x="${x - 16}" y="${y - 5}" width="15" height="6" rx="3" fill="${C.ink}"/>
    <rect x="${x + 1}" y="${y - 5}" width="15" height="6" rx="3" fill="${C.ink}"/>
    <rect x="${x - 4}" y="${headY + 10}" width="8" height="10" fill="${skin}"/>
    <path d="M${x - 19} ${y - 48} v-38 q0 -12 12 -12 h14 q12 0 12 12 v38z" fill="${shirt}"/>
    ${arms}
    <circle cx="${x}" cy="${headY}" r="13" fill="${skin}"/>
    ${hairShape(x, headY, p.hair, p.capColor)}
  </g>`;
}

/** Person sitting on a chair, facing right, seat height around y-50, feet on y. */
function sitting(p: P & { reach?: number }) {
  const { x, y, skin, shirt, pants = C.ink } = p;
  const reach = p.reach ?? 34;
  const seatY = y - 48;
  const headY = seatY - 66;
  return `<g>
    <rect x="${x - 22}" y="${seatY + 6}" width="40" height="6" rx="3" fill="${C.g4}"/>
    <rect x="${x - 24}" y="${seatY - 40}" width="6" height="52" rx="3" fill="${C.g4}"/>
    <rect x="${x - 3}" y="${seatY + 12}" width="5" height="${y - seatY - 14}" fill="${C.g4}"/>
    <rect x="${x - 16}" y="${y - 4}" width="34" height="4" rx="2" fill="${C.g4}"/>
    <path d="M${x - 10} ${seatY} h36 v10 h-36z" fill="${pants}"/>
    <rect x="${x + 18}" y="${seatY + 2}" width="10" height="${y - seatY - 4}" rx="4" fill="${pants}"/>
    <rect x="${x + 16}" y="${y - 5}" width="18" height="6" rx="3" fill="${C.ink}"/>
    <path d="M${x - 14} ${seatY + 4} v-40 q0 -12 12 -12 h10 q12 0 12 12 v40z" fill="${shirt}"/>
    <rect x="${x - 3}" y="${headY + 10}" width="8" height="10" fill="${skin}"/>
    <path d="M${x + 4} ${seatY - 36} l${reach * 0.55} 14 l${reach * 0.45} -2" stroke="${shirt}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="${x + 4 + reach}" cy="${seatY - 24}" r="5" fill="${skin}"/>
    <circle cx="${x + 1}" cy="${headY}" r="13" fill="${skin}"/>
    ${hairShape(x + 1, headY, p.hair, p.capColor)}
  </g>`;
}

const desk = (x: number, y: number, w: number, color = C.ink) =>
  `<rect x="${x}" y="${y}" width="${w}" height="8" rx="2" fill="${color}"/><rect x="${x + 8}" y="${y + 8}" width="6" height="${232 - y}" fill="${color}"/><rect x="${x + w - 14}" y="${y + 8}" width="6" height="${232 - y}" fill="${color}"/>`;

const plant = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="-10" cy="-38" rx="9" ry="20" fill="${C.green}" transform="rotate(-25 -10 -38)"/><ellipse cx="10" cy="-40" rx="9" ry="22" fill="#037a40" transform="rotate(22 10 -40)"/><ellipse cx="0" cy="-48" rx="8" ry="22" fill="${C.green}"/><path d="M-14 -18 h28 l-4 18 h-20z" fill="${C.brown}"/></g>`;

// Floor is drawn by the page (CSS) so it can span the full width of any container.
const ground = (..._args: number[]) => (_args.length ? "" : "");
const wall = (..._size: number[]) => (_size.length ? "" : ""); // transparent: the page supplies the tinted background

const monitor = (x: number, y: number, w: number, h: number, inner: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${C.ink}"/><rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="3" fill="${C.white}"/>${inner}<rect x="${x + w / 2 - 5}" y="${y + h}" width="10" height="14" fill="${C.ink}"/><rect x="${x + w / 2 - 22}" y="${y + h + 12}" width="44" height="5" rx="2" fill="${C.ink}"/>`;

function codeLines(x: number, y: number) {
  const rows = [[22, C.blue, 40], [14, C.purple, 60], [30, C.green, 30], [14, C.orange, 50], [22, C.blue, 36], [38, C.g3, 44]];
  return rows.map(([ind, col, len], i) => `<rect x="${x + (ind as number)}" y="${y + i * 11}" width="${len}" height="5" rx="2.5" fill="${col}"/>`).join("");
}

const scenes: Record<string, string> = {};

scenes.software = svg(400, 260, `
  ${wall(400, 260)}
  <rect x="236" y="34" width="120" height="84" rx="6" fill="${C.white}"/><rect x="236" y="34" width="120" height="84" rx="6" fill="none" stroke="${C.g3}" stroke-width="4"/>
  <path d="M296 34v84M236 76h120" stroke="${C.g3}" stroke-width="4"/>
  <rect x="40" y="56" width="86" height="6" rx="3" fill="${C.ink}"/>
  <rect x="48" y="30" width="12" height="26" fill="${C.blue}"/><rect x="62" y="36" width="10" height="20" fill="${C.yellow}"/><rect x="74" y="28" width="12" height="28" fill="${C.red}"/><rect x="92" y="40" width="22" height="16" rx="3" fill="${C.green}"/>
  ${ground(400)}
  ${desk(130, 160, 200)}
  ${monitor(196, 90, 96, 64, codeLines(206, 102))}
  <rect x="300" y="146" width="12" height="14" rx="2" fill="${C.orange}"/>
  ${sitting({ x: 136, y: 232, skin: C.skin1, shirt: C.blue, hair: "short", reach: 62 })}
  <rect x="178" y="152" width="44" height="6" rx="2" fill="${C.g4}"/>
  ${plant(360, 232)}
`, "Developer coding at a desk");

scenes.uiux = svg(400, 260, `
  ${wall(400, 260)}
  <rect x="150" y="36" width="210" height="140" rx="6" fill="${C.white}" stroke="${C.ink}" stroke-width="5"/>
  <rect x="166" y="52" width="60" height="108" rx="6" fill="none" stroke="${C.g4}" stroke-width="3"/>
  <rect x="174" y="62" width="44" height="26" rx="3" fill="${C.blue}"/><rect x="174" y="96" width="44" height="6" rx="3" fill="${C.g3}"/><rect x="174" y="108" width="30" height="6" rx="3" fill="${C.g3}"/><rect x="174" y="136" width="44" height="14" rx="7" fill="${C.ink}"/>
  <path d="M232 106 h22" stroke="${C.ink}" stroke-width="3" stroke-dasharray="5 4"/><path d="M250 100 l8 6 -8 6" fill="none" stroke="${C.ink}" stroke-width="3"/>
  <rect x="262" y="52" width="60" height="108" rx="6" fill="none" stroke="${C.g4}" stroke-width="3"/>
  <circle cx="292" cy="80" r="14" fill="${C.yellow}"/><rect x="270" y="104" width="44" height="6" rx="3" fill="${C.g3}"/><rect x="270" y="116" width="44" height="6" rx="3" fill="${C.g3}"/><rect x="270" y="136" width="44" height="14" rx="7" fill="${C.green}"/>
  <rect x="330" y="56" width="22" height="22" fill="${C.yellow}" transform="rotate(6 341 67)"/><rect x="330" y="88" width="22" height="22" fill="#ffd98a" transform="rotate(-5 341 99)"/><rect x="330" y="120" width="22" height="22" fill="${C.orange}" opacity=".8" transform="rotate(4 341 131)"/>
  ${ground(400)}
  ${standing({ x: 106, y: 232, skin: C.skin2, shirt: C.yellow, pants: C.ink, hair: "puff", arm: "point" })}
  ${plant(40, 232, 0.9)}
`, "Designer presenting wireframes");

scenes.data = svg(400, 260, `
  ${wall(400, 260)}
  <rect x="120" y="28" width="250" height="140" rx="8" fill="${C.ink}"/>
  <rect x="132" y="40" width="226" height="116" rx="4" fill="${C.white}"/>
  ${[30, 52, 40, 70, 58, 86, 74].map((h, i) => `<rect x="${148 + i * 18}" y="${144 - h}" width="11" height="${h}" rx="2" fill="${i === 5 ? C.blue : C.g3}"/>`).join("")}
  <polyline points="282,128 300,112 316,118 334,92 350,80" fill="none" stroke="${C.green}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="350" cy="80" r="5" fill="${C.green}"/>
  <rect x="282" y="52" width="60" height="8" rx="4" fill="${C.ink}"/><rect x="282" y="64" width="36" height="6" rx="3" fill="${C.g3}"/>
  ${ground(400)}
  ${desk(40, 176, 130, C.g4)}
  <path d="M96 176 l10 -30 h46 l-6 30z" fill="${C.ink}"/><rect x="88" y="172" width="70" height="5" rx="2" fill="${C.g3}"/>
  ${sitting({ x: 60, y: 232, skin: C.skin3, shirt: C.green, hair: "bun", reach: 44 })}
  ${plant(372, 232, 0.8)}
`, "Analyst reading a dashboard");

scenes.marketing = svg(400, 260, `
  ${wall(400, 260)}
  <rect x="206" y="22" width="110" height="196" rx="18" fill="${C.ink}"/>
  <rect x="214" y="34" width="94" height="172" rx="10" fill="${C.white}"/>
  <circle cx="230" cy="50" r="8" fill="${C.orange}"/><rect x="244" y="46" width="44" height="6" rx="3" fill="${C.ink}"/>
  <rect x="222" y="66" width="78" height="64" rx="6" fill="${C.yellow}"/><circle cx="262" cy="98" r="18" fill="${C.white}" opacity=".8"/>
  <path d="M226 146 q6 -8 12 0 q6 -8 12 0 l-12 12z" fill="${C.red}"/><rect x="256" y="144" width="40" height="6" rx="3" fill="${C.g3}"/>
  <rect x="222" y="166" width="78" height="6" rx="3" fill="${C.g3}"/><rect x="222" y="178" width="52" height="6" rx="3" fill="${C.g3}"/>
  <path d="M330 70 h46 a8 8 0 0 1 8 8 v22 a8 8 0 0 1 -8 8 h-30 l-12 10 v-10 h-4 a8 8 0 0 1 -8 -8 v-22 a8 8 0 0 1 8 -8z" fill="${C.blue}"/>
  <rect x="340" y="82" width="34" height="5" rx="2.5" fill="${C.white}"/><rect x="340" y="92" width="22" height="5" rx="2.5" fill="${C.white}"/>
  <path d="M150 52 h40 a8 8 0 0 1 8 8 v16 a8 8 0 0 1 -8 8 h-26 l-10 8 v-8 h-4 a8 8 0 0 1 -8 -8 v-16 a8 8 0 0 1 8 -8z" fill="${C.green}"/>
  <path d="M164 66 l6 6 l12 -12" stroke="${C.white}" stroke-width="4" fill="none" stroke-linecap="round"/>
  ${ground(400)}
  ${standing({ x: 120, y: 232, skin: C.skin1, shirt: C.orange, pants: "#2b2b2b", hair: "bun", arm: "hold", prop: `<rect x="112" y="${232 - 82}" width="16" height="26" rx="3" fill="${C.ink}"/>` })}
  ${plant(42, 232, 0.9)}
`, "Marketer posting on social media");

scenes.networking = svg(400, 260, `
  ${wall(400, 260)}
  ${[200, 290].map((x) => `<rect x="${x}" y="40" width="80" height="192" rx="6" fill="${C.ink}"/>${[0, 1, 2, 3, 4, 5].map((r) => `<rect x="${x + 8}" y="${52 + r * 28}" width="64" height="20" rx="3" fill="#2b2b2b"/><circle cx="${x + 18}" cy="${62 + r * 28}" r="3" fill="${r % 2 ? C.green : C.blue}"/><circle cx="${x + 28}" cy="${62 + r * 28}" r="3" fill="${r === 3 ? C.yellow : C.green}"/><rect x="${x + 38}" y="${60 + r * 28}" width="28" height="4" rx="2" fill="${C.g4}"/>`).join("")}`).join("")}
  <path d="M280 70 q20 30 0 60" stroke="${C.blue}" stroke-width="4" fill="none"/><path d="M280 100 q18 40 10 90" stroke="${C.yellow}" stroke-width="4" fill="none"/>
  ${ground(400)}
  ${standing({ x: 120, y: 232, skin: C.skin2, shirt: C.blue, pants: C.ink, hair: "short", arm: "hold", prop: `<rect x="104" y="${232 - 84}" width="30" height="22" rx="3" fill="${C.ink}"/><rect x="107" y="${232 - 81}" width="24" height="16" rx="2" fill="${C.green}"/>` })}
  ${plant(40, 232, 0.8)}
`, "Network engineer checking servers");

scenes.hardware = svg(400, 260, `
  ${wall(400, 260)}
  <rect x="40" y="50" width="120" height="70" rx="6" fill="${C.white}" stroke="${C.g3}" stroke-width="4"/>
  <path d="M56 100 l20 -24 l18 14 l22 -30 l28 40" fill="none" stroke="${C.blue}" stroke-width="4" stroke-linejoin="round"/>
  <rect x="300" y="40" width="64" height="6" rx="3" fill="${C.ink}"/><rect x="308" y="20" width="16" height="20" rx="2" fill="${C.orange}"/><circle cx="344" cy="30" r="10" fill="${C.yellow}"/>
  ${ground(400)}
  ${desk(150, 168, 220, C.brown)}
  <rect x="196" y="146" width="96" height="22" rx="3" fill="${C.green}"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${206 + i * 22}" y="151" width="14" height="12" rx="1" fill="${C.ink}"/>`).join("")}
  <path d="M300 160 l40 -36" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><path d="M296 164 l6 -6" stroke="${C.yellow}" stroke-width="6" stroke-linecap="round"/>
  <path d="M340 124 q20 -10 22 30 q2 20 -10 14" stroke="${C.g4}" stroke-width="3" fill="none"/>
  ${sitting({ x: 140, y: 232, skin: C.skin3, shirt: C.ink, pants: "#3b3b3b", hair: "cap", capColor: C.yellow, reach: 62 })}
`, "Engineer soldering a circuit board");

scenes.product = svg(400, 260, `
  ${wall(400, 260)}
  <rect x="40" y="26" width="320" height="130" rx="6" fill="${C.white}" stroke="${C.ink}" stroke-width="5"/>
  ${[0, 1, 2].map((c) => `<rect x="${58 + c * 102}" y="40" width="40" height="6" rx="3" fill="${C.ink}"/>${[0, 1, 2].slice(0, 3 - (c === 2 ? 1 : 0)).map((r) => `<rect x="${58 + c * 102 + (r % 2) * 40}" y="${56 + r * 30}" width="34" height="26" fill="${[C.yellow, "#ffd98a", C.blue, C.green, C.orange][(c * 3 + r) % 5]}" transform="rotate(${(r - 1) * 3} ${75 + c * 102} ${69 + r * 30})"/>`).join("")}`).join("")}
  <path d="M142 40 v104 M244 40 v104" stroke="${C.g3}" stroke-width="3"/>
  ${ground(400)}
  ${standing({ x: 150, y: 232, skin: C.skin1, shirt: C.green, pants: C.ink, hair: "short", arm: "point" })}
  ${standing({ x: 270, y: 232, skin: C.skin2, shirt: C.purple, pants: "#2b2b2b", hair: "puff", arm: "down" })}
`, "Product team planning on a board");

scenes.team = svg(480, 300, `
  <rect width="480" height="300" fill="${C.g1}"/>
  <rect x="300" y="30" width="150" height="96" rx="6" fill="${C.ink}"/><rect x="308" y="38" width="134" height="80" rx="3" fill="${C.white}"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${322 + i * 28}" y="${104 - (i + 1) * 14}" width="16" height="${(i + 1) * 14}" rx="2" fill="${i === 3 ? C.green : C.g3}"/>`).join("")}
  <rect x="0" y="262" width="480" height="38" fill="${C.g2}"/>
  <rect x="130" y="186" width="200" height="10" rx="3" fill="${C.ink}"/><rect x="150" y="196" width="8" height="66" fill="${C.ink}"/><rect x="302" y="196" width="8" height="66" fill="${C.ink}"/>
  <path d="M196 186 l8 -24 h38 l-5 24z" fill="${C.g4}"/>
  ${sitting({ x: 104, y: 262, skin: C.skin1, shirt: C.blue, hair: "bun", reach: 50 }).replace("<g>", "<g>")}
  <g transform="translate(720 0) scale(-1 1)">${sitting({ x: 356, y: 262, skin: C.skin2, shirt: C.yellow, hair: "short", reach: 40 })}</g>
  ${standing({ x: 410, y: 262, skin: C.skin3, shirt: C.ink, pants: "#3b3b3b", hair: "puff", arm: "point" })}
`, "Hub team reviewing applications");

scenes.hero = svg(560, 440, `
  <rect width="560" height="440" rx="0" fill="#ececec"/>
  <circle cx="460" cy="90" r="40" fill="${C.yellow}"/>
  <rect x="20" y="150" width="70" height="220" fill="${C.g3}"/><rect x="96" y="110" width="60" height="260" fill="#d6d6d6"/>
  <rect x="420" y="170" width="120" height="200" fill="${C.g3}"/>
  ${[0, 1, 2, 3, 4, 5].map((r) => `<rect x="30" y="${166 + r * 30}" width="14" height="16" fill="${C.white}" opacity=".7"/><rect x="58" y="${166 + r * 30}" width="14" height="16" fill="${C.white}" opacity=".7"/>`).join("")}
  ${[0, 1, 2, 3, 4, 5, 6].map((r) => `<rect x="108" y="${126 + r * 32}" width="36" height="14" fill="${C.white}" opacity=".7"/>`).join("")}
  <rect x="170" y="70" width="230" height="300" fill="${C.ink}"/>
  ${[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${186 + c * 52}" y="${100 + r * 40}" width="40" height="28" rx="2" fill="${(r + c) % 3 === 0 ? C.yellow : "#3a3a3a"}"/>`).join("")).join("")}
  <rect x="250" y="320" width="70" height="50" fill="#2b2b2b"/><rect x="283" y="320" width="4" height="50" fill="${C.ink}"/>
  <rect x="216" y="40" width="138" height="30" rx="4" fill="${C.white}"/><rect x="230" y="50" width="70" height="10" rx="5" fill="${C.ink}"/><circle cx="330" cy="55" r="8" fill="${C.green}"/>
  ${[0, 1, 2, 3, 4].map((r) => `<rect x="432" y="${186 + r * 34}" width="96" height="16" fill="${C.white}" opacity=".7"/>`).join("")}
  <rect x="0" y="370" width="560" height="70" fill="#2b2b2b"/>
  ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${20 + i * 80}" y="402" width="44" height="6" rx="3" fill="${C.white}"/>`).join("")}
  <rect x="0" y="360" width="560" height="10" fill="${C.g3}"/>
  <path d="M470 270 c-26 0 -44 20 -44 42 c0 30 44 66 44 66 s44 -36 44 -66 c0 -22 -18 -42 -44 -42z" fill="${C.ink}"/><circle cx="470" cy="312" r="15" fill="${C.white}"/>
  <g transform="translate(0 128)">
    ${standing({ x: 110, y: 232, skin: C.skin1, shirt: C.blue, pants: C.ink, hair: "short", arm: "down" })}
    <rect x="80" y="${232 - 100}" width="16" height="40" rx="5" fill="${C.yellow}"/>
    ${standing({ x: 160, y: 232, skin: C.skin2, shirt: C.green, pants: "#2b2b2b", hair: "puff", arm: "hold", prop: `<rect x="152" y="${232 - 82}" width="16" height="26" rx="3" fill="${C.ink}"/>` })}
  </g>
`, "Students arriving at a tech hub");

const empty = svg(200, 140, `
  <ellipse cx="100" cy="126" rx="70" ry="8" fill="${C.g2}"/>
  <rect x="45" y="30" width="110" height="80" rx="10" fill="${C.white}" stroke="${C.g3}" stroke-width="3"/>
  <rect x="60" y="48" width="60" height="8" rx="4" fill="${C.g2}"/><rect x="60" y="64" width="80" height="8" rx="4" fill="${C.g2}"/><rect x="60" y="80" width="44" height="8" rx="4" fill="${C.g2}"/>
  <circle cx="150" cy="34" r="16" fill="${C.ink}"/><path d="M144 34 h12 M150 28 v12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
`, "Nothing here yet");

fs.mkdirSync(OUT, { recursive: true });
for (const [name, content] of Object.entries(scenes)) fs.writeFileSync(path.join(OUT, `${name}.svg`), content);
fs.writeFileSync(path.resolve(OUT, "../empty.svg"), empty);
console.log("Wrote", Object.keys(scenes).length, "illustrations to", OUT);
