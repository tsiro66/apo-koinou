import { onPageLoad } from "../scripts/onPageLoad";

// Scrollspy: highlight the "on this page" entry for the section in view.
// One global scroll handler is registered once per document and state is
// re-scanned on astro:page-load, so ClientRouter swaps never leave stale
// references (same lifecycle pattern as Navbar/PlayFilters).
type TocState = { links: HTMLAnchorElement[]; headings: HTMLElement[] };
let state: TocState | null = null;
let current = "";
let raf = 0;

// Sticky navbar height + breathing room (≈ the prose h2 scroll-margin-top).
const HEADER_OFFSET = 96;

function slug(hash: string): string {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

function update() {
  if (!state) return;
  // The active section is the last heading whose top has passed the
  // navbar offset...
  let next = "";
  for (const h of state.headings) {
    if (h.getBoundingClientRect().top <= HEADER_OFFSET) next = h.id;
    else break;
  }
  // ...or the last section once the page is scrolled to the very bottom
  // (its heading may otherwise never reach the offset on short pages).
  const last = state.headings[state.headings.length - 1];
  if (
    next !== last.id &&
    window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 2
  ) {
    next = last.id;
  }
  if (next === current) return;
  current = next;
  for (const a of state.links) {
    const active = slug(a.hash) === current;
    const li = a.closest("li");
    if (active) {
      a.setAttribute("data-active", "");
      a.setAttribute("aria-current", "true");
      li?.setAttribute("data-active", "");
    } else {
      a.removeAttribute("data-active");
      a.removeAttribute("aria-current");
      li?.removeAttribute("data-active");
    }
  }
}

function onScroll() {
  if (raf || !state) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    update();
  });
}

function rescan() {
  const nav = document.querySelector<HTMLElement>("[data-toc]");
  const links = nav
    ? [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
    : [];
  const headings = links
    .map((a) => document.getElementById(slug(a.hash)))
    .filter((h): h is HTMLElement => !!h);
  state =
    nav && links.length > 0 && headings.length > 0 ? { links, headings } : null;
  current = "";
  update();
}

onPageLoad(rescan, {
  once: () => {
    window.addEventListener("scroll", onScroll, { passive: true });
  },
});
