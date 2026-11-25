import { load, save, uid, KEYS } from '../lib/storage';
import { today, diffDays, fmtLong } from '../lib/dates';
import { track } from '../lib/analytics';
import { esc, ring } from '../lib/ui';

type Goal = { id: string; title: string; why: string; deadline: string; milestones: { id: string; text: string; done: boolean }[]; actions: string; created: string };
const root = document.getElementById('goals-root');
if (root) {
  const T = today(); let goals = load<Goal[]>(KEYS.goals, []); let used = false;
  const persist = () => { save(KEYS.goals, goals); if (!used) { used = true; track('tool_use', { tool: 'goal_planner' }); } };
  function render() {
    root!.innerHTML = `<form data-new class="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end"><div class="sm:col-span-3"><p class="font-display text-lg font-bold">New goal</p><p class="text-sm text-muted">Make it specific: what will be true, and by when?</p></div>
      <div><label class="label" for="g-title">Goal</label><input id="g-title" name="title" class="field" required maxlength="90" placeholder="e.g. Run a 5K without stopping"></div>
      <div><label class="label" for="g-date">Target date</label><input id="g-date" name="deadline" type="date" class="field" min="${T}"></div><button class="btn btn-primary" type="submit">Add goal</button>
      <div class="sm:col-span-3"><label class="label" for="g-why">Why it matters (optional)</label><input id="g-why" name="why" class="field" maxlength="140"></div></form>
      <div class="mt-6 space-y-6">${goals.length ? goals.map((g) => { const done = g.milestones.filter((m) => m.done).length; const p = g.milestones.length ? done / g.milestones.length : 0; const left = g.deadline ? diffDays(T, g.deadline) : null;
        return `<article class="rounded-2xl border border-line p-5" aria-label="${esc(g.title)}"><div class="flex flex-wrap items-start justify-between gap-4"><div class="min-w-0 flex-1"><h2 class="font-display text-xl font-bold">${esc(g.title)}</h2>${g.why ? `<p class="mt-1 text-sm text-muted">Why: ${esc(g.why)}</p>` : ''}<p class="mt-1 text-sm">${g.deadline ? (left! >= 0 ? `${left} day${left === 1 ? '' : 's'} left · target ${fmtLong(g.deadline)}` : `Target date passed (${fmtLong(g.deadline)})`) : 'No target date'}</p></div>${ring(p, `${done} of ${g.milestones.length} milestones done`, 72)}</div>
        <h3 class="mt-4 text-sm font-bold">Milestones</h3><ul class="mt-2 space-y-1.5">${g.milestones.map((m) => `<li class="flex items-center gap-2"><label class="flex flex-1 cursor-pointer items-center gap-2"><input type="checkbox" class="size-4 accent-[var(--accent)]" data-ms="${g.id}:${m.id}" ${m.done ? 'checked' : ''}><span class="${m.done ? 'text-muted line-through' : ''}">${esc(m.text)}</span></label><button class="text-muted hover:text-red-500" data-delms="${g.id}:${m.id}" aria-label="Delete milestone ${esc(m.text)}">✕</button></li>`).join('') || '<li class="text-sm text-muted">Break the goal into 3 to 5 checkpoints.</li>'}</ul>
        <form data-addms="${g.id}" class="mt-2 flex gap-2"><label class="sr-only" for="ms-${g.id}">New milestone</label><input id="ms-${g.id}" name="text" class="field !min-h-9 text-sm" placeholder="Add a milestone" maxlength="90" required><button class="btn btn-sm" type="submit">Add</button></form>
        <label class="label mt-4" for="ac-${g.id}">This week's actions</label><textarea id="ac-${g.id}" class="field text-sm" rows="2" data-actions="${g.id}" maxlength="300" placeholder="The 2 or 3 things you will do this week">${esc(g.actions)}</textarea>
        <button class="btn btn-sm btn-danger mt-3" data-delgoal="${g.id}">Delete goal</button></article>`; }).join('') : '<p class="rounded-2xl border border-dashed border-line p-6 text-center text-muted">No goals yet. Add one above.</p>'}</div><p class="mt-4 text-xs text-muted">Saved in this browser only.</p>`;
  }
  root.addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target as HTMLFormElement; const d = new FormData(f);
    if (f.hasAttribute('data-new')) { goals.unshift({ id: uid(), title: String(d.get('title')).trim(), why: String(d.get('why') ?? '').trim(), deadline: String(d.get('deadline') ?? ''), milestones: [], actions: '', created: T }); persist(); render(); track('goal_created', { tool: 'goal_planner' }); }
    else if (f.dataset.addms) { const g = goals.find((x) => x.id === f.dataset.addms)!; g.milestones.push({ id: uid(), text: String(d.get('text')).trim(), done: false }); persist(); render(); root.querySelector<HTMLInputElement>(`#ms-${g.id}`)?.focus(); }
  });
  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement; const dg = t.closest<HTMLElement>('[data-delgoal]')?.dataset.delgoal; const dm = t.closest<HTMLElement>('[data-delms]')?.dataset.delms;
    if (dg && confirm('Delete this goal?')) { goals = goals.filter((g) => g.id !== dg); persist(); render(); }
    if (dm) { const [gid, mid] = dm.split(':'); const g = goals.find((x) => x.id === gid)!; g.milestones = g.milestones.filter((m) => m.id !== mid); persist(); render(); }
  });
  root.addEventListener('change', (e) => { const t = e.target as HTMLInputElement; if (t.dataset.ms) { const [gid, mid] = t.dataset.ms.split(':'); goals.find((g) => g.id === gid)!.milestones.find((m) => m.id === mid)!.done = t.checked; persist(); render(); } });
  root.addEventListener('input', (e) => { const t = e.target as HTMLTextAreaElement; if (t.dataset.actions) { goals.find((g) => g.id === t.dataset.actions)!.actions = t.value; save(KEYS.goals, goals); } });
  render();
}
