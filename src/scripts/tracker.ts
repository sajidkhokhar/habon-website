import { load, save, uid, KEYS } from '../lib/storage';
import { today, addDays, startOfWeek, daysInMonth, MONTHS, DOW, ymd, fmtLong, parse } from '../lib/dates';
import { dayStats, periodStreak, pct } from '../lib/streak';
import { track } from '../lib/analytics';

type Freq = 'daily' | 'weekly' | 'monthly';
type Habit = { id: string; name: string; category: string; color: string; freq: Freq; target: number; created: string };
type Store = { habits: Habit[]; log: Record<string, string[]>; weekStart: 0 | 1 };

const COLORS = ['#f9a93a', '#e5604d', '#e0508b', '#8e6be0', '#4c8df6', '#2cb7a8', '#4caf63', '#8a8a92'];
const CATS = ['Health', 'Fitness', 'Mind', 'Learning', 'Work', 'Home', 'Social', 'Money', 'Other'];
const STARTERS: [string, string, string][] = [['Drink 8 glasses of water', 'Health', '#4c8df6'], ['Walk for 20 minutes', 'Fitness', '#4caf63'], ['Read 10 pages', 'Learning', '#8e6be0'], ['Meditate 5 minutes', 'Mind', '#2cb7a8'], ['Tidy for 10 minutes', 'Home', '#f9a93a'], ['Write in a journal', 'Mind', '#e0508b']];
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const root = document.getElementById('tracker-root') as HTMLElement | null;
if (root) init(root);

function init(root: HTMLElement) {
  const mode = root.dataset.mode ?? 'full';
  const store: Store = load<Store>(KEYS.tracker, { habits: [], log: {}, weekStart: 0 });
  if (store.weekStart === undefined) store.weekStart = 0;
  const T = today();
  let view: 'today' | 'week' | 'month' | 'stats' = 'today';
  let sel = T; // selected date for Today view
  let anchor = T; // week/month anchor
  let monthHabit = store.habits[0]?.id ?? '';
  let editing: string | null = null;
  let used = false;

  const persist = () => { if (!save(KEYS.tracker, store)) announce('Could not save: browser storage is full or blocked.'); };
  const live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); root.before(live);
  const announce = (m: string) => { live.textContent = m; };
  const checks = (id: string) => new Set(store.log[id] ?? []);
  const isDone = (id: string, d: string) => (store.log[id] ?? []).includes(d);
  const toggle = (id: string, d: string) => {
    const arr = store.log[id] ?? (store.log[id] = []);
    const i = arr.indexOf(d); if (i >= 0) arr.splice(i, 1); else arr.push(d);
    persist();
    if (!used) { used = true; track('tool_use', { tool: 'online_habit_tracker' }); }
  };
  const unit = (h: Habit) => (h.freq === 'daily' ? 'day' : h.freq === 'weekly' ? 'week' : 'month') as 'day' | 'week' | 'month';
  const stats = (h: Habit) => periodStreak(checks(h.id), unit(h), h.freq === 'daily' ? 1 : h.target, T, store.weekStart, h.created);
  const unitLabel = (h: Habit) => (h.freq === 'daily' ? 'days' : h.freq === 'weekly' ? 'weeks' : 'months');

  function rate30(h: Habit) {
    const from = [addDays(T, -29), h.created].sort().at(-1)!;
    const days = Math.max(1, Math.round((parse(T).getTime() - parse(from).getTime()) / 864e5) + 1);
    const done = (store.log[h.id] ?? []).filter((d) => d >= from && d <= T).length;
    if (h.freq === 'daily') return Math.min(1, done / days);
    const periods = h.freq === 'weekly' ? Math.max(1, days / 7) : Math.max(1, days / 30);
    return Math.min(1, done / (periods * h.target));
  }

  function progressLine(h: Habit, d: string) {
    if (h.freq === 'daily') return '';
    const bStart = h.freq === 'weekly' ? startOfWeek(d, store.weekStart) : d.slice(0, 7) + '-01';
    const bEnd = h.freq === 'weekly' ? addDays(bStart, 6) : addDays(bStart, daysInMonth(parse(d).getFullYear(), parse(d).getMonth()) - 1);
    const n = (store.log[h.id] ?? []).filter((x) => x >= bStart && x <= bEnd).length;
    return `${n}/${h.target} this ${h.freq === 'weekly' ? 'week' : 'month'}`;
  }

  const checkBtn = (h: Habit, d: string, label = true) => `<button type="button" class="check" style="--c:${h.color}" data-act="toggle" data-id="${h.id}" data-date="${d}" aria-pressed="${isDone(h.id, d)}" ${label ? `aria-label="${esc(h.name)} on ${fmtLong(d)}"` : ''}>${CHECK}</button>`;

  function habitRow(h: Habit, d: string) {
    const s = stats(h);
    return `<li class="flex items-center gap-3 border-b border-line py-3 last:border-0">
      ${checkBtn(h, d)}
      <div class="min-w-0 flex-1"><p class="truncate font-semibold ${isDone(h.id, d) ? 'text-muted line-through decoration-1' : ''}">${esc(h.name)}</p>
      <p class="text-xs text-muted"><span class="inline-block size-2 rounded-full align-middle" style="background:${h.color}"></span> ${esc(h.category)}${h.freq !== 'daily' ? ' · ' + progressLine(h, d) : ''}</p></div>
      <p class="whitespace-nowrap text-sm font-semibold" title="Current streak">${s.current > 0 ? '🔥' : ''} ${s.current} <span class="font-normal text-muted">${unitLabel(h)}</span></p>
      <button type="button" class="btn btn-sm" data-act="edit" data-id="${h.id}" aria-label="Edit ${esc(h.name)}">Edit</button></li>`;
  }

  function empty() {
    return `<div class="rounded-2xl border border-dashed border-line p-6 text-center"><p class="font-display text-xl font-bold">Add your first habit</p><p class="mx-auto mt-1 max-w-md text-sm text-muted">Start with one small, specific habit. Pick a suggestion or write your own.</p>
      <div class="mt-4 flex flex-wrap justify-center gap-2">${STARTERS.map(([n, c, col], i) => `<button type="button" class="chip hover:border-fg" data-act="starter" data-i="${i}"><span class="size-2 rounded-full" style="background:${col}"></span>${n}</button>`).join('')}</div>
      <button type="button" class="btn btn-primary mt-5" data-act="add">Create a habit</button></div>`;
  }

  function viewToday() {
    const list = store.habits;
    const done = list.filter((h) => isDone(h.id, sel)).length;
    const p = list.length ? done / list.length : 0;
    const dash = 2 * Math.PI * 26;
    return `<div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2"><button class="btn btn-sm" data-act="prev" aria-label="Previous day">←</button><h2 class="min-w-40 text-center font-display text-lg font-bold">${sel === T ? 'Today · ' : ''}${fmtLong(sel)}</h2><button class="btn btn-sm" data-act="next" aria-label="Next day" ${sel >= T ? 'disabled' : ''}>→</button>${sel !== T ? '<button class="btn btn-sm" data-act="jump">Today</button>' : ''}</div>
        ${list.length ? `<div class="flex items-center gap-3"><svg width="60" height="60" viewBox="0 0 60 60" role="img" aria-label="${done} of ${list.length} habits done"><circle cx="30" cy="30" r="26" fill="none" stroke="var(--line)" stroke-width="6"/><circle cx="30" cy="30" r="26" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${dash}" stroke-dashoffset="${dash * (1 - p)}" transform="rotate(-90 30 30)"/></svg><p class="text-sm"><b class="font-display text-xl">${done}/${list.length}</b><br><span class="text-muted">done</span></p></div>` : ''}</div>
      <ul class="mt-4">${list.length ? list.map((h) => habitRow(h, sel)).join('') : ''}</ul>${list.length ? '' : empty()}`;
  }

  function viewWeek() {
    const start = startOfWeek(anchor, store.weekStart);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    if (!store.habits.length) return empty();
    return `<div class="flex items-center gap-2"><button class="btn btn-sm" data-act="prev" aria-label="Previous week">←</button><h2 class="min-w-48 text-center font-display text-lg font-bold">${fmtLong(days[0])} – ${fmtLong(days[6])}</h2><button class="btn btn-sm" data-act="next" aria-label="Next week">→</button></div>
      <div class="mt-4 overflow-x-auto"><table class="w-full min-w-[34rem] border-collapse text-sm"><thead><tr><th class="py-2 text-left font-medium text-muted" scope="col">Habit</th>${days.map((d) => `<th scope="col" class="px-1 py-2 text-center font-medium ${d === T ? 'text-accent-ink' : 'text-muted'}">${DOW[parse(d).getDay()]}<br><span class="text-xs">${parse(d).getDate()}</span></th>`).join('')}</tr></thead>
      <tbody>${store.habits.map((h) => `<tr class="border-t border-line"><th scope="row" class="py-2 pr-2 text-left font-semibold"><span class="mr-1.5 inline-block size-2 rounded-full" style="background:${h.color}"></span>${esc(h.name)}<span class="block text-xs font-normal text-muted">${h.freq === 'daily' ? 'Daily' : progressLine(h, anchor)}</span></th>${days.map((d) => `<td class="px-1 py-1.5 text-center">${d > T ? '<span class="text-line">·</span>' : `<span class="inline-block">${checkBtn(h, d)}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function viewMonth() {
    if (!store.habits.length) return empty();
    if (!store.habits.find((h) => h.id === monthHabit)) monthHabit = store.habits[0].id;
    const h = store.habits.find((x) => x.id === monthHabit)!;
    const a = parse(anchor), y = a.getFullYear(), m = a.getMonth();
    const first = new Date(y, m, 1).getDay(); const lead = (first - store.weekStart + 7) % 7; const n = daysInMonth(y, m);
    const order = Array.from({ length: 7 }, (_, i) => DOW[(i + store.weekStart) % 7]);
    const cells: string[] = Array(lead).fill('<div></div>');
    for (let d = 1; d <= n; d++) {
      const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const done = isDone(h.id, ds); const fut = ds > T;
      cells.push(`<button type="button" ${fut ? 'disabled' : ''} class="aspect-square rounded-xl border text-sm font-semibold transition-colors ${ds === T ? 'ring-2 ring-accent' : ''}" style="${done ? `background:${h.color};border-color:${h.color};color:#fff` : 'border-color:var(--line)'}${fut ? ';opacity:.35' : ''}" data-act="toggle" data-id="${h.id}" data-date="${ds}" aria-pressed="${done}" aria-label="${esc(h.name)}, ${MONTHS[m]} ${d}">${d}</button>`);
    }
    const inMonth = (store.log[h.id] ?? []).filter((x) => x.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`)).length;
    return `<div class="flex flex-wrap items-center justify-between gap-3"><div class="flex items-center gap-2"><button class="btn btn-sm" data-act="prev" aria-label="Previous month">←</button><h2 class="min-w-40 text-center font-display text-lg font-bold">${MONTHS[m]} ${y}</h2><button class="btn btn-sm" data-act="next" aria-label="Next month">→</button></div>
      <label class="flex items-center gap-2 text-sm"><span class="label !mb-0">Habit</span><select class="field !w-auto" data-act="pick">${store.habits.map((x) => `<option value="${x.id}" ${x.id === h.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label></div>
      <div class="mt-4 grid max-w-md grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted">${order.map((d) => `<div>${d}</div>`).join('')}</div>
      <div class="mt-1.5 grid max-w-md grid-cols-7 gap-1.5">${cells.join('')}</div>
      <p class="mt-3 text-sm text-muted">${inMonth} check-in${inMonth === 1 ? '' : 's'} in ${MONTHS[m]}.</p>`;
  }

  function viewStats() {
    if (!store.habits.length) return empty();
    const all = store.habits.flatMap((h) => store.log[h.id] ?? []);
    const overall = dayStats(all, T);
    const days = Array.from({ length: 30 }, (_, i) => addDays(T, i - 29));
    const counts = days.map((d) => store.habits.filter((h) => isDone(h.id, d)).length);
    const max = Math.max(1, store.habits.length);
    const bw = 100 / 30;
    const bars = counts.map((c, i) => { const hgt = (c / max) * 100; return `<rect x="${i * bw + 0.4}" y="${100 - hgt}" width="${bw - 0.8}" height="${hgt}" rx="0.8" fill="var(--accent)"><title>${fmtLong(days[i])}: ${c} of ${store.habits.length} habits</title></rect>`; }).join('');
    const best = Math.max(0, ...store.habits.map((h) => stats(h).longest));
    const avg = store.habits.reduce((a, h) => a + rate30(h), 0) / store.habits.length;
    const cats = [...new Set(store.habits.map((h) => h.category))].map((c) => { const hs = store.habits.filter((h) => h.category === c); return [c, hs.reduce((a, h) => a + rate30(h), 0) / hs.length] as const; });
    return `<div class="grid grid-cols-2 gap-5 sm:grid-cols-4"><div class="stat"><b>${all.length}</b><span>Total check-ins</span></div><div class="stat"><b>${pct(avg)}</b><span>Avg completion, last 30 days</span></div><div class="stat"><b>${best}</b><span>Best streak (any habit)</span></div><div class="stat"><b>${overall.longest}</b><span>Longest run of active days</span></div></div>
      <h2 class="mt-8 font-display text-lg font-bold">Check-ins, last 30 days</h2>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="mt-2 h-40 w-full rounded-xl bg-soft p-1" role="img" aria-label="Bar chart of habit check-ins per day for the last 30 days">${bars}</svg>
      <div class="mt-1 flex justify-between text-xs text-muted"><span>${fmtLong(days[0])}</span><span>${fmtLong(days[29])}</span></div>
      <h2 class="mt-8 font-display text-lg font-bold">By habit</h2>
      <div class="mt-2 overflow-x-auto"><table class="w-full min-w-[30rem] text-sm"><thead><tr class="text-left text-muted"><th class="py-2 font-medium">Habit</th><th class="font-medium">Current</th><th class="font-medium">Best</th><th class="font-medium">30-day rate</th></tr></thead><tbody>${store.habits.map((h) => { const s = stats(h), r = rate30(h); return `<tr class="border-t border-line"><td class="py-2 font-semibold"><span class="mr-1.5 inline-block size-2 rounded-full" style="background:${h.color}"></span>${esc(h.name)}</td><td>${s.current} ${unitLabel(h)}</td><td>${s.longest} ${unitLabel(h)}</td><td><span class="inline-flex items-center gap-2"><span class="h-2 w-20 overflow-hidden rounded-full bg-soft"><span class="block h-full" style="width:${r * 100}%;background:${h.color}"></span></span>${pct(r)}</span></td></tr>`; }).join('')}</tbody></table></div>
      ${cats.length > 1 ? `<h2 class="mt-8 font-display text-lg font-bold">By category</h2><ul class="mt-2 space-y-2">${cats.map(([c, r]) => `<li class="flex items-center gap-3 text-sm"><span class="w-24 font-semibold">${esc(c)}</span><span class="h-2.5 flex-1 overflow-hidden rounded-full bg-soft"><span class="block h-full bg-accent" style="width:${r * 100}%"></span></span><span class="w-10 text-right">${pct(r)}</span></li>`).join('')}</ul>` : ''}`;
  }

  function dialogHtml() {
    const h = store.habits.find((x) => x.id === editing);
    return `<dialog id="habit-dialog" class="m-auto w-[min(30rem,calc(100%-2rem))] rounded-2xl border border-line bg-raised p-0 text-fg backdrop:bg-black/50"><form method="dialog" id="habit-form" class="p-6">
      <h2 class="font-display text-2xl font-bold">${h ? 'Edit habit' : 'New habit'}</h2>
      <div class="mt-4"><label class="label" for="hf-name">Habit name</label><input class="field" id="hf-name" name="name" required maxlength="60" value="${h ? esc(h.name) : ''}" placeholder="e.g. Read 10 pages"></div>
      <div class="mt-4 grid grid-cols-2 gap-3"><div><label class="label" for="hf-cat">Category</label><select class="field" id="hf-cat" name="category">${CATS.map((c) => `<option ${h?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><label class="label" for="hf-freq">Tracking</label><select class="field" id="hf-freq" name="freq"><option value="daily" ${h?.freq === 'daily' || !h ? 'selected' : ''}>Daily</option><option value="weekly" ${h?.freq === 'weekly' ? 'selected' : ''}>Weekly</option><option value="monthly" ${h?.freq === 'monthly' ? 'selected' : ''}>Monthly</option></select></div></div>
      <div class="mt-4" id="hf-target-wrap" ${!h || h.freq === 'daily' ? 'hidden' : ''}><label class="label" for="hf-target">Target days per <span id="hf-unit">${h?.freq === 'monthly' ? 'month' : 'week'}</span></label><input class="field" id="hf-target" name="target" type="number" min="1" max="31" value="${h?.target ?? 3}"></div>
      <fieldset class="mt-4"><legend class="label">Color</legend><div class="flex flex-wrap gap-2">${COLORS.map((c, i) => `<label class="cursor-pointer"><input type="radio" name="color" value="${c}" class="peer sr-only" ${(h ? h.color === c : i === 0) ? 'checked' : ''}><span class="block size-9 rounded-full border-2 border-transparent ring-offset-2 ring-offset-[var(--raised)] peer-checked:ring-2 peer-focus-visible:ring-2" style="background:${c};--tw-ring-color:${c}"></span><span class="sr-only">Color ${i + 1}</span></label>`).join('')}</div></fieldset>
      <div class="mt-6 flex flex-wrap items-center gap-2"><button class="btn btn-primary" value="save" type="submit">Save habit</button><button class="btn" value="cancel" formnovalidate type="submit">Cancel</button>${h ? '<button class="btn btn-danger ml-auto" type="button" data-act="delete">Delete</button>' : ''}</div></form></dialog>`;
  }

  function render() {
    const tabs = mode === 'full' ? [['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['stats', 'Stats']] : [['today', 'Today']];
    const body = view === 'today' ? viewToday() : view === 'week' ? viewWeek() : view === 'month' ? viewMonth() : viewStats();
    root.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Tracker views" class="inline-flex rounded-xl border border-line p-1">${tabs.map(([k, l]) => `<button role="tab" class="rounded-lg px-3.5 py-1.5 text-sm font-semibold ${view === k ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}" aria-selected="${view === k}" data-act="tab" data-v="${k}">${l}</button>`).join('')}</div>
      <div class="flex gap-2"><button class="btn btn-primary btn-sm" data-act="add">+ Add habit</button>${mode === 'full' ? '<details class="relative"><summary class="btn btn-sm list-none">More ▾</summary><div class="absolute right-0 z-10 mt-1 w-56 rounded-xl border border-line bg-raised p-2 shadow-xl"><button class="btn btn-sm mb-1 w-full justify-start border-0" data-act="export">Export backup (JSON)</button><button class="btn btn-sm mb-1 w-full justify-start border-0" data-act="import">Import backup</button><button class="btn btn-sm mb-1 w-full justify-start border-0" data-act="weekstart">Week starts on ' + (store.weekStart ? 'Monday' : 'Sunday') + '</button><button class="btn btn-sm btn-danger w-full justify-start border-0" data-act="reset">Delete all data</button></div></details>' : ''}</div></div>
      <div class="mt-5" role="tabpanel">${body}</div>
      <input type="file" id="import-file" accept="application/json" hidden>
      <p class="mt-5 text-xs text-muted">Saved automatically in this browser only. Clearing site data removes it, so export a backup if it matters.</p>${dialogHtml()}`;
  }

  function openDialog() {
    const dlg = root.querySelector<HTMLDialogElement>('#habit-dialog')!; dlg.showModal();
    const freq = dlg.querySelector<HTMLSelectElement>('#hf-freq')!; const wrap = dlg.querySelector<HTMLElement>('#hf-target-wrap')!;
    freq.addEventListener('change', () => { wrap.hidden = freq.value === 'daily'; dlg.querySelector('#hf-unit')!.textContent = freq.value === 'monthly' ? 'month' : 'week'; });
    dlg.querySelector<HTMLInputElement>('#hf-name')!.focus();
    dlg.addEventListener('close', () => {
      if (dlg.returnValue !== 'save') { editing = null; return; }
      const f = new FormData(dlg.querySelector('form')!);
      const freqV = f.get('freq') as Freq;
      const patch = { name: String(f.get('name')).trim().slice(0, 60), category: String(f.get('category')), color: String(f.get('color')), freq: freqV, target: freqV === 'daily' ? 1 : Math.min(31, Math.max(1, Number(f.get('target')) || 1)) };
      if (!patch.name) return;
      if (editing) Object.assign(store.habits.find((x) => x.id === editing)!, patch);
      else { const h: Habit = { id: uid(), created: T, ...patch }; store.habits.push(h); monthHabit ||= h.id; track('habit_created', { tool: 'online_habit_tracker' }); }
      editing = null; persist(); render(); announce('Habit saved');
    }, { once: true });
  }

  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]'); if (!el) return;
    const act = el.dataset.act!;
    if (act === 'toggle') { toggle(el.dataset.id!, el.dataset.date!); const pos = root.querySelector('[role=tabpanel]')!.scrollTop; render(); root.querySelector<HTMLElement>(`[data-act=toggle][data-id="${el.dataset.id}"][data-date="${el.dataset.date}"]`)?.focus(); void pos; return; }
    if (act === 'tab') { view = el.dataset.v as typeof view; anchor = T; render(); return; }
    if (act === 'prev' || act === 'next') { const s = act === 'prev' ? -1 : 1; if (view === 'today') sel = addDays(sel, s); else if (view === 'week') anchor = addDays(anchor, 7 * s); else { const d = parse(anchor); d.setMonth(d.getMonth() + s, 1); anchor = ymd(d); } render(); return; }
    if (act === 'jump') { sel = T; render(); return; }
    if (act === 'add') { editing = null; render(); openDialog(); return; }
    if (act === 'edit') { editing = el.dataset.id!; render(); openDialog(); return; }
    if (act === 'delete') { const h = store.habits.find((x) => x.id === editing); if (h && confirm(`Delete "${h.name}" and its history?`)) { store.habits = store.habits.filter((x) => x.id !== editing); delete store.log[editing!]; editing = null; persist(); render(); } return; }
    if (act === 'starter') { const [name, category, color] = STARTERS[Number(el.dataset.i)]; const h: Habit = { id: uid(), name, category, color, freq: 'daily', target: 1, created: T }; store.habits.push(h); monthHabit ||= h.id; persist(); render(); track('habit_created', { tool: 'online_habit_tracker' }); return; }
    if (act === 'export') { const url = URL.createObjectURL(new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `habon-habits-${T}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return; }
    if (act === 'import') { root.querySelector<HTMLInputElement>('#import-file')!.click(); return; }
    if (act === 'weekstart') { store.weekStart = store.weekStart ? 0 : 1; persist(); render(); return; }
    if (act === 'reset') { if (confirm('Delete all habits and history from this browser? This cannot be undone.')) { store.habits = []; store.log = {}; persist(); render(); } }
  });
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.act === 'pick') { monthHabit = t.value; render(); }
    if (t.id === 'import-file' && t.files?.[0]) {
      t.files[0].text().then((txt) => { try { const d = JSON.parse(txt) as Store; if (!Array.isArray(d.habits) || typeof d.log !== 'object') throw 0; store.habits = d.habits.filter((h) => h && h.id && h.name).map((h) => ({ ...h, name: String(h.name).slice(0, 60) })); store.log = d.log; persist(); render(); announce('Backup imported'); } catch { alert('That file is not a valid Habon web backup.'); } });
    }
  });
  render();
}
