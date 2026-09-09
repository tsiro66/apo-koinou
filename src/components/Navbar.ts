import { onPageLoad } from "../scripts/onPageLoad";

// State lives on #nav-menu (data-open). Element-level listeners die with
// the DOM node on ClientRouter swaps; the astro:page-load listener is
// registered once per document and always queries the live DOM, so no
// stale closures survive navigations.
function parts(root: HTMLElement) {
  return {
    toggle: root.querySelector<HTMLButtonElement>("#nav-toggle"),
    overlay: root.querySelector<HTMLElement>("#nav-overlay"),
  };
}

function setOpen(root: HTMLElement, open: boolean) {
  const { toggle, overlay } = parts(root);
  if (!toggle || !overlay) return;

  root.dataset.open = String(open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute(
    "aria-label",
    open ? (toggle.dataset.labelClose ?? "") : (toggle.dataset.labelOpen ?? ""),
  );
  overlay.inert = !open;

  // Scroll lock + compensate for the disappearing scrollbar.
  document.documentElement.style.overflow = open ? "hidden" : "";
  document.documentElement.style.paddingRight = open
    ? `${window.innerWidth - document.documentElement.clientWidth}px`
    : "";

  if (open) {
    overlay.querySelector<HTMLElement>("[data-navlink]")?.focus();
  } else if (overlay.contains(document.activeElement)) {
    toggle.focus();
  }
}

function setup(root: HTMLElement) {
  if (root.dataset.bound === "true") return;
  root.dataset.bound = "true";

  const { toggle, overlay } = parts(root);
  if (!toggle || !overlay) return;

  toggle.addEventListener("click", () =>
    setOpen(root, root.dataset.open !== "true"),
  );
  // Close after navigating via a link.
  overlay
    .querySelectorAll("[data-navlink]")
    .forEach((a) => a.addEventListener("click", () => setOpen(root, false)));

  root.addEventListener("keydown", (e) => {
    if (root.dataset.open !== "true") return;
    if (e.key === "Escape") {
      setOpen(root, false);
      return;
    }
    // Focus trap: cycle Tab through [toggle, ...overlay focusables].
    if (e.key !== "Tab") return;
    const focusables = [
      toggle,
      ...overlay.querySelectorAll<HTMLElement>("a[href], button"),
    ];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// Navbar mode: overlay (transparent, light ink) while a page hero
// ([data-hero]) is still under the bar; solid (zinc-50, dark ink) once
// it exits. Pages
// declare a hero with [data-hero]; the flip point is the hero's bottom
// edge minus the bar height, so the transition lands exactly as the
// photo leaves.
function updateMode() {
  const header = document.querySelector<HTMLElement>("#nav-menu > header");
  if (!header) return;
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  let mode = "solid";
  if (hero && window.scrollY < hero.offsetHeight - header.offsetHeight) {
    mode = "overlay";
  }
  if (header.dataset.mode !== mode) header.dataset.mode = mode;
}

function bind() {
  const root = document.getElementById("nav-menu");
  if (root) setup(root);
  updateMode();
}

onPageLoad(bind, {
  once: () => {
    window.addEventListener("scroll", updateMode, { passive: true });
    window.addEventListener("resize", updateMode, { passive: true });
    // Close if the viewport grows to desktop while the menu is open.
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => {
      if (!e.matches) return;
      const root = document.getElementById("nav-menu");
      if (root?.dataset.open === "true") setOpen(root, false);
    });
  },
});
