import type { Trip } from "./model";

export const seedTrip: Trip = {
  name: "Paris",
  days: ["2027-06-10", "2027-06-11", "2027-06-12", "2027-06-13"],
  activities: [
    { id: "a1", title: "Arrive CDG, RER B to hotel", kind: "place", detail: "Flight AF 007 lands T2E", date: "2027-06-10", time: "10:30" },
    { id: "a2", title: "Louvre — timed entry", kind: "place", detail: "Pyramid entrance, tickets in email", date: "2027-06-10", time: "15:00" },
    { id: "a3", title: "Walk the Tuileries", kind: "place", detail: "Between Louvre and Concorde", date: "2027-06-10", time: null },
    { id: "a4", title: "Rue Cler market street", kind: "place", detail: "7th arr. — cheese, fruit, picnic stuff", date: "2027-06-11", time: null },
    { id: "a5", title: "Eiffel Tower summit", kind: "place", detail: "Booked, arrive 15 min early", date: "2027-06-11", time: "18:30" },
    { id: "a6", title: "Musée d'Orsay", kind: "place", detail: "Reserved slot, Entrance C", date: "2027-06-12", time: "10:00" },
    { id: "a7", title: "Montmartre wander", kind: "place", detail: "Sacré-Cœur, Place du Tertre", date: "2027-06-12", time: null },
  ],
  unscheduled: [
    { id: "r1", title: "Le Comptoir du Relais", kind: "restaurant", detail: "Bistro · Saint-Germain · no reservations at lunch" },
    { id: "r2", title: "Breizh Café", kind: "restaurant", detail: "Buckwheat crêpes · Le Marais" },
    { id: "r3", title: "Shakespeare and Company", kind: "place", detail: "Bookshop · Left Bank, near Notre-Dame" },
    { id: "r4", title: "\"Hidden passages of Paris\"", kind: "video", detail: "YouTube · 12 min walking tour of covered arcades" },
    { id: "r5", title: "Buy Navigo Easy card", kind: "note", detail: "Any metro station — load a carnet" },
  ],
};
