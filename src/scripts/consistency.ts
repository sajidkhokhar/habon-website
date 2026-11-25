import { track } from '../lib/analytics';
import { ring } from '../lib/ui';
const root = document.getElementById('consistency-root');
if (root) {
  let used = false;
  root.innerHTML = `<form class="grid gap-4 sm:grid-cols-3 sm:items-end"><div><label class="label" for="cc-planned">Days you planned to do it</label><input id="cc-planned" type="number" min="1" max="3650" class="field" value="30" required></div><div><label class="label" for="cc-done">Days you actually did it</label><input id="cc-done" type="number" min="0" max="3650" class="field" value="21" required></div><div><label class="label" for="cc-twice">Times you missed two days in a row <span class="font-normal">(optional)</span></label><input id="cc-twice" type="number" min="0" max="365" class="field" value="2"></div></form><div id="cc-out" class="mt-6" aria-live="polite"></div>`;
  const out = root.querySelector<HTMLElement>('#cc-out')!;
  const calc = () => {
    const planned = Math.max(1, Number((root.querySelector('#cc-planned') as HTMLInputElement).value) || 1); const done = Math.min(planned, Math.max(0, Number((root.querySelector('#cc-done') as HTMLInputElement).value) || 0)); const twice = Math.max(0, Number((root.querySelector('#cc-twice') as HTMLInputElement).value) || 0);
    const p = done / planned; const missed = planned - done;
    const label = p >= 0.9 ? 'Very consistent' : p >= 0.75 ? 'Consistent' : p >= 0.5 ? 'Building' : 'Just getting started';
    const need80 = p >= 0.8 ? 0 : Math.ceil((0.8 * planned - done) / 0.2); const need90 = p >= 0.9 ? 0 : Math.ceil((0.9 * planned - done) / 0.1);
    out.innerHTML = `<div class="flex flex-wrap items-center gap-6">${ring(p, `Consistency ${Math.round(p * 100)} percent`, 110)}<div><p class="font-display text-2xl font-bold">${label}</p><p class="text-muted">${done} of ${planned} days · ${missed} missed</p></div></div>
      <dl class="mt-6 grid gap-5 sm:grid-cols-3"><div class="stat"><b>${(done / planned * 7).toFixed(1)}</b><span>Average days per week</span></div><div class="stat"><b>${need80 ? need80 : '✓'}</b><span>${need80 ? 'Perfect days in a row to reach 80%' : 'Already at or above 80%'}</span></div><div class="stat"><b>${need90 ? need90 : '✓'}</b><span>${need90 ? 'Perfect days in a row to reach 90%' : 'Already at or above 90%'}</span></div></dl>
      <p class="mt-5 rounded-xl bg-soft p-4 text-sm">${twice > 0 ? `You missed two days in a row ${twice} time${twice === 1 ? '' : 's'}. Single misses are normal; the useful rule is to avoid a second one. ` : 'No back-to-back misses, which is the pattern that matters most. '}Habits are not all-or-nothing: 80% is a strong, sustainable target for most people.</p>`;
    if (!used) { used = true; track('tool_use', { tool: 'consistency_calculator' }); }
  };
  root.addEventListener('input', calc); calc(); used = false;
}
