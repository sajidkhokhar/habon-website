export const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => ymd(new Date());
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
export const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
/** weekStart: 0 = Sunday, 1 = Monday */
export const startOfWeek = (s: string, weekStart = 0) => { const d = parse(s); const diff = (d.getDay() - weekStart + 7) % 7; d.setDate(d.getDate() - diff); return ymd(d); };
export const monthKey = (s: string) => s.slice(0, 7);
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const fmtLong = (s: string) => parse(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtMonth = (y: number, m: number) => `${MONTHS[m]} ${y}`;
export function* range(from: string, to: string) { for (let d = from; d <= to; d = addDays(d, 1)) yield d; }
