import { load, save, uid, KEYS } from '../lib/storage';
import { buildRoutine, savePdf, printPdf } from '../lib/pdf';
import { track } from '../lib/analytics';
import { esc } from '../lib/ui';

type Item = { id: string; time: string; text: string; done: boolean };
type Routine = { morning: Item[]; afternoon: Item[]; evening: Item[] };
const BLOCKS: [keyof Routine, string][] = [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']];
const EXAMPLE: Routine = {
  morning: [['6:30', 'Glass of water'], ['6:40', 'Stretch for 5 minutes'], ['7:00', 'Shower and get dressed'], ['7:30', 'Breakfast, no phone']].map(([time, text]) => ({ id: uid(), time, text, done: false })),
  afternoon: [['12:30', 'Lunch away from the desk'], ['15:00', 'Walk for 10 minutes']].map(([time, text]) => ({ id: uid(), time, text, done: false })),
  evening: [['19:00', 'Prep tomorrow'], ['21:30', 'Screens off'], ['22:00', 'Read 10 pages']].map(([time, text]) => ({ id: uid(), time, text, done: false })),
};
const root = document.getElementById('routine-root');
if (root) {
  const r: Routine = load<Routine>(KEYS.routine, { morning: [], afternoon: [], evening: [] });
  let paper: 'a4' | 'letter' = 'letter'; let used = false; let drag: { b: keyof Routine; id: string } | null = null;
  const persist = () => { save(KEYS.routine, r); if (!used) { used = true; track('tool_use', { tool: 'routine_planner' }); } };
  const fmtTime = (t: string) => { const m = t.match(/^(\d{1,2}):(\d{2})$/); if (!m) return t; const h = +m[1]; return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`; };

  function render() {
    const total = BLOCKS.reduce((a, [k]) => a + r[k].length, 0); const done = BLOCKS.reduce((a, [k]) => a + r[k].filter((i) => i.done).length, 0);
    root!.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3"><p class="text-sm text-muted">${total ? `${done} of ${total} done today. Drag the ⠿ handle to reorder, or use the arrows.` : 'Add tasks to each part of your day.'}</p><div class="flex flex-wrap gap-2">${total ? '<button class="btn btn-sm" data-act="uncheck">Uncheck all</button><button class="btn btn-sm" data-act="sort">Sort by time</button>' : '<button class="btn btn-sm" data-act="example">Load an example</button>'}</div></div>
      <div class="mt-5 grid gap-6 lg:grid-cols-3">${BLOCKS.map(([k, label]) => `<section aria-label="${label} routine" data-block="${k}" class="rounded-2xl border border-line p-4"><h2 class="font-display text-lg font-bold">${label}</h2>
        <ul class="mt-3 min-h-12 space-y-2" data-list="${k}">${r[k].map((it, i) => `<li draggable="true" data-id="${it.id}" class="flex items-center gap-2 rounded-xl border border-line bg-bg p-2"><span class="cursor-grab select-none px-1 text-muted" aria-hidden="true">⠿</span>
          <button type="button" class="check !size-7" data-act="done" data-b="${k}" data-id="${it.id}" aria-pressed="${it.done}" aria-label="Mark done: ${esc(it.text)}">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'}</button>
          <div class="min-w-0 flex-1"><input class="w-full bg-transparent text-sm font-semibold ${it.done ? 'text-muted line-through' : ''}" data-f="text" data-b="${k}" data-id="${it.id}" value="${esc(it.text)}" maxlength="80" aria-label="Task"><input type="time" class="mt-0.5 bg-transparent text-xs text-muted" data-f="time" data-b="${k}" data-id="${it.id}" value="${esc(it.time)}" aria-label="Time"></div>
          <div class="flex flex-col"><button class="px-1 text-xs leading-none text-muted hover:text-fg disabled:opacity-30" data-act="up" data-b="${k}" data-id="${it.id}" aria-label="Move up" ${i === 0 ? 'disabled' : ''}>▲</button><button class="px-1 text-xs leading-none text-muted hover:text-fg disabled:opacity-30" data-act="down" data-b="${k}" data-id="${it.id}" aria-label="Move down" ${i === r[k].length - 1 ? 'disabled' : ''}>▼</button></div>
          <button class="px-1 text-muted hover:text-red-500" data-act="del" data-b="${k}" data-id="${it.id}" aria-label="Delete ${esc(it.text)}">✕</button></li>`).join('')}</ul>
        <form data-add="${k}" class="mt-3 flex gap-2"><input type="time" name="time" class="field !min-h-9 !w-28 !px-2 text-sm" aria-label="Time for new ${label} task"><input name="text" class="field !min-h-9 text-sm" placeholder="Add a task" maxlength="80" required aria-label="New ${label} task"><button class="btn btn-sm" type="submit" aria-label="Add ${label} task">+</button></form></section>`).join('')}</div>
      <div class="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-5"><div><label class="label" for="rt-paper">Paper</label><select id="rt-paper" class="field !w-auto"><option value="letter" ${paper === 'letter' ? 'selected' : ''}>US Letter</option><option value="a4" ${paper === 'a4' ? 'selected' : ''}>A4</option></select></div><button class="btn btn-primary" data-act="pdf">Download printable schedule</button><button class="btn" data-act="print">Print</button></div>`;
  }
  const find = (b: keyof Routine, id: string) => r[b].findIndex((i) => i.id === id);
  const pdf = () => buildRoutine({ paper, color: '#f9a93a', title: 'Daily Routine', credit: true, blocks: BLOCKS.map(([k, n]) => ({ name: n, items: r[k].map((i) => ({ time: fmtTime(i.time), text: i.text })) })) });
  root.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!el) return; const act = el.dataset.act!; const b = el.dataset.b as keyof Routine; const id = el.dataset.id!;
    if (act === 'done') { const i = r[b][find(b, id)]; i.done = !i.done; persist(); render(); root.querySelector<HTMLElement>(`[data-act=done][data-id="${id}"]`)?.focus(); }
    else if (act === 'del') { r[b].splice(find(b, id), 1); persist(); render(); }
    else if (act === 'up' || act === 'down') { const i = find(b, id); const j = act === 'up' ? i - 1 : i + 1; [r[b][i], r[b][j]] = [r[b][j], r[b][i]]; persist(); render(); root.querySelector<HTMLElement>(`[data-act=${act}][data-id="${id}"]:not([disabled])`)?.focus(); }
    else if (act === 'uncheck') { BLOCKS.forEach(([k]) => r[k].forEach((i) => (i.done = false))); persist(); render(); }
    else if (act === 'sort') { BLOCKS.forEach(([k]) => r[k].sort((a, c) => (a.time || '99').localeCompare(c.time || '99'))); persist(); render(); }
    else if (act === 'example') { Object.assign(r, structuredClone(EXAMPLE)); persist(); render(); }
    else if (act === 'pdf') { savePdf(await pdf(), `habon-daily-routine-${paper}.pdf`); track('pdf_download', { tool: 'routine_planner', paper }); }
    else if (act === 'print') { printPdf(await pdf()); track('pdf_print', { tool: 'routine_planner' }); }
  });
  root.addEventListener('submit', (e) => { e.preventDefault(); const f = e.target as HTMLFormElement; const k = f.dataset.add as keyof Routine; const d = new FormData(f); r[k].push({ id: uid(), time: String(d.get('time') ?? ''), text: String(d.get('text')).trim(), done: false }); persist(); render(); root.querySelector<HTMLInputElement>(`[data-add="${k}"] [name=text]`)?.focus(); });
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement; if (t.id === 'rt-paper') { paper = t.value as 'a4' | 'letter'; return; }
    if (t.dataset.f) { const i = r[t.dataset.b as keyof Routine][find(t.dataset.b as keyof Routine, t.dataset.id!)]; (i as Record<string, unknown>)[t.dataset.f] = t.value; persist(); if (t.dataset.f === 'time') render(); }
  });
  root.addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.f === 'text') { const i = r[t.dataset.b as keyof Routine][find(t.dataset.b as keyof Routine, t.dataset.id!)]; i.text = t.value; save(KEYS.routine, r); } });
  // Drag and drop (mouse and touch-capable browsers that support HTML5 DnD)
  root.addEventListener('dragstart', (e) => { const li = (e.target as HTMLElement).closest<HTMLElement>('li[data-id]'); if (!li) return; drag = { b: li.parentElement!.dataset.list as keyof Routine, id: li.dataset.id! }; li.style.opacity = '.4'; e.dataTransfer!.effectAllowed = 'move'; e.dataTransfer!.setData('text/plain', drag.id); });
  root.addEventListener('dragend', () => { drag = null; render(); });
  root.addEventListener('dragover', (e) => { if (drag && (e.target as HTMLElement).closest('[data-block]')) e.preventDefault(); });
  root.addEventListener('drop', (e) => {
    if (!drag) return; const block = (e.target as HTMLElement).closest<HTMLElement>('[data-block]'); if (!block) return; e.preventDefault();
    const to = block.dataset.block as keyof Routine; const over = (e.target as HTMLElement).closest<HTMLElement>('li[data-id]');
    const [item] = r[drag.b].splice(find(drag.b, drag.id), 1); const idx = over ? find(to, over.dataset.id!) : r[to].length; r[to].splice(idx < 0 ? r[to].length : idx, 0, item); drag = null; persist(); render();
  });
  render();
}
