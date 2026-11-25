import { IDEAS } from '../lib/ideas';
import { load, save, uid, KEYS } from '../lib/storage';
import { today } from '../lib/dates';
import { track } from '../lib/analytics';
import { esc } from '../lib/ui';

const root = document.getElementById('ideas-root');
if (root) {
  const cats = Object.keys(IDEAS); let cat = 'All'; let shown: [string, string][] = []; let used = false;
  const pool = () => (cat === 'All' ? cats.flatMap((c) => IDEAS[c].map((i) => [c, i] as [string, string])) : IDEAS[cat].map((i) => [cat, i] as [string, string]));
  function shuffle() { const p = pool(); for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } shown = p.slice(0, 8); if (!used) { used = true; track('tool_use', { tool: 'habit_ideas' }); } render(); }
  function render() {
    root!.innerHTML = `<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Category">${['All', ...cats].map((c) => `<button type="button" class="chip hover:border-fg ${c === cat ? '!border-fg !bg-fg !text-bg' : ''}" data-cat="${c}" aria-pressed="${c === cat}">${c}</button>`).join('')}</div>
      <div class="mt-5 flex items-center justify-between"><p class="text-sm text-muted" role="status">${shown.length} ideas · tap + to add one to your free online tracker</p><button class="btn btn-primary" data-act="shuffle">Shuffle ideas</button></div>
      <ul class="mt-3 divide-y divide-line border-y border-line">${shown.map(([c, i], n) => `<li class="flex items-center gap-3 py-3"><div class="min-w-0 flex-1"><p class="font-semibold">${esc(i)}</p><p class="text-xs text-muted">${c}</p></div><button class="btn btn-sm" data-act="add" data-n="${n}" aria-label="Add ${esc(i)} to my tracker">+ Add</button><button class="btn btn-sm" data-act="copy" data-n="${n}" aria-label="Copy ${esc(i)}">Copy</button></li>`).join('')}</ul>
      <p class="mt-3 text-sm text-muted"><a class="font-semibold underline" href="/online-habit-tracker/">Open your tracker</a> to see the habits you have added.</p>`;
  }
  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement; const cb = t.closest<HTMLElement>('[data-cat]'); const b = t.closest<HTMLElement>('[data-act]');
    if (cb) { cat = cb.dataset.cat!; shuffle(); return; }
    if (!b) return; const act = b.dataset.act;
    if (act === 'shuffle') shuffle();
    else if (act === 'add') { const [c, i] = shown[Number(b.dataset.n)]; const s = load<{ habits: unknown[]; log: object; weekStart: number }>(KEYS.tracker, { habits: [], log: {}, weekStart: 0 }); (s.habits as object[]).push({ id: uid(), name: i, category: ['Health', 'Fitness', 'Mind', 'Learning', 'Home', 'Social', 'Money'].includes(c) ? c : 'Other', color: '#f9a93a', freq: 'daily', target: 1, created: today() }); save(KEYS.tracker, s); b.textContent = 'Added ✓'; b.setAttribute('disabled', ''); track('habit_idea_added', { category: c }); }
    else if (act === 'copy') { try { await navigator.clipboard.writeText(shown[Number(b.dataset.n)][1]); b.textContent = 'Copied'; } catch { b.textContent = 'Copy failed'; } }
  });
  shuffle();
}
