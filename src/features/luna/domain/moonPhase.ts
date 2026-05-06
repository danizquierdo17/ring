// Reference new moon: Jan 6, 2000 at 18:14 UTC
const REFERENCE_NEW_MOON = new Date('2000-01-06T18:14:00Z');
const SYNODIC_CYCLE = 29.530588853; // days

export function getMoonPhaseDay(date: Date): number {
  const diffDays = (date.getTime() - REFERENCE_NEW_MOON.getTime()) / 86_400_000;
  return ((diffDays % SYNODIC_CYCLE) + SYNODIC_CYCLE) % SYNODIC_CYCLE;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86_400_000;
}
