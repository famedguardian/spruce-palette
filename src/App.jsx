import React, { useState, useMemo, useEffect } from "react";
import Bible3D from "./Bible3D.jsx";

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

// algorithmic fallback for any leather without a curated entry (custom leathers included)
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

const STORAGE_KEY = "spruce-custom-leathers";

function loadCustomLeathers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveCustomLeathers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — fail silently, list stays in memory for this session
  }
}

// ---------- combined strip: colors touching, no gaps — read-only reference + copy ----------
function CombinedStrip({ leather, display, overrides, onReset }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const copy = (hex, key) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 1000);
  };

  const items = [
    { key: "leather", label: "Leather", h: leather.hex },
    { key: "liner", label: "Liner", h: display.liner.h },
    { key: "thread", label: "Thread", h: display.thread.h },
    { key: "ribbon", label: "Ribbon", h: display.ribbon.h },
    { key: "end", label: "End sheet", h: display.end.h },
  ];

  return (
    <div className="flex w-full rounded-sm overflow-hidden" style={{ border: "1px solid #3a2f24", height: 110 }}>
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => copy(it.h, it.key)}
          className="flex-1 flex flex-col justify-end items-start p-2 relative"
          style={{ background: it.h, minWidth: 0 }}
        >
          <span className="text-[10px] font-medium tracking-wide truncate w-full text-left" style={{ fontFamily: "'IBM Plex Mono',monospace", color: textOn(it.h) }}>
            {it.label}
          </span>
          <span className="text-[9px] truncate w-full text-left opacity-90" style={{ fontFamily: "'IBM Plex Mono',monospace", color: textOn(it.h) }}>
            {copiedIdx === it.key ? "copied" : it.h.toUpperCase()}
          </span>
          {overrides[it.key] && (
            <span
              onClick={(e) => { e.stopPropagation(); onReset(it.key); }}
              title="Reset to suggested color"
              className="absolute top-1 right-1"
              style={{ fontSize: 12, lineHeight: 1, padding: "2px 5px", borderRadius: 3, color: textOn(it.h), background: "rgba(0,0,0,0.25)" }}
            >
              ↺
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [customLeathers, setCustomLeathers] = useState([]);
  const [selected, setSelected] = useState("black");
  const [useCustomId, setUseCustomId] = useState(null); // id of a saved custom leather in use
  const [variant, setVariant] = useState(0);
  const [addingOpen, setAddingOpen] = useState(false);
  const [pebbled, setPebbled] = useState(true);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#7A5230");

  useEffect(() => {
    setCustomLeathers(loadCustomLeathers());
  }, []);

  const leather = useCustomId
    ? customLeathers.find((c) => c.id === useCustomId) || LEATHERS[0]
    : LEATHERS.find((l) => l.id === selected);

  const options = useMemo(() => {
    if (useCustomId) return generateHarmony(leather.hex);
    return PAIRINGS[selected];
  }, [useCustomId, leather, selected]);

  const active = options[Math.min(variant, options.length - 1)];

  // per-swatch manual overrides — let you click any supporting color and change
  // it without losing the curated pairing. Reset whenever the base pairing changes.
  const [overrides, setOverrides] = useState({});
  const pairingKey = `${leather.hex}-${variant}`;
  useEffect(() => {
    setOverrides({});
  }, [pairingKey]);

  const display = useMemo(() => ({
    liner: overrides.liner ? { n: "Custom", h: overrides.liner } : active.liner,
    thread: overrides.thread ? { n: "Custom", h: overrides.thread } : active.thread,
    ribbon: overrides.ribbon ? { n: "Custom", h: overrides.ribbon } : active.ribbon,
    end: overrides.end ? { n: "Custom", h: overrides.end } : active.end,
  }), [active, overrides]);

  function setOverride(key, hex) {
    setOverrides((prev) => ({ ...prev, [key]: hex }));
  }
  function resetOverride(key) {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function addLeather() {
    const name = newName.trim() || "My Leather";
    const entry = { id: `custom-${Date.now()}`, name, hex: newHex };
    const next = [...customLeathers, entry];
    setCustomLeathers(next);
    saveCustomLeathers(next);
    setUseCustomId(entry.id);
    setVariant(0);
    setAddingOpen(false);
    setNewName("");
  }

  function removeLeather(id, e) {
    e.stopPropagation();
    const next = customLeathers.filter((c) => c.id !== id);
    setCustomLeathers(next);
    saveCustomLeathers(next);
    if (useCustomId === id) {
      setUseCustomId(null);
      setSelected("black");
    }
  }

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
            No. {leather.no || "—"}
          </div>
        </div>

        {/* leather picker */}
        <div className="mb-2" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: "0.1em", color: "#9C8F7C" }}>
          1 · SELECT LEATHER
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
          {LEATHERS.map((l) => (
            <button
              key={l.id}
              onClick={() => { setUseCustomId(null); setSelected(l.id); setVariant(0); }}
              className="rounded-sm p-2 text-left transition"
              style={{
                background: !useCustomId && selected === l.id ? "#2B2118" : "transparent",
                border: `1px solid ${!useCustomId && selected === l.id ? "#B8935A" : "#3a2f24"}`,
              }}
            >
              <div style={{ background: l.hex, height: 30, borderRadius: 2 }} />
              <div style={{ fontSize: 11, color: "#EDE4D3", marginTop: 6 }}>{l.name}</div>
            </button>
          ))}

          {customLeathers.map((l) => (
            <button
              key={l.id}
              onClick={() => { setUseCustomId(l.id); setVariant(0); }}
              className="rounded-sm p-2 text-left transition relative group"
              style={{
                background: useCustomId === l.id ? "#2B2118" : "transparent",
                border: `1px solid ${useCustomId === l.id ? "#B8935A" : "#3a2f24"}`,
              }}
            >
              <div style={{ background: l.hex, height: 30, borderRadius: 2 }} />
              <div style={{ fontSize: 11, color: "#EDE4D3", marginTop: 6 }} className="truncate">{l.name}</div>
              <span
                onClick={(e) => removeLeather(l.id, e)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition"
                style={{ fontSize: 12, color: "#B8935A", lineHeight: 1, padding: "2px 5px" }}
                title="Remove"
              >
                ×
              </span>
            </button>
          ))}

          <button
            onClick={() => setAddingOpen(true)}
            className="rounded-sm p-2 text-left transition flex flex-col items-center justify-center"
            style={{ border: "1px dashed #4a3d2e", minHeight: 66 }}
          >
            <span style={{ fontSize: 18, color: "#B8935A", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 10, color: "#9C8F7C", marginTop: 4 }}>Add leather</span>
          </button>
        </div>

        {/* add-leather inline form */}
        {addingOpen && (
          <div className="rounded-sm p-3 mb-4 flex flex-wrap items-center gap-3" style={{ background: "#2B2118", border: "1px solid #3a2f24" }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Leather name (e.g. Whiskey)"
              className="px-2 py-1.5 rounded-sm text-[13px] flex-1 min-w-[160px]"
              style={{ background: "#201812", border: "1px solid #3a2f24", color: "#EDE4D3", outline: "none" }}
            />
            <div className="flex items-center gap-2">
              <div style={{ width: 32, height: 32, borderRadius: 4, background: newHex, border: "1px solid #3a2f24", position: "relative", overflow: "hidden" }}>
                <input
                  type="color"
                  value={newHex}
                  onChange={(e) => setNewHex(e.target.value)}
                  style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }}
                />
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#9C8F7C" }}>{newHex.toUpperCase()}</span>
            </div>
            <button
              onClick={addLeather}
              className="px-3 py-1.5 rounded-full text-[11px]"
              style={{ fontFamily: "'IBM Plex Mono',monospace", background: "#B8935A", color: "#201812" }}
            >
              Save
            </button>
            <button
              onClick={() => { setAddingOpen(false); setNewName(""); }}
              className="px-3 py-1.5 rounded-full text-[11px]"
              style={{ fontFamily: "'IBM Plex Mono',monospace", border: "1px solid #3a2f24", color: "#9C8F7C" }}
            >
              Cancel
            </button>
          </div>
        )}

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

        {/* result view */}
        <div className="flex items-center justify-between mb-2">
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: "0.1em", color: "#9C8F7C" }}>
            2 · DRAG TO ROTATE · CLICK TO TRY COLORS
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" checked={pebbled} onChange={(e) => setPebbled(e.target.checked)} style={{ accentColor: "#B8935A" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#9C8F7C" }}>Pebbled grain</span>
          </label>
        </div>
        <div className="rounded-md p-5 mb-4" style={{ background: "#2B2118", border: "1px solid #3a2f24" }}>
          <Bible3D leather={leather} display={display} onChange={setOverride} pebbled={pebbled} />
        </div>

        <div className="mb-2" style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: "0.1em", color: "#9C8F7C" }}>
          3 · REFERENCE STRIP
        </div>
        <CombinedStrip
          leather={leather}
          display={display}
          overrides={overrides}
          onReset={resetOverride}
        />
        <p className="mt-2 mb-6 text-[11px]" style={{ color: "#6f6558", fontFamily: "'IBM Plex Mono',monospace" }}>
          click any band to copy its hex · ↺ appears once you've changed a color, to reset it
        </p>

        {/* detail list */}
        <div className="rounded-md p-5" style={{ background: "#2B2118", border: "1px solid #3a2f24" }}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: leather.name, hex: leather.hex, code: "cover" },
              { label: display.liner.n, hex: display.liner.h, code: "liner" },
              { label: display.thread.n, hex: display.thread.h, code: "thread" },
              { label: display.ribbon.n, hex: display.ribbon.h, code: "ribbon" },
              { label: display.end.n, hex: display.end.h, code: "end sheet" },
            ].map((s) => (
              <div key={s.code}>
                <div style={{ fontSize: 12, color: "#EDE4D3" }}>{s.label}</div>
                <div style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: "#6f6558" }}>{s.code} · {s.hex.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[12px] leading-relaxed" style={{ color: "#9C8F7C" }}>
          Curated pairings follow common bindery conventions — gold or cream
          against dark leathers, tone-on-tone for a quieter look. Drag the
          model above to spin it, hover to see what a region controls, and
          click the gilt edge, title, corner, or ribbon to try any color
          against your chosen leather. Add your own leather colors with
          "Add leather" — they're saved on this device.
        </p>
      </div>
    </div>
  );
}
