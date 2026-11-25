export function load<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
export function save<T>(key: string, value: T): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
export const KEYS = {
  tracker: 'habon.tracker.v1',
  routine: 'habon.routine.v1',
  challenge: 'habon.challenge.v1',
  grid: 'habon.grid.v1',
  goals: 'habon.goals.v1',
  streak: 'habon.streakcalc.v1',
  printable: 'habon.printable.v1',
  theme: 'habon-theme',
  consent: 'habon-consent',
};
