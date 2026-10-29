import { useState } from "react";
import { seed } from "./seed";
import {
  Activity,
  Placement,
  Reference,
  TIME_LABELS,
  TripState,
  UNSORTED_ID,
  activityFor,
  addCollection,
  addReference,
  collectionName,
  dayLabel,
  isOnBoard,
  moveReference,
  scheduleReference,
  setPlacement,
  unschedule,
} from "./model";

const ICONS: Record<Reference["type"], string> = { place: "📍", video: "🎬", link: "🔗", note: "📝" };
const DRAG_KEY = "text/x-reference-id";

type Toast = { id: number; message: string; undoable: boolean };
type Scheduling = { refId: string; dayId?: string };

export default function App() {
  const [state, setState] = useState<TripState>(seed);
  const [history, setHistory] = useState<{ state: TripState; label: string }[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<Scheduling | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  // Every change goes through commit so it can be undone.
  function commit(next: TripState, message: string) {
    setHistory((h) => [...h, { state, label: message }].slice(-20));
    setState(next);
    setToast({ id: Date.now(), message, undoable: true });
  }

  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setState(last.state);
    setToast({ id: Date.now(), message: `Undone: ${last.label}`, undoable: false });
  }

  const title = (refId: string) => `“${state.references[refId].title}”`;

  const actions = {
    add(t: string, url?: string) {
      const [next, id] = addReference(state, t, url);
      commit(next, `Saved “${t}” to Unsorted`);
      setSelectedId(id);
    },
    newCollection(name: string) {
      const [next] = addCollection(state, name);
      commit(next, `Created collection “${name}”`);
    },
    move(refId: string, collectionId: string) {
      if (state.references[refId].collectionId === collectionId) return;
      commit(
        moveReference(state, refId, collectionId),
        `Moved ${title(refId)} to ${collectionName(state, collectionId)}`
      );
    },
    schedule(refId: string, dayId: string, timeLabel: string, placement: Placement) {
      const where =
        placement === "collection"
          ? `card kept in ${collectionName(state, state.references[refId].collectionId)}`
          : "card moved to itinerary";
      commit(
        scheduleReference(state, refId, dayId, timeLabel, placement),
        `Scheduled ${title(refId)} for ${dayLabel(state, dayId)} · ${where}`
      );
      setScheduling(null);
    },
    placement(a: Activity, placement: Placement) {
      const refId = a.referenceId!;
      const col = collectionName(state, state.references[refId].collectionId);
      commit(
        setPlacement(state, a.id, placement),
        placement === "collection"
          ? `${title(refId)} card returned to ${col} (still on ${dayLabel(state, a.dayId)})`
          : `${title(refId)} card moved into ${dayLabel(state, a.dayId)} itinerary`
      );
    },
    unschedule(a: Activity) {
      const refId = a.referenceId!;
      commit(
        unschedule(state, a.id),
        `Removed ${title(refId)} from ${dayLabel(state, a.dayId)} · card back in ${collectionName(
          state,
          state.references[refId].collectionId
        )}`
      );
    },
    showOnBoard(refId: string) {
      setSelectedId(refId);
      setFlashId(refId);
      setTimeout(() => setFlashId(null), 1200);
      document.getElementById(`card-${refId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
  };

  const selected = selectedId ? state.references[selectedId] : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{state.tripName}</h1>
          <span className="muted">Collection Board · May 13–16</span>
        </div>
        <button className="btn" onClick={undo} disabled={history.length === 0}>
          ↶ Undo{history.length ? ` (${history.length})` : ""}
        </button>
      </header>

      <main className="layout">
        <section className="board" aria-label="Collection board">
          <AddReferenceForm onAdd={actions.add} />
          <div className="columns">
            {state.collections.map((c) => (
              <Column
                key={c.id}
                state={state}
                collectionId={c.id}
                selectedId={selectedId}
                flashId={flashId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                onMove={actions.move}
                onSchedule={(refId) => setScheduling({ refId })}
                onUnschedule={actions.unschedule}
                onReveal={(refId) =>
                  document.getElementById(`act-${refId}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              />
            ))}
            <NewCollection onCreate={actions.newCollection} />
          </div>
        </section>

        <Itinerary
          state={state}
          selected={selected}
          onScheduleSelectedHere={(dayId) => selected && setScheduling({ refId: selected.id, dayId })}
          onDropRef={(refId, dayId) => setScheduling({ refId, dayId })}
          onPlacement={actions.placement}
          onUnschedule={actions.unschedule}
          onEdit={(refId) => setScheduling({ refId })}
          onShowOnBoard={actions.showOnBoard}
        />
      </main>

      {scheduling && (
        <ScheduleDialog
          state={state}
          refId={scheduling.refId}
          initialDayId={scheduling.dayId}
          onCancel={() => setScheduling(null)}
          onConfirm={actions.schedule}
        />
      )}

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span>✓ {toast.message}</span>
          {toast.undoable && history.length > 0 && (
            <button className="btn btn-light" onClick={undo}>
              Undo
            </button>
          )}
          <button className="toast-x" aria-label="Dismiss" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Board

function AddReferenceForm({ onAdd }: { onAdd: (title: string, url?: string) => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  return (
    <form
      className="add-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title.trim(), url.trim() || undefined);
        setTitle("");
        setUrl("");
      }}
    >
      <input
        aria-label="Reference title"
        placeholder="Save a reference, e.g. Le Comptoir du Relais"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        aria-label="URL (optional)"
        placeholder="URL (optional)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
        + Save
      </button>
    </form>
  );
}

function NewCollection({ onCreate }: { onCreate: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  if (!open)
    return (
      <button className="column new-col" onClick={() => setOpen(true)}>
        + New collection
      </button>
    );
  return (
    <form
      className="column new-col-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim());
        setName("");
        setOpen(false);
      }}
    >
      <input autoFocus placeholder="Collection name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="row">
        <button className="btn btn-primary" type="submit" disabled={!name.trim()}>
          Create
        </button>
        <button className="btn" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

interface ColumnProps {
  state: TripState;
  collectionId: string;
  selectedId: string | null;
  flashId: string | null;
  onSelect: (id: string) => void;
  onMove: (refId: string, collectionId: string) => void;
  onSchedule: (refId: string) => void;
  onUnschedule: (a: Activity) => void;
  onReveal: (refId: string) => void;
}

function Column(p: ColumnProps) {
  const { state, collectionId } = p;
  const [over, setOver] = useState(false);
  const refs = state.referenceOrder.map((id) => state.references[id]).filter((r) => r.collectionId === collectionId);
  const visible = refs.filter((r) => isOnBoard(state, r.id));
  const movedOut = refs.filter((r) => !isOnBoard(state, r.id));

  return (
    <div
      className={`column ${collectionId === UNSORTED_ID ? "unsorted" : ""} ${over ? "drop-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const id = e.dataTransfer.getData(DRAG_KEY);
        if (id) p.onMove(id, collectionId);
      }}
    >
      <h2>
        {collectionName(state, collectionId)} <span className="count">{visible.length}</span>
      </h2>
      {visible.length === 0 && movedOut.length === 0 && <p className="empty">Drop or move cards here</p>}
      {visible.map((r) => (
        <RefCard
          key={r.id}
          state={state}
          reference={r}
          selected={p.selectedId === r.id}
          flash={p.flashId === r.id}
          onSelect={() => p.onSelect(r.id)}
          onMove={(c) => p.onMove(r.id, c)}
          onSchedule={() => p.onSchedule(r.id)}
          onUnschedule={p.onUnschedule}
        />
      ))}
      {movedOut.map((r) => {
        const a = activityFor(state, r.id)!;
        return (
          <button key={r.id} className="moved-stub" onClick={() => p.onReveal(r.id)}>
            ↗ {r.title} — in {dayLabel(state, a.dayId)} itinerary
          </button>
        );
      })}
    </div>
  );
}

interface RefCardProps {
  state: TripState;
  reference: Reference;
  selected: boolean;
  flash?: boolean;
  onSelect: () => void;
  onMove: (collectionId: string) => void;
  onSchedule: () => void;
  onUnschedule: (a: Activity) => void;
}

function RefCard({ state, reference: r, selected, flash, onSelect, onMove, onSchedule, onUnschedule }: RefCardProps) {
  const activity = activityFor(state, r.id);
  return (
    <article
      id={`card-${r.id}`}
      className={`card ${selected ? "selected" : ""} ${flash ? "flash" : ""}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData(DRAG_KEY, r.id)}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={selected}
    >
      <CardBody state={state} reference={r} activity={activity} />

      {selected && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <label>
            Move to{" "}
            <select value={r.collectionId} onChange={(e) => onMove(e.target.value)}>
              {state.collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="row">
            <button className="btn btn-primary" onClick={onSchedule}>
              📅 {activity ? "Change schedule…" : "Schedule…"}
            </button>
            {activity && (
              <button className="btn" onClick={() => onUnschedule(activity)}>
                Unschedule
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CardBody({ state, reference: r, activity }: { state: TripState; reference: Reference; activity?: Activity }) {
  return (
    <>
      <div className="card-title">
        <span aria-hidden>{ICONS[r.type]}</span> {r.title}
      </div>
      {r.url && (
        <div className="card-url" title={r.url}>
          {r.url.replace(/^https?:\/\//, "")}
        </div>
      )}
      <div className="chips">
        <span className="chip">{collectionName(state, r.collectionId)}</span>
        {activity ? (
          <span className="chip chip-scheduled">
            📅 {dayLabel(state, activity.dayId)}
            {activity.timeLabel && activity.timeLabel !== "Any time" ? ` · ${activity.timeLabel}` : ""}
          </span>
        ) : (
          <span className="chip chip-saved">Saved</span>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Itinerary

interface ItineraryProps {
  state: TripState;
  selected?: Reference;
  onScheduleSelectedHere: (dayId: string) => void;
  onDropRef: (refId: string, dayId: string) => void;
  onPlacement: (a: Activity, placement: Placement) => void;
  onUnschedule: (a: Activity) => void;
  onEdit: (refId: string) => void;
  onShowOnBoard: (refId: string) => void;
}

function Itinerary(p: ItineraryProps) {
  const { state } = p;
  const [overDay, setOverDay] = useState<string | null>(null);
  const order = (a: Activity) => TIME_LABELS.indexOf(a.timeLabel ?? "Any time");

  return (
    <aside className="itinerary" aria-label="Itinerary">
      <h2>Itinerary</h2>
      {state.days.map((d) => {
        const acts = state.activities.filter((a) => a.dayId === d.id).sort((a, b) => order(a) - order(b));
        return (
          <div
            key={d.id}
            className={`day ${overDay === d.id ? "drop-over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverDay(d.id);
            }}
            onDragLeave={() => setOverDay(null)}
            onDrop={(e) => {
              setOverDay(null);
              const id = e.dataTransfer.getData(DRAG_KEY);
              if (id) p.onDropRef(id, d.id);
            }}
          >
            <div className="day-head">
              <strong>{d.label}</strong> <span className="muted">{d.date}</span>
            </div>
            {acts.length === 0 && <p className="empty">Open day — nothing planned</p>}
            {acts.map((a) => (
              <ActivityRow key={a.id} {...p} activity={a} />
            ))}
            {p.selected && !activityFor(state, p.selected.id) && (
              <button className="btn btn-dashed" onClick={() => p.onScheduleSelectedHere(d.id)}>
                + Schedule “{p.selected.title}” here
              </button>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function ActivityRow({ state, activity: a, ...p }: { state: TripState; activity: Activity } & ItineraryProps) {
  const time = a.timeLabel && a.timeLabel !== "Any time" ? a.timeLabel : "Any time";

  if (!a.referenceId) {
    return (
      <div className="activity anchor">
        <span className="time">{time}</span> ⚓ {a.title}
      </div>
    );
  }

  const r = state.references[a.referenceId];

  // "Move to itinerary": the same reference renders here as a full card.
  if (a.placement === "itinerary") {
    return (
      <div className="activity" id={`act-${r.id}`}>
        <span className="time">{time}</span>
        <div className="card in-itinerary">
          <CardBody state={state} reference={r} activity={a} />
          <div className="row">
            <button className="btn" onClick={() => p.onPlacement(a, "collection")}>
              Return card to {collectionName(state, r.collectionId)}
            </button>
            <button className="btn" onClick={() => p.onEdit(r.id)}>
              Change…
            </button>
            <button className="btn" onClick={() => p.onUnschedule(a)}>
              Unschedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  // "Keep in collection": a compact link to the card that stays on the board.
  return (
    <div className="activity linked" id={`act-${r.id}`}>
      <span className="time">{time}</span>
      <div>
        <div className="card-title">
          {ICONS[r.type]} {r.title}
        </div>
        <div className="row">
          <button className="link-btn" onClick={() => p.onShowOnBoard(r.id)}>
            🔗 Card kept in {collectionName(state, r.collectionId)} — show
          </button>
          <button className="link-btn" onClick={() => p.onPlacement(a, "itinerary")}>
            Move card here
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Schedule dialog

interface ScheduleDialogProps {
  state: TripState;
  refId: string;
  initialDayId?: string;
  onCancel: () => void;
  onConfirm: (refId: string, dayId: string, timeLabel: string, placement: Placement) => void;
}

function ScheduleDialog({ state, refId, initialDayId, onCancel, onConfirm }: ScheduleDialogProps) {
  const r = state.references[refId];
  const existing = activityFor(state, refId);
  const [dayId, setDayId] = useState(initialDayId ?? existing?.dayId ?? "");
  const [timeLabel, setTimeLabel] = useState(existing?.timeLabel ?? "Any time");
  const [placement, setPlacementChoice] = useState<Placement | "">(existing?.placement ?? "");
  const col = collectionName(state, r.collectionId);

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="dialog" role="dialog" aria-modal aria-labelledby="sched-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="sched-title">
          {existing ? "Change schedule" : "Schedule"}: {ICONS[r.type]} {r.title}
        </h2>

        <fieldset>
          <legend>1. Which day?</legend>
          <div className="day-pick">
            {state.days.map((d) => (
              <label key={d.id} className={`pick ${dayId === d.id ? "on" : ""}`}>
                <input type="radio" name="day" checked={dayId === d.id} onChange={() => setDayId(d.id)} />
                <strong>{d.label}</strong>
                <span className="muted">{d.date}</span>
              </label>
            ))}
          </div>
          <label className="time-pick">
            Rough time (optional){" "}
            <select value={timeLabel} onChange={(e) => setTimeLabel(e.target.value)}>
              {TIME_LABELS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>2. Where should the card live?</legend>
          <label className={`pick wide ${placement === "collection" ? "on" : ""}`}>
            <input type="radio" name="place" checked={placement === "collection"} onChange={() => setPlacementChoice("collection")} />
            <div>
              <strong>Keep in collection</strong>
              <div className="muted">Card stays in {col} with a 📅 scheduled badge. The itinerary links to it.</div>
            </div>
          </label>
          <label className={`pick wide ${placement === "itinerary" ? "on" : ""}`}>
            <input type="radio" name="place" checked={placement === "itinerary"} onChange={() => setPlacementChoice("itinerary")} />
            <div>
              <strong>Move to itinerary</strong>
              <div className="muted">Card appears inside the day. {col} keeps a pointer so you can return it anytime.</div>
            </div>
          </label>
        </fieldset>

        <div className="row end">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!dayId || !placement}
            onClick={() => placement && onConfirm(refId, dayId, timeLabel, placement)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
