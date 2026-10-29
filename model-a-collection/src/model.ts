// Normalized trip state. A Reference exists exactly once in `references`;
// an Activity only *points* to it via referenceId, so scheduling never copies data.

export type RefType = "place" | "video" | "link" | "note";
export type Placement = "collection" | "itinerary";

export interface Reference {
  id: string;
  title: string;
  url?: string;
  type: RefType;
  collectionId: string; // kept even while the card is shown in the itinerary
}

export interface Collection {
  id: string;
  name: string;
}

export interface Day {
  id: string;
  label: string;
  date: string;
}

export interface Activity {
  id: string;
  dayId: string;
  referenceId?: string; // optional: an activity may be a plain anchor (e.g. a flight)
  title?: string; // only used when there is no reference
  timeLabel?: string;
  placement: Placement; // display flag: where the linked card is shown
}

export interface TripState {
  tripName: string;
  collections: Collection[];
  references: Record<string, Reference>;
  referenceOrder: string[];
  days: Day[];
  activities: Activity[];
}

export const UNSORTED_ID = "unsorted";
export const TIME_LABELS = ["Any time", "Morning", "Afternoon", "Evening"];

let counter = 1000;
const uid = (prefix: string) => `${prefix}${counter++}`;

// ---------- selectors ----------

export const activityFor = (s: TripState, refId: string) =>
  s.activities.find((a) => a.referenceId === refId);

export const isOnBoard = (s: TripState, refId: string) =>
  activityFor(s, refId)?.placement !== "itinerary";

export const collectionName = (s: TripState, id: string) =>
  s.collections.find((c) => c.id === id)?.name ?? "Unsorted";

export const dayLabel = (s: TripState, id: string) =>
  s.days.find((d) => d.id === id)?.label ?? "";

export function inferType(url?: string): RefType {
  if (!url) return "place";
  if (/youtube|youtu\.be|tiktok|instagram|vimeo/i.test(url)) return "video";
  if (/maps\.google|goo\.gl\/maps|maps\.app/i.test(url)) return "place";
  return "link";
}

// ---------- pure updates (each returns a new state) ----------

export function addReference(s: TripState, title: string, url?: string): [TripState, string] {
  const id = uid("r");
  const ref: Reference = { id, title, url, type: inferType(url), collectionId: UNSORTED_ID };
  return [
    { ...s, references: { ...s.references, [id]: ref }, referenceOrder: [id, ...s.referenceOrder] },
    id,
  ];
}

export function addCollection(s: TripState, name: string): [TripState, string] {
  const id = uid("c");
  return [{ ...s, collections: [...s.collections, { id, name }] }, id];
}

export function moveReference(s: TripState, refId: string, collectionId: string): TripState {
  const ref = s.references[refId];
  return { ...s, references: { ...s.references, [refId]: { ...ref, collectionId } } };
}

export function scheduleReference(
  s: TripState,
  refId: string,
  dayId: string,
  timeLabel: string,
  placement: Placement
): TripState {
  const existing = activityFor(s, refId);
  if (existing) {
    return {
      ...s,
      activities: s.activities.map((a) =>
        a.id === existing.id ? { ...a, dayId, timeLabel, placement } : a
      ),
    };
  }
  const activity: Activity = { id: uid("a"), dayId, referenceId: refId, timeLabel, placement };
  return { ...s, activities: [...s.activities, activity] };
}

export function setPlacement(s: TripState, activityId: string, placement: Placement): TripState {
  return {
    ...s,
    activities: s.activities.map((a) => (a.id === activityId ? { ...a, placement } : a)),
  };
}

export function unschedule(s: TripState, activityId: string): TripState {
  return { ...s, activities: s.activities.filter((a) => a.id !== activityId) };
}
