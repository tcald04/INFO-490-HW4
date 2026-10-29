export type RefKind = "restaurant" | "place" | "link" | "video" | "note";

export interface Reference {
  id: string;
  title: string;
  kind: RefKind;
  detail: string;
}

// An activity is "flexible" when time is null — there is no separate flag,
// so the two views can never disagree about which kind it is.
export interface Activity {
  id: string;
  title: string;
  kind: RefKind;
  detail: string;
  date: string; // YYYY-MM-DD, always one of trip.days
  time: string | null; // "HH:MM" or null
  refId?: string; // set when the activity came from a saved reference
}

export interface Trip {
  name: string;
  days: string[];
  activities: Activity[];
  unscheduled: Reference[];
}

export const isFlexible = (a: Activity) => a.time === null;

export const KIND_ICON: Record<RefKind, string> = {
  restaurant: "🍽",
  place: "📍",
  link: "🔗",
  video: "▶",
  note: "📝",
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DOW[dt.getDay()]} ${MON[m - 1]} ${d}`;
}

export function timeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export const byTime = (a: Activity, b: Activity) => (a.time ?? "").localeCompare(b.time ?? "");

export function activitiesOn(trip: Trip, date: string) {
  const all = trip.activities.filter((a) => a.date === date);
  return {
    fixed: all.filter((a) => !isFlexible(a)).sort(byTime),
    flexible: all.filter(isFlexible),
  };
}
