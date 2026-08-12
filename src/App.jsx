import React, { useState, useMemo } from "react";

// ---------- color math ----------
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function textOn(hex) {
  const [, , l] = hexToHsl(hex);
  return l > 55 ? "#221912" : "#F3EBDA";
}

// ---------- curated bookbinding data ----------
const LEATHERS = [
  { id: "black", name: "Black", no: "01", hex: "#1C1A18" },
  { id: "oxblood", name: "Oxblood", no: "02", hex: "#5B1B22" },
  { id: "chestnut", name: "Chestnut Brown", no: "03", hex: "#6B4226" },
  { id: "cognac", name: "Cognac / Saddle Tan", no: "04", hex: "#A9713E" },
  { id: "navy", name: "Navy", no: "05", hex: "#1B2A41" },
  { id: "forest", name: "Forest Green", no: "06", hex: "#2C4A3E" },
  { id: "grey", name: "Slate Grey", no: "07", hex: "#6E6B66" },
  { id: "plum", name: "Plum", no: "08", hex: "#4A2545" },
  { id: "crimson", name: "Crimson", no: "09", hex: "#8B1E24" },
];

// two curated options per leather, reflecting real bindery conventions
const PAIRINGS = {
  black: [
    { style: "Classic", liner: { n: "Deep Red", h: "#7A1F2B" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Burgundy", h: "#6B1F2A" }, end: { n: "Cream Wove", h: "#EDE4D3" } },
    { style: "Modern", liner: { n: "Charcoal", h: "#3A3A3A" }, thread: { n: "Bone White", h: "#E8E4DC" }, ribbon: { n: "Slate Grey", h: "#6E6B66" }, end: { n: "Grey Marble", h: "#8A8680" } },
  ],
  oxblood: [
    { style: "Classic", liner: { n: "Black", h: "#1C1A18" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Black", h: "#1C1A18" }, end: { n: "Ivory", h: "#F1E9D8" } },
    { style: "Modern", liner: { n: "Navy", h: "#1B2A41" }, thread: { n: "Cream", h: "#EDE4D3" }, ribbon: { n: "Dusty Rose", h: "#B5717A" }, end: { n: "Ivory Marble", h: "#E7D9C4" } },
  ],
  chestnut: [
    { style: "Classic", liner: { n: "Tan", h: "#C9A574" }, thread: { n: "Chocolate", h: "#4A3222" }, ribbon: { n: "Forest Green", h: "#2C4A3E" }, end: { n: "Cream Wove", h: "#EDE4D3" } },
    { style: "Modern", liner: { n: "Rust", h: "#9C4A2E" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Burnt Orange", h: "#B5602E" }, end: { n: "Tan Marble", h: "#D9BD92" } },
  ],
  cognac: [
    { style: "Classic", liner: { n: "Dark Brown", h: "#3E2A1B" }, thread: { n: "Cream", h: "#EDE4D3" }, ribbon: { n: "Navy", h: "#1B2A41" }, end: { n: "Tan Marble", h: "#D9BD92" } },
    { style: "Modern", liner: { n: "Forest Green", h: "#2C4A3E" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Chestnut", h: "#6B4226" }, end: { n: "Ivory", h: "#F1E9D8" } },
  ],
  navy: [
    { style: "Classic", liner: { n: "Cognac", h: "#A9713E" }, thread: { n: "Silver", h: "#C7C4BC" }, ribbon: { n: "Navy", h: "#1B2A41" }, end: { n: "Blue Marble", h: "#A9B7C4" } },
    { style: "Modern", liner: { n: "Cream", h: "#EDE4D3" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Oxblood", h: "#5B1B22" }, end: { n: "Ivory", h: "#F1E9D8" } },
  ],
  forest: [
    { style: "Classic", liner: { n: "Tan", h: "#C9A574" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Forest Green", h: "#2C4A3E" }, end: { n: "Cream Wove", h: "#EDE4D3" } },
    { style: "Modern", liner: { n: "Black", h: "#1C1A18" }, thread: { n: "Bone White", h: "#E8E4DC" }, ribbon: { n: "Oxblood", h: "#5B1B22" }, end: { n: "Grey Marble", h: "#8A8680" } },
  ],
  grey: [
    { style: "Classic", liner: { n: "Black", h: "#1C1A18" }, thread: { n: "Silver", h: "#C7C4BC" }, ribbon: { n: "Crimson", h: "#8B1E24" }, end: { n: "Grey Marble", h: "#8A8680" } },
    { style: "Modern", liner: { n: "Plum", h: "#4A2545" }, thread: { n: "Bone White", h: "#E8E4DC" }, ribbon: { n: "Slate Grey", h: "#6E6B66" }, end: { n: "Ivory", h: "#F1E9D8" } },
  ],
  plum: [
    { style: "Classic", liner: { n: "Cream", h: "#EDE4D3" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Plum", h: "#4A2545" }, end: { n: "Lavender Marble", h: "#C9B8CC" } },
    { style: "Modern", liner: { n: "Black", h: "#1C1A18" }, thread: { n: "Silver", h: "#C7C4BC" }, ribbon: { n: "Dusty Rose", h: "#B5717A" }, end: { n: "Ivory", h: "#F1E9D8" } },
  ],
  crimson: [
    { style: "Classic", liner: { n: "Black", h: "#1C1A18" }, thread: { n: "Antique Gold", h: "#C9A961" }, ribbon: { n: "Black", h: "#1C1A18" }, end: { n: "Cream Wove", h: "#EDE4D3" } },
    { style: "Modern", liner: { n: "Cream", h: "#EDE4D3" }, thread: { n: "Bone White", h: "#E8E4DC" }, ribbon: { n: "Crimson", h: "#8B1E24" }, end: { n: "Ivory Marble", h: "#E7D9C4" } },
  ],
};

// algorithmic fallback for any custom hex not in the curated list
function generateHarmony(hex) {
  const [h, s, l] = hexToHsl(hex);
  const liner = hslToHex(h, Math.max(s - 25, 10), l > 40 ? 15 : 78);
  const thread = hslToHex((h + 40) % 360, Math.min(s + 5, 55), 68);
  const ribbon = hslToHex((h + 180) % 360, Math.min(s + 10, 60), Math.max(Math.min(l, 45), 25));
  const end = hslToHex(h, Math.max(s - 55, 5), 90);
  return [
    {
      style: "Suggested",
      liner: { n: "Coordinating Liner", h: liner },
      thread: { n: "Accent Thread", h: thread },
      ribbon: { n: "Complementary Ribbon", h: ribbon },
      end: { n: "Neutral End Sheet", h: end },
    },
  ];
}

function Swatch({ label, hex, code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(hex).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1100);
      }}
      className="group text-left w-full"
      style={{ fontFamily: "'Inter',sans-serif" }}
    >
      <div
        className="w-full rounded-sm border transition-transform group-hover:-translate-y-0.5"
        style={{ background: hex, height: 56, borderColor: "rgba(0,0,0,0.15)" }}
      />
      <div className="flex items-baseline justify-between mt-1.5">
        <span className="text-[13px]" style={{ color: "#EDE4D3" }}>{label}</span>
        <span
          className="text-[10px] tracking-wide"
          style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#9C8F7C" }}
        >
          {copied ? "copied" : hex.toUpperCase()}
        </span>
      </div>
      {code && (
        <span className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#6f6558" }}>
          {code}
        </span>
      )}
    </button>
  );
}

export default function App() {
  const [selected, setSelected] = useState("black");
  const [customHex, setCustomHex] = useState("#7A5230");
  const [useCustom, setUseCustom] = useState(false);
  const [variant, setVariant] = useState(0);

  const leather = useCustom
    ? { id: "custom", name: "Your Leather", no: "—", hex: customHex }
    : LEATHERS.find((l) => l.id === selected);

  const options = useMemo(() => {
    if (useCustom) return generateHarmony(customHex);
    return PAIRINGS[selected];
  }, [useCustom, customHex, selected]);

  const active = options[Math.min(variant, options.length - 1)];

  return (
    <div
      style={{
        background: "#201812",
        minHeight: "100vh",
        padding: "28px 16px 48px",
        fontFamily: "'Inter',sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="flex items-baseline justify-between border-b pb-4 mb-6" style={{ borderColor: "#3a2f24" }}>
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: "0.14em", color: "#B8935A" }}>
              SPRUCE LEATHER CO. · PALETTE
            </div>
            <h1
              style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 30, color: "#F3EBDA", marginTop: 4 }}
            >
              Leather Pairing Card
            </h1>
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#6f6558" }}>
            No. {leather.no}
          </div>
        </div>

        {/* leather picker */}
        <div className="mb-2" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: "0.1em", color: "#9C8F7C" }}>
          1 · SELECT LEATHER
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {LEATHERS.map((l) => (
            <button
              key={l.id}
              onClick={() => { setUseCustom(false); setSelected(l.id); setVariant(0); }}
              className="rounded-sm p-2 text-left transition"
              style={{
                background: !useCustom && selected === l.id ? "#2B2118" : "transparent",
                border: `1px solid ${!useCustom && selected === l.id ? "#B8935A" : "#3a2f24"}`,
              }}
            >
              <div style={{ background: l.hex, height: 30, borderRadius: 2 }} />
              <div style={{ fontSize: 11, color: "#EDE4D3", marginTop: 6 }}>{l.name}</div>
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            className="rounded-sm p-2 text-left transition"
            style={{
              background: useCustom ? "#2B2118" : "transparent",
              border: `1px solid ${useCustom ? "#B8935A" : "#3a2f24"}`,
            }}
          >
            <div
              style={{
                background: customHex,
                height: 30,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                type="color"
                value={customHex}
                onChange={(e) => { setUseCustom(true); setCustomHex(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
              />
            </div>
            <div style={{ fontSize: 11, color: "#EDE4D3", marginTop: 6 }}>Custom hex</div>
          </button>
        </div>

        {/* style toggle */}
        {options.length > 1 && (
          <div className="flex gap-2 mb-6">
            {options.map((o, i) => (
              <button
                key={o.style}
                onClick={() => setVariant(i)}
                className="px-3 py-1 rounded-full text-[11px]"
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  border: `1px solid ${variant === i ? "#B8935A" : "#3a2f24"}`,
                  color: variant === i ? "#B8935A" : "#9C8F7C",
                }}
              >
                {o.style}
              </button>
            ))}
          </div>
        )}

        {/* palette card */}
        <div
          className="rounded-md p-5"
          style={{ background: "#2B2118", border: "1px solid #3a2f24" }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <Swatch label="Leather" hex={leather.hex} code="cover" />
            <Swatch label={active.liner.n} hex={active.liner.h} code="liner" />
            <Swatch label={active.thread.n} hex={active.thread.h} code="thread" />
            <Swatch label={active.ribbon.n} hex={active.ribbon.h} code="ribbon" />
            <Swatch label={active.end.n} hex={active.end.h} code="end sheet" />
          </div>

          {/* mockup */}
          <div className="flex justify-center pt-2 pb-1" style={{ borderTop: "1px solid #3a2f24" }}>
            <svg width="150" height="200" viewBox="0 0 150 200">
              <rect x="0" y="0" width="150" height="200" rx="4" fill={leather.hex} />
              <rect x="6" y="6" width="12" height="188" fill={active.end.h} opacity="0.9" />
              <rect x="18" y="6" width="6" height="188" fill={active.liner.h} />
              <rect x="60" y="185" width="4" height="15" fill={active.ribbon.h} />
              {[...Array(6)].map((_, i) => (
                <line key={i} x1="34" y1={14 + i * 30} x2="140" y2={14 + i * 30} stroke={active.thread.h} strokeWidth="1.5" />
              ))}
            </svg>
          </div>
          <div className="text-center text-[10px]" style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#6f6558" }}>
            cover · pastedown · thread · ribbon marker
          </div>
        </div>

        <p className="mt-5 text-[12px] leading-relaxed" style={{ color: "#9C8F7C" }}>
          Tap any swatch to copy its hex. Curated pairings follow common bindery
          conventions — gold or cream against dark leathers, tone-on-tone for a
          quieter look. Pick a custom hex for anything outside the standard
          leather colors and it'll generate a coordinating set from color theory.
        </p>
      </div>
    </div>
  );
}
