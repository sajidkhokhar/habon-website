import type { jsPDF as JsPDF } from 'jspdf';
import { MONTHS, daysInMonth, DOW } from './dates';

export type Paper = 'a4' | 'letter';
export type Design = 'grid' | 'minimal' | 'bold' | 'dots';
export type TrackerOpts = {
  kind: 'weekly' | 'monthly'; paper: Paper; design: Design; color: string; title: string; habits: string[]; minRows: number;
  year: number; month: number; weekStart: 0 | 1; notes: boolean; credit: boolean; orientation?: 'portrait' | 'landscape';
};
export type ChallengeOpts = { paper: Paper; color: string; name: string; goal: string; days: number; credit: boolean; design: Design };
export type RoutineOpts = { paper: Paper; color: string; title: string; blocks: { name: string; items: { time: string; text: string }[] }[]; credit: boolean };

const clean = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '').trim();
const rgb = (hex: string): [number, number, number] => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const tint = (hex: string, t: number): [number, number, number] => rgb(hex).map((v) => Math.round(v + (255 - v) * t)) as [number, number, number];
const ink: [number, number, number] = [28, 28, 30];
const grey: [number, number, number] = [150, 150, 156];
const line: [number, number, number] = [200, 196, 188];
/** Pick readable text on a filled color. */
const onColor = (hex: string): [number, number, number] => { const [r, g, b] = rgb(hex); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? ink : [255, 255, 255]; };

async function newDoc(paper: Paper, orientation: 'portrait' | 'landscape'): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf');
  const d = new jsPDF({ unit: 'mm', format: paper, orientation, compress: true });
  d.setLineJoin('round'); d.setLineCap('round');
  return d;
}

function credit(d: JsPDF, show: boolean, W: number, H: number) {
  if (!show) return;
  d.setFont('helvetica', 'normal'); d.setFontSize(7.5); d.setTextColor(...grey);
  d.text('Made with Habon - free habit tools at habon-app.pages.dev', W / 2, H - 6, { align: 'center' });
}

function box(d: JsPDF, x: number, y: number, size: number, design: Design, color: string) {
  d.setLineWidth(0.3); d.setDrawColor(...(design === 'bold' ? rgb(color) : grey));
  if (design === 'dots') { d.setFillColor(...tint(color, 0.7)); d.circle(x, y, size * 0.16, 'F'); return; }
  if (design === 'minimal') { d.roundedRect(x - size * 0.32, y - size * 0.32, size * 0.64, size * 0.64, 0.8, 0.8, 'S'); return; }
  d.circle(x, y, size * 0.34, 'S');
}

export async function buildTracker(o: TrackerOpts): Promise<JsPDF> {
  const monthly = o.kind === 'monthly';
  const orient = o.orientation ?? (monthly ? 'landscape' : 'portrait');
  const d = await newDoc(o.paper, orient);
  const W = d.internal.pageSize.getWidth(), H = d.internal.pageSize.getHeight();
  const m = 12; const col = o.color;
  const habits = o.habits.map(clean).filter(Boolean);
  const rows = Math.max(o.minRows, habits.length);
  const days = monthly ? daysInMonth(o.year, o.month) : 7;
  const sub = monthly ? `${MONTHS[o.month]} ${o.year}` : 'Week of ____ / ____ / ________';

  // Title block
  let y = m + 8;
  if (o.design === 'bold') { d.setFillColor(...rgb(col)); d.rect(0, 0, W, 30, 'F'); d.setTextColor(...onColor(col)); } else d.setTextColor(...rgb(col));
  d.setFont('helvetica', 'bold'); d.setFontSize(monthly ? 24 : 26); d.text(clean(o.title) || 'Habit Tracker', m, y + 2);
  d.setFontSize(monthly ? 14 : 11); d.setFont('helvetica', monthly ? 'bold' : 'normal');
  if (o.design !== 'bold') d.setTextColor(...ink);
  d.text(sub, W - m, y + 2, { align: 'right' });
  y = o.design === 'bold' ? 38 : y + 8;
  if (o.design !== 'bold') { d.setDrawColor(...rgb(col)); d.setLineWidth(0.8); d.line(m, y - 3, W - m, y - 3); }

  const labelW = monthly ? 52 : 62;
  const gridX = m + labelW; const cellW = (W - m - gridX) / days;
  const hdrH = monthly ? 11 : 12;
  const notesH = !monthly && o.notes ? 42 : 0;
  const avail = H - y - hdrH - m - notesH - 8;
  const rowH = Math.min(monthly ? 17 : 21, avail / rows);

  // Column headers
  d.setFontSize(monthly ? 7 : 9); d.setFont('helvetica', 'bold');
  d.setTextColor(...grey); d.text('HABIT', m + 1, y + hdrH - 3);
  for (let i = 0; i < days; i++) {
    const cx = gridX + cellW * i + cellW / 2;
    let name: string, num: string, weekend = false;
    if (monthly) { const dow = new Date(o.year, o.month, i + 1).getDay(); name = DOW[dow][0]; num = String(i + 1); weekend = dow === 0 || dow === 6; }
    else { const dow = (i + o.weekStart) % 7; name = DOW[dow]; num = ''; weekend = dow === 0 || dow === 6; }
    if (weekend && o.design !== 'minimal') { d.setFillColor(...tint(col, 0.88)); d.rect(gridX + cellW * i, y, cellW, hdrH + rowH * rows, 'F'); }
    d.setTextColor(...(o.design === 'bold' ? rgb(col) : ink)); d.setFontSize(monthly ? 7 : 9);
    d.text(name, cx, y + (monthly ? 4.2 : 6), { align: 'center' });
    if (monthly) { d.setFont('helvetica', 'normal'); d.setTextColor(...grey); d.text(num, cx, y + 8.6, { align: 'center' }); d.setFont('helvetica', 'bold'); }
  }
  y += hdrH;

  // Rows
  for (let r = 0; r < rows; r++) {
    const ry = y + r * rowH;
    if (o.design === 'bold' && r % 2 === 0) { d.setFillColor(...tint(col, 0.93)); d.rect(m, ry, W - 2 * m, rowH, 'F'); }
    d.setDrawColor(...line); d.setLineWidth(0.25);
    if (o.design === 'grid') d.line(m, ry, W - m, ry);
    else if (o.design === 'minimal' || o.design === 'bold') d.line(m, ry + rowH, W - m, ry + rowH);
    if (habits[r]) { d.setFont('helvetica', 'bold'); d.setFontSize(monthly ? 9 : 11); d.setTextColor(...ink); d.text(habits[r], m + 1.5, ry + rowH / 2 + 1.3, { maxWidth: labelW - 4 }); }
    else if (o.design !== 'dots') { d.setDrawColor(...line); d.setLineDash([0.4, 1], 0); d.line(m + 1.5, ry + rowH - 3, gridX - 3, ry + rowH - 3); d.setLineDash([], 0); }
    for (let i = 0; i < days; i++) box(d, gridX + cellW * i + cellW / 2, ry + rowH / 2, Math.min(cellW, rowH) * (monthly ? 0.95 : 0.8), o.design, col);
  }
  const gridBottom = y + rows * rowH;
  d.setDrawColor(...line); d.setLineWidth(0.25);
  if (o.design === 'grid') { d.line(m, gridBottom, W - m, gridBottom); for (let i = 0; i <= days; i++) d.line(gridX + cellW * i, y - hdrH + (monthly ? 0 : 0), gridX + cellW * i, gridBottom); d.line(m, y - hdrH, m, gridBottom); d.line(m, y - hdrH, W - m, y - hdrH); }

  if (notesH) {
    const ny = gridBottom + 8;
    d.setFont('helvetica', 'bold'); d.setFontSize(10); d.setTextColor(...rgb(col)); d.text('NOTES & REFLECTION', m, ny);
    d.setDrawColor(...line); d.setLineWidth(0.25);
    for (let i = 1; i <= 4; i++) d.line(m, ny + i * 8, W - m, ny + i * 8);
  }
  credit(d, o.credit, W, H);
  return d;
}

export async function buildChallenge(o: ChallengeOpts): Promise<JsPDF> {
  const d = await newDoc(o.paper, 'portrait');
  const W = d.internal.pageSize.getWidth(), H = d.internal.pageSize.getHeight(); const m = 14; const col = o.color;
  const n = o.days;
  if (o.design === 'bold') { d.setFillColor(...rgb(col)); d.rect(0, 0, W, 46, 'F'); }
  d.setTextColor(...(o.design === 'bold' ? onColor(col) : rgb(col)));
  d.setFont('helvetica', 'bold'); d.setFontSize(30); d.text(`${n}-Day Challenge`, m, 24);
  d.setFontSize(15); d.setTextColor(...(o.design === 'bold' ? onColor(col) : ink)); d.text(clean(o.name) || 'My challenge', m, 34, { maxWidth: W - 2 * m });
  let y = o.design === 'bold' ? 58 : 46;
  d.setFont('helvetica', 'normal'); d.setFontSize(10); d.setTextColor(...grey);
  d.text('Name: ______________________    Start date: ____ / ____ / ________', m, y);
  y += 8;
  if (o.goal) { d.setTextColor(...ink); d.setFontSize(10.5); const g = d.splitTextToSize('Why I am doing this: ' + clean(o.goal), W - 2 * m); d.text(g, m, y); y += g.length * 5 + 2; }
  y += 6;
  const cols = 6; const rowsN = Math.ceil(n / cols); const cw = (W - 2 * m) / cols; const ch = Math.min(cw * 1.05, (H - y - 52) / rowsN);
  for (let i = 0; i < n; i++) {
    const cx = m + (i % cols) * cw + cw / 2; const cy = y + Math.floor(i / cols) * ch + ch / 2; const r = Math.min(cw, ch) * 0.38;
    d.setLineWidth(0.5); d.setDrawColor(...rgb(col));
    if (o.design === 'dots') { d.setFillColor(...tint(col, 0.8)); d.circle(cx, cy, r, 'F'); } else d.circle(cx, cy, r, 'S');
    d.setFont('helvetica', 'bold'); d.setFontSize(Math.min(14, r * 1.4)); d.setTextColor(...(o.design === 'minimal' ? grey : rgb(col)));
    d.text(String(i + 1), cx, cy + r * 0.2, { align: 'center' });
  }
  const by = y + rowsN * ch + 12;
  d.setFont('helvetica', 'bold'); d.setFontSize(10); d.setTextColor(...rgb(col)); d.text('MY REWARD WHEN I FINISH', m, by);
  d.setDrawColor(...line); d.setLineWidth(0.25); d.line(m, by + 9, W - m, by + 9);
  d.text('WHAT I LEARNED', m, by + 20); d.line(m, by + 29, W - m, by + 29); d.line(m, by + 37, W - m, by + 37);
  credit(d, o.credit, W, H);
  return d;
}

export async function buildRoutine(o: RoutineOpts): Promise<JsPDF> {
  const d = await newDoc(o.paper, 'portrait');
  const W = d.internal.pageSize.getWidth(), H = d.internal.pageSize.getHeight(); const m = 16; const col = o.color;
  d.setFont('helvetica', 'bold'); d.setFontSize(26); d.setTextColor(...rgb(col)); d.text(clean(o.title) || 'Daily Routine', m, m + 10);
  d.setFontSize(10); d.setFont('helvetica', 'normal'); d.setTextColor(...grey); d.text('Date: ____ / ____ / ________', W - m, m + 10, { align: 'right' });
  d.setDrawColor(...rgb(col)); d.setLineWidth(0.8); d.line(m, m + 14, W - m, m + 14);
  let y = m + 26;
  const total = o.blocks.reduce((a, b) => a + Math.max(b.items.length, 3) + 1.6, 0);
  const rh = Math.min(10, (H - y - 22) / total);
  for (const b of o.blocks) {
    d.setFont('helvetica', 'bold'); d.setFontSize(12); d.setTextColor(...rgb(col)); d.text(clean(b.name).toUpperCase(), m, y);
    y += rh * 0.8;
    const n = Math.max(b.items.length, 3);
    for (let i = 0; i < n; i++) {
      const it = b.items[i]; const ry = y + i * rh;
      d.setDrawColor(...line); d.setLineWidth(0.25); d.line(m, ry + rh - 1.5, W - m, ry + rh - 1.5);
      d.setDrawColor(...grey); d.setLineWidth(0.3); d.roundedRect(W - m - 5.5, ry + rh / 2 - 3.2, 5, 5, 1, 1, 'S');
      d.setFont('helvetica', 'bold'); d.setFontSize(9.5); d.setTextColor(...grey); if (it?.time) d.text(clean(it.time), m + 1, ry + rh / 2 + 0.8);
      d.setFont('helvetica', 'normal'); d.setFontSize(11); d.setTextColor(...ink); if (it?.text) d.text(clean(it.text), m + 24, ry + rh / 2 + 0.8, { maxWidth: W - 2 * m - 34 });
    }
    y += n * rh + rh * 0.8;
  }
  credit(d, o.credit, W, H);
  return d;
}

export function pdfUrl(d: JsPDF) { return URL.createObjectURL(d.output('blob')); }
export function savePdf(d: JsPDF, filename: string) { d.save(filename); }
export function printPdf(d: JsPDF) {
  const url = pdfUrl(d);
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; f.src = url;
  f.onload = () => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch { window.open(url, '_blank'); } setTimeout(() => { f.remove(); URL.revokeObjectURL(url); }, 60000); };
  document.body.appendChild(f);
}
