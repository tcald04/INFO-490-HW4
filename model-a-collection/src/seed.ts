import { TripState, UNSORTED_ID } from "./model";

export const seed: TripState = {
  tripName: "Paris · 4 days",
  collections: [
    { id: UNSORTED_ID, name: "Unsorted" },
    { id: "food", name: "Food & Drink" },
    { id: "museums", name: "Museums" },
    { id: "walks", name: "Neighborhoods & Walks" },
  ],
  references: {
    r1: { id: "r1", title: "Sunset at Trocadéro (reel)", url: "https://instagram.com/reel/trocadero-sunset", type: "video", collectionId: UNSORTED_ID },
    r2: { id: "r2", title: "Ask hotel about luggage storage on Day 4", type: "note", collectionId: UNSORTED_ID },
    r3: { id: "r3", title: "Café de Flore", url: "https://cafedeflore.fr", type: "place", collectionId: "food" },
    r4: { id: "r4", title: "Breizh Café (crêpes)", url: "https://breizhcafe.com", type: "place", collectionId: "food" },
    r5: { id: "r5", title: "Musée d'Orsay", url: "https://musee-orsay.fr", type: "place", collectionId: "museums" },
    r6: { id: "r6", title: "Musée de l'Orangerie", url: "https://musee-orangerie.fr", type: "place", collectionId: "museums" },
    r7: { id: "r7", title: "Le Marais self-guided walk", url: "https://parisbywalk.com/marais", type: "link", collectionId: "walks" },
    r8: { id: "r8", title: "Montmartre street art tour", url: "https://youtube.com/watch?v=montmartre-art", type: "video", collectionId: "walks" },
  },
  referenceOrder: ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8"],
  days: [
    { id: "d1", label: "Day 1", date: "Thu, May 13" },
    { id: "d2", label: "Day 2", date: "Fri, May 14" },
    { id: "d3", label: "Day 3", date: "Sat, May 15" },
    { id: "d4", label: "Day 4", date: "Sun, May 16" },
  ],
  activities: [
    { id: "a1", dayId: "d1", title: "Land at CDG · check in to Hôtel Le Six", timeLabel: "Afternoon", placement: "collection" },
    // Seeded examples of both placements:
    { id: "a2", dayId: "d2", referenceId: "r5", timeLabel: "Morning", placement: "collection" },
    { id: "a3", dayId: "d3", referenceId: "r7", timeLabel: "Afternoon", placement: "itinerary" },
    { id: "a4", dayId: "d4", title: "RER B to CDG · flight 15:40", timeLabel: "Afternoon", placement: "collection" },
  ],
};
