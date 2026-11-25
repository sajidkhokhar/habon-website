import { load, save, uid, KEYS } from '../lib/storage';
import { track } from '../lib/analytics';
import { esc } from '../lib/ui';

type Block = { text: string; min: number; tags: string[]; core?: boolean };
const LIB: Record<'morning' | 'evening', Block[]> = {
  morning: [
    { text: 'Drink a glass of water', min: 2, tags: ['energy', 'fitness', 'calm', 'focus'], core: true },
    { text: 'Make your bed', min: 2, tags: ['focus', 'calm'] },
    { text: 'Stretch or mobility flow', min: 8, tags: ['energy', 'fitness', 'calm'] },
    { text: 'Short workout or brisk walk', min: 25, tags: ['fitness', 'energy'] },
    { text: 'Breathing or meditation', min: 7, tags: ['calm', 'focus'] },
    { text: 'Shower and get ready', min: 20, tags: ['energy', 'fitness', 'calm', 'focus'], core: true },
    { text: 'Eat breakfast without a screen', min: 15, tags: ['energy', 'fitness', 'calm', 'focus'], core: true },
    { text: 'Write your top three tasks', min: 5, tags: ['focus'] },
    { text: 'Read for 10 minutes', min: 10, tags: ['calm', 'focus'] },
    { text: 'Journal three lines', min: 5, tags: ['calm', 'focus'] },
    { text: 'Step outside for daylight', min: 5, tags: ['energy', 'calm', 'fitness'] },
    { text: 'Review today\'s calendar', min: 3, tags: ['focus'] },
  ],
  evening: [
    { text: 'Tidy the main living space', min: 10, tags: ['calm', 'focus', 'reset'] },
    { text: 'Prepare tomorrow\'s clothes and bag', min: 7, tags: ['focus', 'reset'], core: true },
    { text: 'Write tomorrow\'s top three tasks', min: 5, tags: ['focus', 'reset'] },
    { text: 'Screens off', min: 1, tags: ['calm', 'sleep', 'reset', 'focus'], core: true },
    { text: 'Gentle stretch', min: 8, tags: ['calm', 'sleep'] },
    { text: 'Warm shower or wash up', min: 15, tags: ['calm', 'sleep', 'reset', 'focus'], core: true },
    { text: 'Skincare and brush teeth', min: 8, tags: ['calm', 'sleep', 'reset', 'focus'], core: true },
    { text: 'Journal or note one win', min: 5, tags: ['calm', 'reset'] },
    { text: 'Read something paper or low-light', min: 20, tags: ['sleep', 'calm'] },
    { text: 'Breathing or body scan', min: 7, tags: ['sleep', 'calm'] },
    { text: 'Set an alarm and charge your phone away from the bed', min: 2, tags: ['sleep'], core: true },
  ],
};
const FOCUS: Record<'morning' | 'evening', [string, string][]> = {
  morning: [['energy', 'More energy'], ['focus', 'Focus and planning'], ['calm', 'A calm start'], ['fitness', 'Movement first']],
  evening: [['sleep', 'Better sleep'], ['calm', 'Wind down'], ['reset', 'Reset for tomorrow'], ['focus', 'Quick and simple']],
};
const root = document.getElementById('routinegen-root');
if (root) {
  const kind = (root.dataset.kind as 'morning' | 'evening') ?? 'morning'; let used = false;
  let result: { time: string; text: string; min: number }[] = [];
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m: number) => { const mm = ((m % 1440) + 1440) % 1440; const h = Math.floor(mm / 60); return `${h % 12 || 12}:${String(mm % 60).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
  root.innerHTML = `<form class="grid gap-4 sm:grid-cols-3 sm:items-end"><div><label class="label" for="rg-time">${kind === 'morning' ? 'I wake up at' : 'I want to be in bed by'}</label><input id="rg-time" type="time" class="field" value="${kind === 'morning' ? '07:00' : '22:30'}" required></div>
    <div><label class="label" for="rg-min">Minutes available</label><input id="rg-min" type="number" class="field" min="10" max="180" step="5" value="${kind === 'morning' ? 60 : 45}"></div>
    <div><label class="label" for="rg-focus">Focus</label><select id="rg-focus" class="field">${FOCUS[kind].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
    <div class="sm:col-span-3"><button class="btn btn-primary" type="submit">Generate my ${kind} routine</button></div></form><div id="rg-out" class="mt-6" aria-live="polite"></div>`;
  const out = root.querySelector<HTMLElement>('#rg-out')!;
  function show() {
    out.innerHTML = result.length ? `<ol class="divide-y divide-line border-y border-line">${result.map((r) => `<li class="flex items-baseline gap-4 py-3"><span class="w-20 shrink-0 text-sm font-bold text-accent-ink">${r.time}</span><span class="flex-1 font-semibold">${esc(r.text)}</span><span class="text-sm text-muted">${r.min} min</span></li>`).join('')}</ol>
      <p class="mt-3 text-sm text-muted">Total ${result.reduce((a, r) => a + r.min, 0)} minutes. Swap anything that does not fit your life, and start with fewer steps if this feels like a lot.</p>
      <div class="mt-4 flex flex-wrap gap-2"><button class="btn btn-sm" data-act="shuffle">Try a different mix</button><button class="btn btn-sm" data-act="copy">Copy as text</button><button class="btn btn-sm btn-primary" data-act="send">Send to routine planner</button></div>` : '<p class="text-muted">Those settings leave no room. Increase the minutes available.</p>';
  }
  function generate() {
    const time = (root!.querySelector('#rg-time') as HTMLInputElement).value; const avail = Number((root!.querySelector('#rg-min') as HTMLInputElement).value) || 30; const focus = (root!.querySelector('#rg-focus') as HTMLSelectElement).value;
    const pool = LIB[kind].map((b) => ({ ...b, score: (b.core ? 3 : 0) + (b.tags.includes(focus) ? 2 : 0) + Math.random() * 1.6 })).sort((a, b) => b.score - a.score);
    const picked: Block[] = []; let used_ = 0; for (const b of pool) if (used_ + b.min <= avail) { picked.push(b); used_ += b.min; }
    // Keep a sensible order within the original library sequence
    picked.sort((a, b) => LIB[kind].indexOf(a) - LIB[kind].indexOf(b));
    let cursor = kind === 'morning' ? toMin(time) : toMin(time) - used_;
    result = picked.map((b) => { const r = { time: fmt(cursor), text: b.text, min: b.min }; cursor += b.min; return r; });
    show(); if (!used) { used = true; track('tool_use', { tool: kind + '_routine_generator' }); }
  }
  root.querySelector('form')!.addEventListener('submit', (e) => { e.preventDefault(); generate(); });
  out.addEventListener('click', async (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act === 'shuffle') generate();
    if (act === 'copy') { try { await navigator.clipboard.writeText(result.map((r) => `${r.time}  ${r.text}`).join('\n')); (e.target as HTMLElement).textContent = 'Copied'; } catch { (e.target as HTMLElement).textContent = 'Copy failed'; } }
    if (act === 'send') {
      const to24 = (s: string) => { const m = s.match(/(\d+):(\d+) (AM|PM)/)!; let h = +m[1] % 12; if (m[3] === 'PM') h += 12; return `${String(h).padStart(2, '0')}:${m[2]}`; };
      const r = load<Record<string, unknown[]>>(KEYS.routine, { morning: [], afternoon: [], evening: [] });
      r[kind] = result.map((x) => ({ id: uid(), time: to24(x.time), text: x.text, done: false })); save(KEYS.routine, r);
      out.insertAdjacentHTML('beforeend', '<p class="mt-3 text-sm" role="status">Sent. <a class="font-semibold underline" href="/daily-routine-planner/">Open the routine planner</a> to reorder or print it.</p>');
      track('routine_sent_to_planner', { kind });
    }
  });
}
