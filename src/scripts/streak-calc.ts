import { load, save, KEYS } from '../lib/storage';
import { today, addDays, parse, ymd, MONTHS, DOW, daysInMonth, fmtLong, diffDays } from '../lib/dates';
import { dayStats, pct, weekdayName } from '../lib/streak';
import { track } from '../lib/analytics';
import { esc } from '../lib/ui';

const root = document.getElementById('streak-root');
if (root) {
  const T = today();
  const dates = new Set<string>(load<string[]>(KEYS.streak, []));
  let anchor = T; let used = false;
  const persist = () => { save(KEYS.streak, [...dates]); if (!used) { used = true; track('tool_use', { tool: 'streak_calculator' }); } };

  function parseDates(txt: string) {
    const out: string[] = []; let bad = 0;
    for (const tok of txt.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)) {
      let d: Date | null = null; let m: RegExpMatchArray | null;
      if ((m = tok.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) d = new Date(+m[1], +m[2] - 1, +m[3]);
      else if ((m = tok.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) d = new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[1] - 1, +m[2]);
      else { const t = Date.parse(tok); if (!Number.isNaN(t)) d = new Date(t); }
      if (d && !Number.isNaN(d.getTime())) out.push(ymd(d)); else bad++;
    }
    return { out, bad };
  }

  function render() {
    const s = dayStats(dates, T);
    const a = parse(anchor), y = a.getFullYear(), mo = a.getMonth(); const lead = new Date(y, mo, 1).getDay(); const n = daysInMonth(y, mo);
    const lr = s.longestRange;
    const cells: string[] = Array(lead).fill('<div></div>');
    for (let d = 1; d <= n; d++) {
      const ds = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const on = dates.has(ds); const fut = ds > T;
      const inLong = lr && ds >= lr[0] && ds <= lr[1]; const inCur = s.current > 0 && ds > addDays(T, -s.current - (dates.has(T) ? 0 : 0)) && on && diffDays(ds, T) < s.current + 1;
      cells.push(`<button type="button" ${fut ? 'disabled' : ''} data-d="${ds}" aria-pressed="${on}" aria-label="${MONTHS[mo]} ${d}${on ? ', done' : ''}" class="aspect-square rounded-xl border text-sm font-semibold ${ds === T ? 'ring-2 ring-accent' : ''} ${fut ? 'opacity-30' : ''}" style="${on ? `background:${inLong ? 'var(--accent)' : 'var(--fg)'};color:${inLong ? '#1c1c1e' : 'var(--bg)'};border-color:transparent` : 'border-color:var(--line)'}">${d}</button>`);
      void inCur;
    }
    const wk = s.byWeekday; const wmax = Math.max(1, ...wk);
    root!.innerHTML = `<div class="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div><div class="flex items-center gap-2"><button class="btn btn-sm" data-nav="-1" aria-label="Previous month">←</button><h2 class="min-w-40 text-center font-display text-lg font-bold">${MONTHS[mo]} ${y}</h2><button class="btn btn-sm" data-nav="1" aria-label="Next month">→</button></div>
        <div class="mt-4 grid max-w-md grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted">${DOW.map((d) => `<div>${d}</div>`).join('')}</div>
        <div class="mt-1.5 grid max-w-md grid-cols-7 gap-1.5">${cells.join('')}</div>
        <p class="mt-3 text-xs text-muted"><span class="mr-1 inline-block size-3 rounded bg-accent align-middle"></span>Longest streak <span class="ml-3 mr-1 inline-block size-3 rounded bg-fg align-middle"></span>Other days done. Tap a day to toggle it.</p>
        <div class="mt-6"><label class="label" for="sc-paste">Or paste dates (YYYY-MM-DD, MM/DD/YYYY, one per line)</label><textarea id="sc-paste" class="field" rows="3" placeholder="2026-11-01&#10;2026-11-02&#10;11/04/2026"></textarea>
        <div class="mt-2 flex flex-wrap items-end gap-2"><button class="btn btn-sm" data-act="paste">Add pasted dates</button><span class="mx-1 text-sm text-muted">or</span><div><label class="label" for="sc-start">Done every day since</label><input id="sc-start" type="date" class="field !min-h-9" max="${T}"></div><button class="btn btn-sm" data-act="since">Fill range</button><button class="btn btn-sm btn-danger" data-act="clear">Clear all</button></div><p id="sc-msg" class="mt-2 text-sm text-muted" role="status"></p></div></div>
      <div><div class="grid grid-cols-2 gap-5"><div class="stat"><b>${s.current}</b><span>Current streak (days)</span></div><div class="stat"><b>${s.longest}</b><span>Longest streak (days)</span></div><div class="stat"><b>${s.total ? pct(s.completion) : '–'}</b><span>Completion since first day</span></div><div class="stat"><b>${s.missed}</b><span>Missed days</span></div></div>
        <dl class="mt-6 space-y-2 text-sm"><div class="flex justify-between border-t border-line pt-2"><dt class="text-muted">Days done / days since start</dt><dd class="font-semibold">${s.total} / ${s.span}</dd></div>
        <div class="flex justify-between border-t border-line pt-2"><dt class="text-muted">Longest streak dates</dt><dd class="font-semibold">${lr ? `${fmtLong(lr[0])} – ${fmtLong(lr[1])}` : '–'}</dd></div>
        <div class="flex justify-between border-t border-line pt-2"><dt class="text-muted">Last day done</dt><dd class="font-semibold">${s.last ? (s.daysSinceLast === 0 ? 'Today' : `${s.daysSinceLast} day${s.daysSinceLast === 1 ? '' : 's'} ago`) : '–'}</dd></div>
        <div class="flex justify-between border-t border-line pt-2"><dt class="text-muted">Strongest / weakest weekday</dt><dd class="font-semibold">${weekdayName(s.bestWeekday)} / ${weekdayName(s.worstWeekday)}</dd></div></dl>
        <h2 class="mt-6 font-display text-base font-bold">Consistency by weekday</h2>
        <div class="mt-2 flex h-24 items-end gap-2" role="img" aria-label="Days done by weekday">${wk.map((c, i) => `<div class="flex flex-1 flex-col items-center gap-1"><div class="w-full rounded-t bg-accent" style="height:${(c / wmax) * 100}%;min-height:2px" title="${DOW[i]}: ${c}"></div><span class="text-xs text-muted">${DOW[i][0]}</span></div>`).join('')}</div>
        ${s.current === 0 && s.last ? '<p class="mt-5 rounded-xl bg-soft p-3 text-sm">Your streak is at zero, but your longest run is still yours. Starting again today is the best next move.</p>' : ''}</div></div>`;
  }
  const msg = (t: string) => { const m = root!.querySelector('#sc-msg'); if (m) m.textContent = t; };
  root.addEventListener('click', (e) => {
    const el = e.target as HTMLElement; const day = el.closest<HTMLElement>('[data-d]'); const nav = el.closest<HTMLElement>('[data-nav]'); const act = el.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (day) { const d = day.dataset.d!; dates.has(d) ? dates.delete(d) : dates.add(d); persist(); render(); root.querySelector<HTMLElement>(`[data-d="${d}"]`)?.focus(); return; }
    if (nav) { const d = parse(anchor); d.setMonth(d.getMonth() + Number(nav.dataset.nav), 1); anchor = ymd(d); render(); return; }
    if (act === 'paste') { const { out, bad } = parseDates(root.querySelector<HTMLTextAreaElement>('#sc-paste')!.value); const before = dates.size; out.filter((d) => d <= T).forEach((d) => dates.add(d)); persist(); render(); msg(`Added ${dates.size - before} new date${dates.size - before === 1 ? '' : 's'}${bad ? `, ${bad} could not be read` : ''}${out.some((d) => d > T) ? ', future dates ignored' : ''}.`); }
    if (act === 'since') { const v = root.querySelector<HTMLInputElement>('#sc-start')!.value; if (!v) return msg('Pick a start date first.'); for (let d = v; d <= T; d = addDays(d, 1)) dates.add(d); persist(); render(); msg('Range filled. Tap days to remove any you missed.'); }
    if (act === 'clear' && confirm('Remove all dates?')) { dates.clear(); persist(); render(); }
  });
  render();
}
