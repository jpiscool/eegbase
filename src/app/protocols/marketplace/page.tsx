"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Download, Star, Layers, Search, Plus, Check } from "lucide-react";

// ── Data ─────────────────────────────────────────────────────────────────────

const MARKETPLACE_PROTOCOLS = [
  { id: "m1", name: "Alpha/Theta Depth Training", category: "Relaxation", device: "muse", sessions: 20, avgReward: 74, downloads: 847, description: "Deep relaxation protocol targeting 8–13 Hz alpha with eyes-closed theta training. Suited for stress, anxiety, and peak performance.", author: "Dr. Sarah Chen", tags: ["alpha", "theta", "relaxation"] },
  { id: "m2", name: "SMR Training for ADHD", category: "Focus", device: "muse", sessions: 30, avgReward: 68, downloads: 1204, description: "Sensorimotor rhythm (12–15 Hz) uptraining combined with theta inhibit at Cz. Evidence-based ADHD protocol.", author: "Dr. Michael Torres", tags: ["smr", "adhd", "focus"] },
  { id: "m3", name: "Prefrontal Oxygenation Boost", category: "Cognitive", device: "mendi", sessions: 25, avgReward: 71, downloads: 623, description: "fNIRS-based prefrontal cortex upregulation. Improves working memory, executive function, and emotional regulation.", author: "NeuroLab UK", tags: ["fnirs", "prefrontal", "cognitive"] },
  { id: "m4", name: "Slow Cortical Potential Training", category: "Seizure Management", device: "muse", sessions: 40, avgReward: 65, downloads: 312, description: "SCP training for epilepsy management. Requires medical supervision. Based on Tübingen protocol.", author: "Clinical NFB Institute", tags: ["scp", "epilepsy", "advanced"] },
  { id: "m5", name: "Dual-Modal Calm Protocol", category: "Anxiety", device: "mendi", sessions: 20, avgReward: 76, downloads: 934, description: "Combined fNIRS prefrontal + alpha EEG biofeedback for anxiety reduction. 20-minute sessions.", author: "Mindful Neuro", tags: ["anxiety", "dual-modal", "calm"] },
  { id: "m6", name: "Beta Enhancement for Alertness", category: "Focus", device: "muse", sessions: 15, avgReward: 69, downloads: 445, description: "Low-beta (15–18 Hz) uptraining for daytime alertness and fatigue management. Ideal for shift workers.", author: "SleepBetter Clinic", tags: ["beta", "alertness", "fatigue"] },
  { id: "m7", name: "Trauma & PTSD Alpha Training", category: "Trauma", device: "muse", sessions: 35, avgReward: 67, downloads: 289, description: "Right-hemisphere alpha asymmetry correction for PTSD and trauma survivors. Requires trained clinician.", author: "Trauma Recovery Institute", tags: ["ptsd", "trauma", "alpha"] },
  { id: "m8", name: "Peak Performance Athletic", category: "Performance", device: "muse", sessions: 10, avgReward: 82, downloads: 1567, description: "Pre-competition mental priming. Alpha theta ratio optimization for flow state induction.", author: "SportsMind Lab", tags: ["performance", "sport", "flow"] },
  { id: "m9", name: "Sleep Onset Protocol", category: "Sleep", device: "mendi", sessions: 14, avgReward: 73, downloads: 722, description: "Evening fNIRS downregulation protocol. Reduces prefrontal activity before bedtime to improve sleep onset.", author: "SleepBetter Clinic", tags: ["sleep", "fnirs", "evening"] },
  { id: "m10", name: "Neurodevelopmental Support", category: "Pediatric", device: "muse", sessions: 40, avgReward: 64, downloads: 198, description: "Low-intensity alpha training for children 8–14. Gentle protocol with shorter sessions and positive reinforcement.", author: "ChildNeuro Center", tags: ["pediatric", "children", "gentle"] },
  { id: "m11", name: "Pain Management NFB", category: "Pain", device: "mendi", sessions: 24, avgReward: 70, downloads: 167, description: "Chronic pain management via prefrontal oxygenation and alpha analgesia. Research-backed approach.", author: "Pain Research Lab", tags: ["pain", "chronic", "analgesia"] },
  { id: "m12", name: "Executive Function Training", category: "Cognitive", device: "muse", sessions: 20, avgReward: 72, downloads: 534, description: "Frontal lobe theta-alpha ratio training for planning, inhibition, and working memory. Office and academic settings.", author: "CognitiveEdge", tags: ["executive", "frontal", "cognitive"] },
];

const CATEGORIES = ["All", "Focus", "Relaxation", "Anxiety", "Cognitive", "Performance", "Sleep", "Trauma", "Pediatric", "Pain"];
const DEVICES = ["All", "Muse (EEG)", "Mendi (fNIRS)"];
const SORTS = ["Most Downloaded", "Highest Rated", "Newest"];

// ── Sub-components ────────────────────────────────────────────────────────────

function DeviceBadge({ device }: { device: string }) {
  const isMuse = device === "muse";
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: isMuse ? "var(--brand-subtle)" : "var(--success-subtle)",
        color: isMuse ? "var(--brand)" : "var(--success)",
      }}
    >
      {isMuse ? "Muse EEG" : "Mendi fNIRS"}
    </span>
  );
}

function ProtocolCard({ protocol }: { protocol: typeof MARKETPLACE_PROTOCOLS[number] }) {
  const [added, setAdded] = useState(false);

  return (
    <div
      className="rounded-xl border flex flex-col gap-4 p-5 transition-all"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {protocol.name}
          </p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            by {protocol.author}
          </p>
        </div>
        <DeviceBadge device={protocol.device} />
      </div>

      {/* Category */}
      <span
        className="self-start text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          background: "var(--surface-sunken)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {protocol.category}
      </span>

      {/* Description */}
      <p
        className="text-sm leading-relaxed flex-1"
        style={{
          color: "var(--text-secondary)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {protocol.description}
      </p>

      {/* Stats row */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        <span className="flex items-center gap-1">
          <Download size={11} />
          {protocol.downloads.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Star size={11} />
          {protocol.avgReward}
        </span>
        <span className="flex items-center gap-1">
          <Layers size={11} />
          {protocol.sessions} sessions
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {protocol.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--surface-sunken)",
              color: "var(--text-tertiary)",
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => setAdded(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        style={
          added
            ? { background: "var(--success-subtle)", color: "var(--success)" }
            : {
                background: "var(--brand)",
                color: "var(--text-inverse)",
                boxShadow: "0 1px 4px color-mix(in srgb, var(--brand) 35%, transparent)",
              }
        }
      >
        {added ? (
          <>
            <Check size={14} />
            Added to Clinic
          </>
        ) : (
          <>
            <Plus size={14} />
            Add to Clinic
          </>
        )}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDevice, setActiveDevice] = useState("All");
  const [sort, setSort] = useState("Most Downloaded");

  const filtered = useMemo(() => {
    let list = [...MARKETPLACE_PROTOCOLS];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q)) ||
          p.author.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (activeDevice === "Muse (EEG)") {
      list = list.filter((p) => p.device === "muse");
    } else if (activeDevice === "Mendi (fNIRS)") {
      list = list.filter((p) => p.device === "mendi");
    }

    if (sort === "Most Downloaded") list.sort((a, b) => b.downloads - a.downloads);
    else if (sort === "Highest Rated") list.sort((a, b) => b.avgReward - a.avgReward);
    // "Newest" preserves original array order (id order)

    return list;
  }, [search, activeCategory, activeDevice, sort]);

  return (
    <div className="max-w-5xl space-y-8 pb-12">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Protocol Marketplace
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Browse community-contributed neurofeedback protocols. Add any to your clinic with one click.
        </p>
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-tertiary)" }}
          />
          <input
            type="text"
            placeholder="Search protocols, tags, authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
            style={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg outline-none"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            color: "var(--text-secondary)",
          }}
        >
          {SORTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Category pills ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Category
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={
                activeCategory === cat
                  ? { background: "var(--brand)", color: "var(--text-inverse)" }
                  : {
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Device filter ── */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Device
        </p>
        <div className="flex flex-wrap gap-2">
          {DEVICES.map((dev) => (
            <button
              key={dev}
              onClick={() => setActiveDevice(dev)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={
                activeDevice === dev
                  ? { background: "var(--brand)", color: "var(--text-inverse)" }
                  : {
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }
              }
            >
              {dev}
            </button>
          ))}
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Showing {filtered.length} of {MARKETPLACE_PROTOCOLS.length} protocols
      </p>

      {/* ── Protocol grid ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProtocolCard key={p.id} protocol={p} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl border p-10 text-center"
          style={{
            background: "var(--surface-raised)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No protocols match your filters.
          </p>
        </div>
      )}

      {/* ── Contribute CTA ── */}
      <div
        className="rounded-2xl border p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{
          background: "var(--surface-overlay)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div>
          <p
            className="text-base font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Contribute a Protocol
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Share your evidence-based protocols with the EEGBase community. Help clinicians
            worldwide discover effective approaches.
          </p>
        </div>
        <Link
          href="/contact?role=research"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
          style={{
            background: "var(--brand)",
            color: "var(--text-inverse)",
            boxShadow: "0 1px 4px color-mix(in srgb, var(--brand) 35%, transparent)",
          }}
        >
          <Plus size={15} />
          Submit a Protocol
        </Link>
      </div>

    </div>
  );
}
