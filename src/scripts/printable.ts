import { buildTracker, buildChallenge, pdfUrl, savePdf, printPdf, type TrackerOpts, type Design } from '../lib/pdf';
import { load, save, KEYS } from '../lib/storage';
import { MONTHS } from '../lib/dates';
import { track } from '../lib/analytics';

const COLORS = ['#f9a93a', '#e5604d', '#e0508b', '#8e6be0', '#4c8df6', '#2cb7a8', '#4caf63', '#3a3a3f'];
const now = new Date();
const defaults: TrackerOpts = { kind: 'weekly', paper: 'letter', design: 'grid', color: COLORS[0], title: 'Weekly Habit Tracker', habits: ['Drink water', 'Move for 20 minutes', 'Read 10 pages', 'Tidy for 10 minutes', 'Sleep by 11pm'], minRows: 10, year: now.getFullYear(), month: now.getMonth(), weekStart: 1, notes: true, credit: true };

const root = document.getElementById('printable-root');
if (root) {
  const o: TrackerOpts = { ...defaults, ...load<Partial<TrackerOpts>>(KEYS.printable, {}) };
  const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>('#' + id)!;
  const sync = () => {
    $<HTMLInputElement>('pt-title').value = o.title; $<HTMLTextAreaElement>('pt-habits').value = o.habits.join('\n');
    $<HTMLSelectElement>('pt-paper').value = o.paper; $<HTMLSelectElement>('pt-design').value = o.design; $<HTMLSelectElement>('pt-ws').value = String(o.weekStart);
    $<HTMLInputElement>('pt-rows').value = String(o.minRows); $<HTMLSelectElement>('pt-month').value = String(o.month); $<HTMLInputElement>('pt-year').value = String(o.year);
    $<HTMLInputElement>('pt-notes').checked = o.notes; $<HTMLInputElement>('pt-credit').checked = o.credit;
    root.querySelectorAll<HTMLInputElement>('[name=pt-kind]').forEach((r) => (r.checked = r.value === o.kind));
    root.querySelectorAll<HTMLInputElement>('[name=pt-color]').forEach((r) => (r.checked = r.value === o.color));
    root.querySelectorAll<HTMLElement>('[data-monthly]').forEach((e) => (e.hidden = o.kind !== 'monthly'));
    root.querySelectorAll<HTMLElement>('[data-weekly]').forEach((e) => (e.hidden = o.kind !== 'weekly'));
  };
  let url = '', timer = 0, seq = 0;
  async function preview() {
    const my = ++seq; const doc = await buildTracker(o); if (my !== seq) return;
    const u = pdfUrl(doc); const f = $<HTMLIFrameElement>('pt-frame'); const old = url; url = u; f.src = u + '#toolbar=0&navpanes=0&view=FitH'; if (old) setTimeout(() => URL.revokeObjectURL(old), 3000);
  }
  const changed = () => { save(KEYS.printable, o); clearTimeout(timer); timer = window.setTimeout(preview, 250); };
  root.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    switch (t.id || t.name) {
      case 'pt-title': o.title = t.value; break;
      case 'pt-habits': o.habits = t.value.split('\n').slice(0, 20); break;
      case 'pt-paper': o.paper = t.value as TrackerOpts['paper']; break;
      case 'pt-design': o.design = t.value as Design; break;
      case 'pt-ws': o.weekStart = Number(t.value) as 0 | 1; break;
      case 'pt-rows': o.minRows = Math.min(20, Math.max(1, Number(t.value) || 8)); break;
      case 'pt-month': o.month = Number(t.value); break;
      case 'pt-year': o.year = Math.min(2100, Math.max(2000, Number(t.value) || now.getFullYear())); break;
      case 'pt-notes': o.notes = t.checked; break;
      case 'pt-credit': o.credit = t.checked; break;
      case 'pt-kind': o.kind = t.value as TrackerOpts['kind']; if (/^(Weekly|Monthly) Habit Tracker$/.test(o.title)) o.title = o.kind === 'weekly' ? 'Weekly Habit Tracker' : 'Monthly Habit Tracker'; break;
      case 'pt-color': o.color = t.value; break;
    }
    sync(); changed();
  });
  root.querySelector('#pt-dl')!.addEventListener('click', async () => { const d = await buildTracker(o); savePdf(d, `habon-${o.kind}-habit-tracker-${o.paper}.pdf`); track('pdf_download', { tool: 'printable_habit_tracker', kind: o.kind, paper: o.paper, design: o.design }); });
  root.querySelector('#pt-print')!.addEventListener('click', async () => { printPdf(await buildTracker(o)); track('pdf_print', { tool: 'printable_habit_tracker', kind: o.kind }); });
  sync(); preview();
}

// One-click presets on the PDF hub page
document.querySelectorAll<HTMLElement>('[data-pdf-preset]').forEach((b) => {
  b.addEventListener('click', async () => {
    const [kind, paper, design] = b.dataset.pdfPreset!.split(':');
    const label = b.textContent; b.setAttribute('aria-busy', 'true'); b.textContent = 'Preparing PDF…';
    try {
      let d;
      if (kind === 'challenge') d = await buildChallenge({ paper: paper as 'a4' | 'letter', color: '#f9a93a', name: '', goal: '', days: 30, credit: true, design: design as Design });
      else d = await buildTracker({ ...defaults, kind: kind as 'weekly' | 'monthly', paper: paper as 'a4' | 'letter', design: design as Design, habits: [], title: kind === 'weekly' ? 'Weekly Habit Tracker' : 'Monthly Habit Tracker', minRows: kind === 'weekly' ? 10 : 12 });
      savePdf(d, `habon-${kind}-habit-tracker-${paper}.pdf`);
      track('pdf_download', { tool: 'pdf_presets', kind, paper, design });
    } finally { b.textContent = label; b.removeAttribute('aria-busy'); }
  });
});
