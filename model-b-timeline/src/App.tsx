import { useEffect, useRef, useState } from "react";
import {
  type Activity,
  type Reference,
  type Trip,
  KIND_ICON,
  activitiesOn,
  dayLabel,
  isFlexible,
  timeLabel,
} from "./model";
import { seedTrip } from "./seed";

type View = "list" | "calendar";

interface Toast {
  key: number;
  message: string;
  showDay?: string;
}

let nextId = 100;

export default function App() {
  const [trip, setTrip] = useState<Trip>(seedTrip);
  const [view, setView] = useState<View>("list");
  const [selectedDay, setSelectedDay] = useState(seedTrip.days[0]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId]);

  function confirm(message: string, activityId?: string, showDay?: string) {
    setToast({ key: Date.now(), message, showDay });
    if (activityId) setHighlightId(activityId);
  }

  function scheduleReference(ref: Reference, date: string, time: string | null) {
    const activity: Activity = {
      id: `a${nextId++}`,
      title: ref.title,
      kind: ref.kind,
      detail: ref.detail,
      date,
      time,
      refId: ref.id,
    };
    setTrip((t) => ({
      ...t,
      activities: [...t.activities, activity],
      unscheduled: t.unscheduled.filter((r) => r.id !== ref.id),
    }));
    const how = time ? `at ${timeLabel(time)}` : "as flexible (no set time)";
    confirm(`Added “${ref.title}” to ${dayLabel(date)} ${how}`, activity.id, date);
  }

  function updateActivity(id: string, patch: Partial<Activity>) {
    setTrip((t) => ({
      ...t,
      activities: t.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }

  function moveActivity(a: Activity, date: string) {
    if (date === a.date) return;
    updateActivity(a.id, { date });
    confirm(`Moved “${a.title}” from ${dayLabel(a.date)} to ${dayLabel(date)}`, a.id, date);
  }

  function setActivityTime(a: Activity, time: string | null) {
    updateActivity(a.id, { time });
    confirm(
      time
        ? `“${a.title}” is now fixed at ${timeLabel(time)}`
        : `“${a.title}” is now flexible — anytime on ${dayLabel(a.date)}`,
      a.id,
    );
  }

  function returnToSaved(a: Activity) {
    const ref: Reference = { id: a.refId ?? `r-${a.id}`, title: a.title, kind: a.kind, detail: a.detail };
    setTrip((t) => ({
      ...t,
      activities: t.activities.filter((x) => x.id !== a.id),
      unscheduled: [ref, ...t.unscheduled],
    }));
    confirm(`Returned “${a.title}” to Saved — it's still there when you need it`);
  }

  const actions: CardActions = { days: trip.days, moveActivity, setActivityTime, returnToSaved };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{trip.name} itinerary</h1>
          <p className="sub">
            {dayLabel(trip.days[0])} – {dayLabel(trip.days[trip.days.length - 1])} · {trip.days.length} days
          </p>
        </div>
        <div className="view-toggle" role="tablist" aria-label="Itinerary view">
          <button role="tab" aria-selected={view === "list"} className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
            ☰ Daily List
          </button>
          <button
            role="tab"
            aria-selected={view === "calendar"}
            className={view === "calendar" ? "on" : ""}
            onClick={() => setView("calendar")}
          >
            ◷ Hourly Calendar
          </button>
        </div>
      </header>

      <nav className="day-tabs" aria-label="Trip days">
        {trip.days.map((d, i) => {
          const count = trip.activities.filter((a) => a.date === d).length;
          return (
            <button key={d} className={d === selectedDay ? "on" : ""} onClick={() => setSelectedDay(d)}>
              <span className="day-num">Day {i + 1}</span>
              <span>{dayLabel(d)}</span>
              <span className="day-count">{count === 0 ? "open" : `${count} planned`}</span>
            </button>
          );
        })}
      </nav>

      <div className="layout">
        <main className="workspace">
          {view === "list" ? (
            <DailyList trip={trip} selectedDay={selectedDay} highlightId={highlightId} actions={actions} />
          ) : (
            <HourlyCalendar trip={trip} day={selectedDay} highlightId={highlightId} actions={actions} />
          )}
        </main>
        <SavedPanel refs={trip.unscheduled} days={trip.days} defaultDay={selectedDay} onSchedule={scheduleReference} />
      </div>

      {toast && (
        <div className="toast" key={toast.key} role="status">
          <span>✓ {toast.message}</span>
          {toast.showDay && toast.showDay !== selectedDay && (
            <button
              onClick={() => {
                setSelectedDay(toast.showDay!);
                setToast(null);
              }}
            >
              Go to {dayLabel(toast.showDay)}
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

/* ---------- Daily List ---------- */

function DailyList({
  trip,
  selectedDay,
  highlightId,
  actions,
}: {
  trip: Trip;
  selectedDay: string;
  highlightId: string | null;
  actions: CardActions;
}) {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  // "nearest" keeps the header in view when the selected day is already on screen.
  useEffect(() => {
    refs.current[selectedDay]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedDay]);

  return (
    <div className="daily-list">
      {trip.days.map((d, i) => {
        const { fixed, flexible } = activitiesOn(trip, d);
        const empty = fixed.length + flexible.length === 0;
        return (
          <section key={d} ref={(el) => (refs.current[d] = el)} className={`day ${d === selectedDay ? "selected" : ""}`}>
            <h2>
              <span className="day-num">Day {i + 1}</span> {dayLabel(d)}
            </h2>
            {empty ? (
              <p className="open-day">☀ Open day — nothing planned yet. Add something from Saved when you're ready.</p>
            ) : (
              <>
                {fixed.length > 0 && (
                  <div className="group">
                    <h3>Scheduled times</h3>
                    {fixed.map((a) => (
                      <ActivityCard key={a.id} a={a} highlight={a.id === highlightId} actions={actions} />
                    ))}
                  </div>
                )}
                {flexible.length > 0 && (
                  <div className="group">
                    <h3>Anytime today</h3>
                    {flexible.map((a) => (
                      <ActivityCard key={a.id} a={a} highlight={a.id === highlightId} actions={actions} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- Hourly Calendar ---------- */

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8:00 – 23:00

function HourlyCalendar({
  trip,
  day,
  highlightId,
  actions,
}: {
  trip: Trip;
  day: string;
  highlightId: string | null;
  actions: CardActions;
}) {
  const { fixed, flexible } = activitiesOn(trip, day);
  const index = trip.days.indexOf(day);

  return (
    <div className="calendar">
      <h2>
        <span className="day-num">Day {index + 1}</span> {dayLabel(day)}
      </h2>

      <section className="anytime">
        <h3>Anytime today · no set time</h3>
        {flexible.length === 0 ? (
          <p className="muted">No flexible plans — that's fine.</p>
        ) : (
          flexible.map((a) => <ActivityCard key={a.id} a={a} highlight={a.id === highlightId} actions={actions} />)
        )}
      </section>

      <div className="grid">
        {HOURS.map((h) => {
          const inHour = fixed.filter((a) => Number(a.time!.slice(0, 2)) === h);
          return (
            <div className="hour" key={h}>
              <div className="hour-label">{timeLabel(`${String(h).padStart(2, "0")}:00`)}</div>
              <div className="hour-slot">
                {inHour.map((a) => (
                  <ActivityCard key={a.id} a={a} highlight={a.id === highlightId} actions={actions} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {fixed.length === 0 && <p className="muted center">No fixed-time plans on this day.</p>}
    </div>
  );
}

/* ---------- Activity card (shared by both views) ---------- */

interface CardActions {
  days: string[];
  moveActivity: (a: Activity, date: string) => void;
  setActivityTime: (a: Activity, time: string | null) => void;
  returnToSaved: (a: Activity) => void;
}

function ActivityCard({ a, highlight, actions }: { a: Activity; highlight: boolean; actions: CardActions }) {
  const [open, setOpen] = useState(false);
  const [draftTime, setDraftTime] = useState(a.time ?? "12:00");
  const [pickingTime, setPickingTime] = useState(false);
  const flex = isFlexible(a);

  return (
    <article className={`card ${flex ? "flexible" : "fixed"} ${highlight ? "flash" : ""}`}>
      <div className="card-main">
        <span className={`when ${flex ? "flex" : ""}`}>{flex ? "Flexible" : timeLabel(a.time!)}</span>
        <div className="card-text">
          <strong>
            {KIND_ICON[a.kind]} {a.title}
          </strong>
          <span className="detail">{a.detail}</span>
        </div>
        <button className="ghost" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? "Done" : "Edit ▾"}
        </button>
      </div>

      {open && (
        <div className="card-menu">
          <label>
            Move to
            <select value={a.date} onChange={(e) => actions.moveActivity(a, e.target.value)}>
              {actions.days.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </select>
          </label>

          <div className="seg" role="group" aria-label="Timing">
            <button
              className={flex && !pickingTime ? "on" : ""}
              onClick={() => {
                setPickingTime(false);
                if (!flex) actions.setActivityTime(a, null);
              }}
            >
              Flexible
            </button>
            <button className={!flex || pickingTime ? "on" : ""} onClick={() => setPickingTime(true)}>
              Fixed time
            </button>
          </div>
          {(pickingTime || !flex) && (
            <span className="time-pick">
              <input type="time" value={draftTime} onChange={(e) => setDraftTime(e.target.value)} />
              <button
                onClick={() => {
                  actions.setActivityTime(a, draftTime);
                  setPickingTime(false);
                }}
                disabled={draftTime === a.time}
              >
                Set time
              </button>
            </span>
          )}

          <button className="link" onClick={() => actions.returnToSaved(a)}>
            ↩ Return to Saved
          </button>
        </div>
      )}
    </article>
  );
}

/* ---------- Saved references panel ---------- */

function SavedPanel({
  refs,
  days,
  defaultDay,
  onSchedule,
}: {
  refs: Reference[];
  days: string[];
  defaultDay: string;
  onSchedule: (r: Reference, date: string, time: string | null) => void;
}) {
  const [addingId, setAddingId] = useState<string | null>(null);

  return (
    <aside className="saved">
      <h2>Saved · not scheduled</h2>
      <p className="muted">Ideas you've collected. Add them to a day when you're ready.</p>
      {refs.length === 0 && <p className="muted">Everything's on the itinerary.</p>}
      {refs.map((r) => (
        <div className="ref" key={r.id}>
          <strong>
            {KIND_ICON[r.kind]} {r.title}
          </strong>
          <span className="detail">{r.detail}</span>
          {addingId === r.id ? (
            <AddForm
              days={days}
              defaultDay={defaultDay}
              onCancel={() => setAddingId(null)}
              onAdd={(date, time) => {
                setAddingId(null);
                onSchedule(r, date, time);
              }}
            />
          ) : (
            <button className="add" onClick={() => setAddingId(r.id)}>
              + Add to itinerary
            </button>
          )}
        </div>
      ))}
    </aside>
  );
}

function AddForm({
  days,
  defaultDay,
  onAdd,
  onCancel,
}: {
  days: string[];
  defaultDay: string;
  onAdd: (date: string, time: string | null) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(defaultDay);
  const [fixed, setFixed] = useState(false);
  const [time, setTime] = useState("19:00");

  return (
    <div className="add-form">
      <label>
        Day
        <select value={date} onChange={(e) => setDate(e.target.value)}>
          {days.map((d) => (
            <option key={d} value={d}>
              {dayLabel(d)}
            </option>
          ))}
        </select>
      </label>
      <div className="seg" role="group" aria-label="Timing">
        <button className={!fixed ? "on" : ""} onClick={() => setFixed(false)}>
          Flexible
        </button>
        <button className={fixed ? "on" : ""} onClick={() => setFixed(true)}>
          Fixed time
        </button>
      </div>
      {fixed ? (
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
      ) : (
        <span className="hint">No time needed — it'll go under “Anytime today”.</span>
      )}
      <div className="form-actions">
        <button className="primary" onClick={() => onAdd(date, fixed ? time : null)}>
          Add to {dayLabel(date)}
        </button>
        <button className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
