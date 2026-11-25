import { load, save, KEYS } from '../lib/storage';
import { today, addDays, diffDays, fmtLong, parse } from '../lib/dates';
import { CHALLENGES } from '../lib/challenges';
import { buildChallenge, savePdf, printPdf, type Design } from '../lib/pdf';
import { track } from '../lib/analytics';
import { esc, ring } from '../lib/ui';

type State = { name: string; start: string; done: number[]; goal: string; days: number };
const root = document.getElementById('challenge-root');
if (root) {
  const T = today();
  const st: State = load<State>(KEYS.challenge, { name: '', start: T, done: [], goal: '', days: 30 });
  let paper: 'a4' | 'letter' = 'letter'; let design: Design = 'grid'; let used = false;
  const persist = () => { save(KEYS.challenge, st); };
  const dayNo = () => Math.max(0, diffDays(st.start, T) + 1);

  function streaks() {
    const set = new Set(st.done); let longest = 0, run = 0; for (let i = 1; i <= st.days; i++) { if (set.has(i)) { run++; longest = Math.max(longest, run); } else run = 0; }
    const upto = Math.min(dayNo(), st.days); let cur = 0; let i = set.has(upto) ? upto : upto - 1; while (i >= 1 && set.has(i)) { cur++; i--; }
    return { longest, cur };
  }
  function render() {
    const { longest, cur } = streaks(); const n = st.done.length; const dn = dayNo(); const left = st.days - n;
    const started = dn >= 1; const finished = n >= st.days;
    root!.innerHTML = `<div class="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div class="space-y-4"><div><label class="label" for="ch-pick">Start from a ready-made challenge</label><select id="ch-pick" class="field"><option value="">Choose…</option>${CHALLENGES.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div><label class="label" for="ch-name">Or write your own</label><input id="ch-name" class="field" maxlength="70" value="${esc(st.name)}" placeholder="e.g. Practice guitar for 15 minutes"></div>
        <div><label class="label" for="ch-goal">Why does this matter to you? (optional)</label><input id="ch-goal" class="field" maxlength="120" value="${esc(st.goal)}"></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label" for="ch-start">Start date</label><input id="ch-start" type="date" class="field" value="${st.start}"></div><div><label class="label" for="ch-len">Length</label><select id="ch-len" class="field">${[7, 14, 21, 30].map((d) => `<option value="${d}" ${st.days === d ? 'selected' : ''}>${d} days</option>`).join('')}</select></div></div>
        <p class="text-sm text-muted">${st.name ? esc(CHALLENGES.find((c) => c.name === st.name)?.note ?? '') : 'Pick one clear action you can finish in a few minutes.'}</p>
        <div class="grid grid-cols-2 gap-3 border-t border-line pt-4"><div><label class="label" for="ch-paper">Paper</label><select id="ch-paper" class="field"><option value="letter" ${paper === 'letter' ? 'selected' : ''}>US Letter</option><option value="a4" ${paper === 'a4' ? 'selected' : ''}>A4</option></select></div><div><label class="label" for="ch-design">Printed style</label><select id="ch-design" class="field"><option value="grid">Outline</option><option value="dots" ${design === 'dots' ? 'selected' : ''}>Filled dots</option><option value="bold" ${design === 'bold' ? 'selected' : ''}>Bold header</option><option value="minimal" ${design === 'minimal' ? 'selected' : ''}>Minimal</option></select></div></div>
        <div class="flex flex-wrap gap-2"><button class="btn btn-primary btn-sm" data-act="pdf">Download printable sheet</button><button class="btn btn-sm" data-act="print">Print</button><button class="btn btn-sm btn-danger" data-act="reset">Restart</button></div></div>
      <div><div class="flex items-center gap-5">${ring(n / st.days, `${n} of ${st.days} days done`)}<div><p class="font-display text-xl font-bold">${esc(st.name || 'Your challenge')}</p><p class="text-sm text-muted">${!started ? `Starts ${fmtLong(st.start)}` : finished ? 'Challenge complete. Nicely done.' : `Day ${Math.min(dn, st.days)} of ${st.days} · ${left} to go`}</p></div></div>
        <div class="mt-5 grid grid-cols-3 gap-4"><div class="stat"><b>${n}</b><span>Days done</span></div><div class="stat"><b>${cur}</b><span>Current streak</span></div><div class="stat"><b>${longest}</b><span>Best streak</span></div></div>
        <div class="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-6" role="group" aria-label="Challenge days">${Array.from({ length: st.days }, (_, i) => { const d = i + 1; const on = st.done.includes(d); const fut = d > dn; const date = addDays(st.start, i); return `<button type="button" data-day="${d}" aria-pressed="${on}" aria-label="Day ${d}, ${fmtLong(date)}${on ? ', done' : ''}" class="aspect-square rounded-full border-2 text-sm font-bold ${d === dn ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--raised)]' : ''}" style="${on ? 'background:var(--accent);border-color:var(--accent);color:#1c1c1e' : `border-color:var(--line);${fut ? 'opacity:.55' : ''}`}">${on ? '✓' : d}</button>`; }).join('')}</div>
        ${finished ? '<p class="mt-5 rounded-xl bg-soft p-4 text-sm">You finished. Decide now what comes next: keep the habit going, raise the bar slightly, or start a new challenge.</p>' : ''}</div></div>`;
  }
  const doc = () => buildChallenge({ paper, color: '#f9a93a', name: st.name, goal: st.goal, days: st.days, credit: true, design });
  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement; const day = t.closest<HTMLElement>('[data-day]'); const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (day) { const d = Number(day.dataset.day); const i = st.done.indexOf(d); i >= 0 ? st.done.splice(i, 1) : st.done.push(d); persist(); render(); root.querySelector<HTMLElement>(`[data-day="${d}"]`)?.focus(); if (!used) { used = true; track('tool_use', { tool: '30_day_challenge' }); } }
    if (act === 'pdf') { savePdf(await doc(), `habon-${st.days}-day-challenge-${paper}.pdf`); track('pdf_download', { tool: '30_day_challenge', paper }); }
    if (act === 'print') { printPdf(await doc()); track('pdf_print', { tool: '30_day_challenge' }); }
    if (act === 'reset' && confirm('Restart the challenge and clear all progress?')) { st.done = []; st.start = T; persist(); render(); }
  });
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'ch-pick' && t.value) { st.name = CHALLENGES.find((c) => c.id === t.value)!.name; persist(); render(); track('challenge_selected', { challenge: t.value }); }
    if (t.id === 'ch-start' && t.value) { st.start = t.value; persist(); render(); }
    if (t.id === 'ch-len') { st.days = Number(t.value); st.done = st.done.filter((d) => d <= st.days); persist(); render(); }
    if (t.id === 'ch-paper') paper = t.value as 'a4' | 'letter';
    if (t.id === 'ch-design') design = t.value as Design;
  });
  root.addEventListener('input', (e) => { const t = e.target as HTMLInputElement; if (t.id === 'ch-name') { st.name = t.value; persist(); } if (t.id === 'ch-goal') { st.goal = t.value; persist(); } });
  render(); void parse;
}
