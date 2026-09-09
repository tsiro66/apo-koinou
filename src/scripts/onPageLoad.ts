/**
 * Shared lifecycle for client-side scripts under the ClientRouter (SPA mode).
 *
 * Module scripts execute only once per full page load, while `astro:page-load`
 * fires after the initial load AND after every client-side navigation. Every
 * component script therefore needs the same dance — bind now, re-bind after
 * each swap, register document-level extras only once, tear down outgoing
 * timers before a swap — which this helper centralizes. Never hand-roll
 * `window.__xBound` guards or raw `astro:page-load` listeners again.
 *
 *   onPageLoad(bind);                              // simple re-binding
 *   onPageLoad(bind, { once: ... });               // + one-time globals
 *   onPageLoad(bind, { cleanup: ... });            // + swap teardown
 *
 * `bind()` runs immediately: that covers the initial load, and because
 * `astro:page-load` also fires on first load it may simply no-op there —
 * element guards (`dataset.bound`) keep double-binding harmless.
 * `bind` must always re-query the live DOM: element references die with
 * the outgoing document after every swap.
 */
const registered = new Set<() => void>();

export function onPageLoad(
  bind: () => void,
  opts: { once?: () => void; cleanup?: () => void } = {},
): void {
  bind();
  if (registered.has(bind)) return;
  registered.add(bind);
  document.addEventListener("astro:page-load", bind);
  opts.once?.();
  if (opts.cleanup) {
    document.addEventListener("astro:before-swap", opts.cleanup);
  }
}
