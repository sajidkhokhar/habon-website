/** Privacy-friendly event helper. Sends events only if GA4 was loaded after the visitor accepted analytics. */
type Params = Record<string, string | number | boolean>;
declare global { interface Window { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[]; } }
export function track(name: string, params: Params = {}) {
  try { window.gtag?.('event', name, { ...params, page_path: location.pathname }); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent('habon:event', { detail: { name, params } }));
}
