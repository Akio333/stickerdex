/** Stable for a whole local calendar day, and different from one day to the next. */
export function pokemonOfTheDay(date: Date, count: number): number {
  const stamp =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  // One round of mulberry32 so consecutive dates land far apart.
  let t = (stamp + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (((t ^ (t >>> 14)) >>> 0) % count) + 1;
}
