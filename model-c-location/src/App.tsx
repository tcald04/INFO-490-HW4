import { useEffect, useState } from "react";

type Kind = "Restaurant" | "Attraction" | "Video" | "Link" | "Note";
type Ref = { id: string; title: string; kind: Kind; neighborhood?: string; address?: string; description: string; x?: number; y?: number; day?: number; saved?: boolean };
const days = ["Mon, Jun 8", "Tue, Jun 9", "Wed, Jun 10", "Thu, Jun 11"];
const initial: Ref[] = [
  { id: "louvre", title: "Musée du Louvre", kind: "Attraction", neighborhood: "Louvre · 1st", address: "Rue de Rivoli, 75001", description: "A morning among the greats. Entry is reserved for 10:00.", x: 48, y: 48, day: 1 },
  { id: "cafe", title: "Café de Flore", kind: "Restaurant", neighborhood: "Saint-Germain · 6th", address: "172 Boulevard Saint-Germain", description: "Classic café terrace for a long, unhurried lunch.", x: 39, y: 65 },
  { id: "eiffel", title: "Eiffel Tower", kind: "Attraction", neighborhood: "Champ de Mars · 7th", address: "Av. Gustave Eiffel, 75007", description: "Golden-hour views across the city. Keep the afternoon open.", x: 17, y: 56, day: 3 },
  { id: "bouillon", title: "Bouillon Chartier", kind: "Restaurant", neighborhood: "Grands Boulevards · 9th", address: "7 Rue du Faubourg Montmartre", description: "Belle Époque dining room and a famously lively atmosphere.", x: 55, y: 29 },
  { id: "marche", title: "Marché des Enfants Rouges", kind: "Restaurant", neighborhood: "Le Marais · 3rd", address: "39 Rue de Bretagne, 75003", description: "The city’s oldest covered market, perfect for an easy lunch.", x: 66, y: 36 },
  { id: "montmartre", title: "Sacré-Cœur & Montmartre", kind: "Attraction", neighborhood: "Montmartre · 18th", address: "35 Rue du Chevalier de la Barre", description: "A wandering afternoon through the hilltop lanes.", x: 69, y: 13 },
  { id: "walk", title: "A local’s guide to Paris", kind: "Video", description: "Saved video · 12 min · Neighborhood walks and tiny cafés" },
  { id: "list", title: "The little bookshops list", kind: "Link", description: "Saved link · 8 independent bookshops to browse" },
  { id: "note", title: "Leave room to wander", kind: "Note", description: "Personal note · Keep one afternoon completely open." },
];
const filters = ["All", "Restaurant", "Attraction", "Video", "Link", "Note"] as const;
const icon: Record<Kind, string> = { Restaurant: "✳", Attraction: "⌂", Video: "▷", Link: "↗", Note: "▤" };

export default function App() {
  const [refs, setRefs] = useState(initial);
  const [selectedId, setSelectedId] = useState("cafe");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [toast, setToast] = useState("");
  const [day, setDay] = useState("1");
  const [showSchedule, setShowSchedule] = useState(false);
  const selected = refs.find((r) => r.id === selectedId)!;
  const visible = refs.filter((r) => filter === "All" || r.kind === filter);
  const places = refs.filter((r) => r.x !== undefined);

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 3000); return () => clearTimeout(timer); }, [toast]);

  function schedule(ref: Ref) {
    const n = Number(day);
    setRefs((old) => old.map((r) => r.id === ref.id ? { ...r, day: n, saved: true } : r));
    setShowSchedule(false);
    setToast(`${ref.title} added to ${days[n - 1]} · anytime`);
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Folio home"><span className="brand-mark">f.</span><span>folio</span></a>
      <div className="trip-heading"><span className="eyebrow">YOUR TRIP</span><h1>Paris <span className="heading-dot">·</span> early summer</h1></div>
      <div className="trip-dates"><span className="date-icon">▦</span><span>Jun 8 — 11, 2026</span><span className="date-days">4 days</span></div>
      <button className="avatar" aria-label="Profile">A</button>
    </header>

    <main id="top" className="main-layout">
      <section className="map-column" aria-label="Map and selected place">
        <div className="section-head map-head"><div><span className="eyebrow">YOUR PLACES</span><h2>A little closer to Paris</h2></div><span className="map-count"><i /> {places.length} saved places</span></div>
        <div className="map-card">
          <div className="map-caption"><span className="map-caption-mark">✳</span> PARIS <span className="map-caption-divider">/</span> ÎLE-DE-FRANCE</div>
          <svg className="map-art" viewBox="0 0 760 540" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustrated map of central Paris with saved place pins">
            <defs><pattern id="blocks" width="58" height="43" patternUnits="userSpaceOnUse"><rect x="4" y="4" width="46" height="30" rx="2" fill="#f3efe4" stroke="#e7e1d4" strokeWidth="1"/><path d="M8 10h38M8 14h28" stroke="#e8e2d6" strokeWidth="1"/></pattern></defs>
            <rect width="760" height="540" fill="#f8f6ed"/><path d="M-20 322C90 294 138 349 240 328s139-60 230-39 158 39 310-8v93c-117 33-199-13-294 12s-149 69-246 43S75 396-20 424Z" fill="#cfe1dd"/>
            <path d="M-20 322C90 294 138 349 240 328s139-60 230-39 158 39 310-8" fill="none" stroke="#a9cac3" strokeWidth="3"/>
            <path d="M-20 78H780V522H-20Z" fill="url(#blocks)" opacity=".83"/>
            <g fill="none" stroke="#fffdf7" strokeWidth="11" opacity=".98"><path d="M28 162C178 180 205 110 359 138s234 18 389-27"/><path d="M31 249c110-30 212-7 309 20s250 8 405-19"/><path d="M72 76c31 118 35 249 75 423"/><path d="M244 57c-5 135 36 255 39 455"/><path d="M415 53c-30 129-3 283 21 436"/><path d="M580 66c-53 112-39 276 8 421"/><path d="M30 450c117-70 235-75 346-28s225 56 365-14"/></g>
            <g fill="none" stroke="#dfd8c9" strokeWidth="1.5"><path d="M28 162C178 180 205 110 359 138s234 18 389-27"/><path d="M31 249c110-30 212-7 309 20s250 8 405-19"/><path d="M72 76c31 118 35 249 75 423"/><path d="M244 57c-5 135 36 255 39 455"/><path d="M415 53c-30 129-3 283 21 436"/><path d="M580 66c-53 112-39 276 8 421"/><path d="M30 450c117-70 235-75 346-28s225 56 365-14"/></g>
            <g className="district-labels"><text x="78" y="125">MONTMARTRE</text><text x="263" y="212">LE MARAIS</text><text x="418" y="189">RÉPUBLIQUE</text><text x="344" y="302">LOUVRE</text><text x="168" y="392">SAINT-GERMAIN</text><text x="68" y="289">TROCADERO</text><text x="486" y="407">BASTILLE</text><text x="467" y="107">CANAL SAINT-MARTIN</text></g>
            <g className="map-labels"><text x="351" y="356">La Seine</text><text x="352" y="232">Opéra</text><text x="119" y="454">Invalides</text><text x="564" y="235">Place des Vosges</text></g>
            <g className="map-parks"><path d="M91 193l20-12 24 8 5 18-18 14-26-6z"/><path d="M301 379l21-12 27 3 9 15-13 21-26 2-18-13z"/><path d="M496 331l17-12 26 5 13 19-17 14-26-4z"/></g>
            {places.map((r) => <g key={r.id} className={`pin-wrap ${r.id === selectedId ? "pin-selected" : ""}`} transform={`translate(${r.x! * 7.6} ${r.y! * 5.4})`} onClick={() => setSelectedId(r.id)} role="button" tabIndex={0} aria-label={`${r.title}${r.day ? `, ${days[r.day - 1]}` : ""}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedId(r.id); }}>
              <circle className="pin-halo" r="21"/><path className="pin-shape" d="M0 18c-5-8-13-15-13-23a13 13 0 1 1 26 0C13 3 5 10 0 18Z"/><circle className="pin-inner" cy="-5" r="4"/><text className="pin-emoji" y="-2.5">{r.kind === "Restaurant" ? "✳" : "⌂"}</text>{r.day && <circle className="pin-scheduled" cx="12" cy="-15" r="5"/>}
            </g>)}
          </svg>
          <div className="map-legend"><span><i className="legend-pin"/> Saved place</span><span><i className="legend-dot"/> On your plan</span></div>
          <div className="map-attribution">A hand-drawn map for finding your way</div>
        </div>

        <article className="detail-card">
          <div className="detail-image"><span className="detail-image-top">A PLACE TO REMEMBER</span><span className="detail-image-symbol">{icon[selected.kind]}</span><span className="detail-image-bottom">{selected.neighborhood?.split(" · ")[0] ?? "A PARIS NOTE"}</span></div>
          <div className="detail-content">
            <div className="detail-kicker"><span>{icon[selected.kind]} &nbsp;{selected.kind}</span>{selected.day ? <span className="scheduled-badge"><i/> Day {selected.day} · anytime</span> : <span className="unscheduled-badge">SAVED FOR LATER</span>}</div>
            <h3>{selected.title}</h3>
            {selected.neighborhood && <p className="detail-neighborhood">{selected.neighborhood}</p>}
            {selected.address && <p className="detail-address">⌖ &nbsp;{selected.address}</p>}
            <p className="detail-description">{selected.description}</p>
            {selected.x !== undefined && !selected.day && <div className="schedule-row">
              {showSchedule ? <><label className="day-select-label" htmlFor="day">ADD TO DAY</label><select id="day" value={day} onChange={(e) => setDay(e.target.value)}>{days.map((d, i) => <option key={d} value={i + 1}>Day {i + 1} · {d}</option>)}</select><button className="schedule-button" onClick={() => schedule(selected)}>Add day <span>→</span></button><button className="cancel-button" aria-label="Cancel" onClick={() => setShowSchedule(false)}>×</button></> : <button className="schedule-button" onClick={() => setShowSchedule(true)}>＋ &nbsp; Add to itinerary <span>→</span></button>}
            </div>}
            {selected.day && <div className="scheduled-note"><span className="check-circle">✓</span><span>On your itinerary <b>{days[selected.day - 1]}</b><small>Anytime · no time set</small></span><button aria-label="Change itinerary day" onClick={() => { setDay(String(selected.day)); setShowSchedule(true); }}>Change day</button>{showSchedule && <span className="change-day"><select aria-label="Move to day" value={day} onChange={(e) => setDay(e.target.value)}>{days.map((d, i) => <option key={d} value={i + 1}>Day {i + 1} · {d}</option>)}</select><button onClick={() => schedule(selected)}>Save</button></span>}</div>}
            {selected.x === undefined && <div className="no-location-note"><span>◎</span>Saved reference · no map location</div>}
          </div>
        </article>
      </section>

      <aside className="collection" aria-label="Saved references">
        <div className="collection-heading"><div><span className="eyebrow">THE GOOD FINDS</span><h2>Saved references <span className="ref-total">{refs.length}</span></h2></div><button className="more-button" aria-label="More options">···</button></div>
        <p className="collection-subtitle">Little things you’ve found along the way.</p>
        <div className="filter-row" aria-label="Filter references">{filters.map((f) => <button key={f} className={filter === f ? "filter active" : "filter"} onClick={() => setFilter(f)}>{f === "All" ? "All" : f === "Restaurant" ? "Food" : f === "Attraction" ? "Places" : f === "Video" ? "Videos" : f === "Link" ? "Links" : "Notes"}</button>)}</div>
        <div className="ref-list">{visible.map((r) => <button className={`ref-row ${r.id === selectedId ? "ref-selected" : ""}`} key={r.id} onClick={() => { setSelectedId(r.id); setShowSchedule(false); }}>
          <span className={`ref-icon ${r.x === undefined ? "nongeo-icon" : ""} ${r.kind.toLowerCase()}`}>{icon[r.kind]}</span><span className="ref-copy"><span className="ref-title">{r.title}</span><span className="ref-meta">{r.neighborhood ?? r.kind}{r.neighborhood && <><span className="meta-dot">·</span>{r.kind}</>}{r.x === undefined && <span className="no-pin-label"> · No location</span>}</span></span><span className="ref-status">{r.day ? <span className="mini-day"><i/>D{r.day}</span> : <span className="ref-chevron">↗</span>}</span>
        </button>)}</div>
        <div className="collection-foot"><span className="plus-small">＋</span><span>Keep collecting, no rush</span><span className="foot-count">{refs.length} saved</span></div>
        <div className="trip-plan"><div className="trip-plan-head"><span className="eyebrow">A LOOSE PLAN</span><span>{refs.filter((r) => r.day).length} places scheduled</span></div><div className="day-strip">{days.map((d, i) => <button key={d} className={`day-chip ${i === 0 ? "day-current" : ""}`} onClick={() => setToast(`${refs.filter((r) => r.day === i + 1).length} places on ${d}`)}><span>DAY {i + 1}</span><b>{d.split(", ")[0]}</b><i>{refs.filter((r) => r.day === i + 1).length || "—"}</i></button>)}</div></div>
      </aside>
    </main>
    <footer className="page-footer"><span>✳ &nbsp;Plans can change. That’s the point.</span><span>PARIS, FRANCE &nbsp;·&nbsp; 48°51′N 2°21′E</span></footer>
    {toast && <div className="toast" role="status"><span className="toast-check">✓</span>{toast}<button onClick={() => setToast("")} aria-label="Dismiss confirmation">×</button></div>}
  </div>;
}
