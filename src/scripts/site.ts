import { track } from '../lib/analytics';

// Delegated click tracking for anything marked data-track
document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-track]');
  if (!el) return;
  track(el.dataset.track!, { placement: el.dataset.placement ?? 'unknown', ...(el.dataset.label ? { label: el.dataset.label } : {}) });
});

// Optional GA4, loaded only after consent
const box = document.getElementById('consent');
const gaId = box?.dataset.ga;
function loadGA(id: string) {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { (window.dataLayer as unknown[]).push(arguments); } as never;
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });
  const s = document.createElement('script'); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; document.head.appendChild(s);
}
if (box && gaId) {
  let choice: string | null = null;
  try { choice = localStorage.getItem('habon-consent'); } catch {}
  const set = (v: 'granted' | 'denied') => { try { localStorage.setItem('habon-consent', v); } catch {} box.hidden = true; if (v === 'granted') loadGA(gaId); };
  if (choice === 'granted') loadGA(gaId); else if (!choice) box.hidden = false;
  box.querySelector('[data-accept]')?.addEventListener('click', () => set('granted'));
  box.querySelector('[data-decline]')?.addEventListener('click', () => set('denied'));
  document.getElementById('cookie-settings')?.addEventListener('click', () => { box.hidden = false; });
}
