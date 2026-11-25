import { load, save, uid, KEYS } from '../lib/storage';
import { today, addDays, startOfWeek, daysInMonth, MONTHS, DOW, ymd, parse, fmtLong } from '../lib/dates';
import { buildTracker, savePdf, printPdf } from '../lib/pdf';
import { track } from '../lib/analytics';
import { esc, CHECK, ring } from '../lib/ui';

type Store = { habits: { id: string; name: string }[]; log: Record<string, string[]> };
const root = document.getElementById('grid-root');
if (root) {
  const mode = (root.dataset.mode as 'week' | 'month') ?? 'week';
  const T = today(); let anchor = T; let paper: 'a4' | 'letter' = 'letter'; let used = false;
  const st = load<Store>(KEYS.grid, { habits: [], log: {} });
  const persist = () => { save(KEYS.grid, st); if (!used) { used = true; track('tool_use', { tool: mode === 'week' ? 'weekly_planner' : 'monthly_calendar' }); } };
  const on = (id: string, d: string) => (st.log[id] ?? []).includes(d);
  function days() {
    if (mode === 'week') { const s = startOfWeek(anchor, 1); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); }
    const a = parse(anchor); return Array.from({ length: daysInMonth(a.getFullYear(), a.getMonth()) }, (_, i) => ymd(new Date(a.getFullYear(), a.getMonth(), i + 1)));
  }
  function render() {
    const ds = days(); const a = parse(anchor);
    const title = mode === 'week' ? `${fmtLong(ds[0])} – ${fmtLong(ds[6])}` : `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
    let possible = 0, doneN = 0; for (const h of st.habits) for (const d of ds) if (d <= T) { possible++; if (on(h.id, d)) doneN++; }
    root!.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-2"><button class="btn btn-sm" data-nav="-1" aria-label="Previous ${mode}">←</button><h2 class="min-w-48 text-center font-display text-lg font-bold">${title}</h2><button class="btn btn-sm" data-nav="1" aria-label="Next ${mode}">→</button><button class="btn btn-sm" data-nav="0">${mode === 'week' ? 'This week' : 'This month'}</button></div>${st.habits.length ? `<div class="flex items-center gap-3">${ring(possible ? doneN / possible : 0, `${doneN} of ${possible} check-ins done`, 56)}<p class="text-sm text-muted">${doneN} of ${possible}<br>check-ins</p></div>` : ''}</div>
      <form data-add class="mt-4 flex max-w-lg gap-2"><label class="sr-only" for="gr-new">New habit</label><input id="gr-new" name="name" class="field" placeholder="Add a habit, e.g. Stretch for 5 minutes" maxlength="50" required><button class="btn btn-primary" type="submit">Add</button></form>
      ${st.habits.length ? `<div class="mt-5 overflow-x-auto"><table class="w-full border-collapse text-sm" style="min-width:${mode === 'month' ? '56rem' : '34rem'}"><thead><tr><th scope="col" class="py-2 text-left font-medium text-muted">Habit</th>${ds.map((d) => `<th scope="col" class="px-0.5 py-2 text-center font-medium ${d === T ? 'text-accent-ink' : 'text-muted'}">${mode === 'month' ? `<span class="text-xs">${DOW[parse(d).getDay()][0]}</span><br>${parse(d).getDate()}` : `${DOW[parse(d).getDay()]}<br><span class="text-xs">${parse(d).getDate()}</span>`}</th>`).join('')}<th></th></tr></thead>
      <tbody>${st.habits.map((h) => `<tr class="border-t border-line"><th scope="row" class="max-w-48 truncate py-1.5 pr-2 text-left font-semibold">${esc(h.name)}</th>${ds.map((d) => `<td class="px-0.5 py-1 text-center">${d > T ? '<span class="text-line">·</span>' : `<button type="button" class="check ${mode === 'month' ? '!size-6' : ''}" data-id="${h.id}" data-d="${d}" aria-pressed="${on(h.id, d)}" aria-label="${esc(h.name)}, ${fmtLong(d)}">${CHECK}</button>`}</td>`).join('')}<td class="pl-2"><button class="text-muted hover:text-red-500" data-del="${h.id}" aria-label="Delete ${esc(h.name)}">✕</button></td></tr>`).join('')}</tbody></table></div>
      <div class="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-5"><div><label class="label" for="gr-paper">Print paper</label><select id="gr-paper" class="field !w-auto"><option value="letter" ${paper === 'letter' ? 'selected' : ''}>US Letter</option><option value="a4" ${paper === 'a4' ? 'selected' : ''}>A4</option></select></div><button class="btn btn-primary" data-act="pdf">Download blank PDF of this ${mode}</button><button class="btn" data-act="print">Print</button></div>` : '<p class="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-muted">Add a habit above to start. Keep it to a few that matter.</p>'}
      <p class="mt-4 text-xs text-muted">Saved in this browser only.</p>`;
  }
  const pdf = () => { const a = parse(anchor); return buildTracker({ kind: mode === 'week' ? 'weekly' : 'monthly', paper, design: 'grid', color: '#f9a93a', title: mode === 'week' ? 'Weekly Habit Planner' : 'Monthly Habit Calendar', habits: st.habits.map((h) => h.name), minRows: 8, year: a.getFullYear(), month: a.getMonth(), weekStart: 1, notes: mode === 'week', credit: true }); };
  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement; const nav = t.closest<HTMLElement>('[data-nav]'); const cell = t.closest<HTMLElement>('[data-d]'); const del = t.closest<HTMLElement>('[data-del]'); const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (nav) { const n = Number(nav.dataset.nav); if (n === 0) anchor = T; else if (mode === 'week') anchor = addDays(anchor, 7 * n); else { const d = parse(anchor); d.setMonth(d.getMonth() + n, 1); anchor = ymd(d); } render(); }
    else if (cell) { const arr = st.log[cell.dataset.id!] ?? (st.log[cell.dataset.id!] = []); const i = arr.indexOf(cell.dataset.d!); i >= 0 ? arr.splice(i, 1) : arr.push(cell.dataset.d!); persist(); render(); root.querySelector<HTMLElement>(`[data-id="${cell.dataset.id}"][data-d="${cell.dataset.d}"]`)?.focus(); }
    else if (del) { if (confirm('Delete this habit and its history?')) { st.habits = st.habits.filter((h) => h.id !== del.dataset.del); delete st.log[del.dataset.del!]; persist(); render(); } }
    else if (act === 'pdf') { savePdf(await pdf(), `habon-${mode}ly-habit-${mode === 'week' ? 'planner' : 'calendar'}-${paper}.pdf`); track('pdf_download', { tool: mode === 'week' ? 'weekly_planner' : 'monthly_calendar', paper }); }
    else if (act === 'print') { printPdf(await pdf()); track('pdf_print', { tool: mode }); }
  });
  root.addEventListener('submit', (e) => { e.preventDefault(); const f = e.target as HTMLFormElement; if (!f.hasAttribute('data-add')) return; const name = String(new FormData(f).get('name')).trim(); if (name) { st.habits.push({ id: uid(), name }); persist(); render(); root.querySelector<HTMLInputElement>('#gr-new')?.focus(); } });
  root.addEventListener('change', (e) => { const t = e.target as HTMLSelectElement; if (t.id === 'gr-paper') paper = t.value as 'a4' | 'letter'; });
  render();
}
