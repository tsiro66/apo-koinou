import { normalizeText } from "../utils/text";
import { onPageLoad } from "../scripts/onPageLoad";

// Generic client-side list filtering, shared by the archive page
// (PlayFilters.astro) and the Συλλογή page (SyllogiFilters.astro). The
// filter root declares its targets via data attributes, so one script
// serves any list whose items carry data-year / data-title / data-search:
//
//   data-filter-target  selector of the container holding the items
//   data-filter-item    selector matching one filterable item
//   data-filter-empty   selector of the "no results" note (optional)
//
// Sort is applied by re-appending DOM nodes, visibility via the `hidden`
// attribute, and state is mirrored to the URL (?q=&year=&sort= plus the
// exact-match select's parameter) so filtered views are shareable and
// survive ClientRouter navigation.
type SortKey = "newest" | "oldest" | "title";

function setup(root: HTMLElement) {
  const targetSel = root.dataset.filterTarget;
  const itemSel = root.dataset.filterItem;
  if (!targetSel || !itemSel) return;
  const grid = document.querySelector<HTMLElement>(targetSel);
  const empty = root.dataset.filterEmpty
    ? document.querySelector<HTMLElement>(root.dataset.filterEmpty)
    : null;
  const search = root.querySelector<HTMLInputElement>("[data-filter-search]");
  const year = root.querySelector<HTMLSelectElement>("[data-filter-year]");
  // Writer is page-specific (archive only) — optional everywhere else.
  const writer = root.querySelector<HTMLSelectElement>("[data-filter-writer]");
  const sort = root.querySelector<HTMLSelectElement>("[data-filter-sort]");
  const status = root.querySelector<HTMLElement>("[data-filter-status]");
  const clear = root.querySelector<HTMLButtonElement>("[data-filter-clear]");
  if (!grid || !search || !year || !sort) return;
  // The exact-match select matches the item's `data-writer` attribute; the
  // URL parameter name is configurable so the Συλλογή page can expose it
  // as ?play= while the archive keeps ?writer=.
  const writerParam = root.dataset.filterWriterParam || "writer";
  // Alias after the guard: TS narrowing is not preserved inside the
  // closures below otherwise.
  const gridEl = grid;
  const emptyEl = empty;
  const searchEl = search;
  const yearEl = year;
  const writerEl = writer;
  const sortEl = sort;

  const items = Array.from(gridEl.querySelectorAll<HTMLElement>(itemSel));

  function currentSort(): SortKey {
    const v = sortEl.value;
    return v === "oldest" || v === "title" ? v : "newest";
  }

  function apply(syncUrl = true) {
    const q = normalizeText(searchEl.value);
    const y = yearEl.value;
    const w = writerEl?.value ?? "";
    const s = currentSort();

    const ordered = [...items].sort((a, b) => {
      if (s === "oldest")
        return Number(a.dataset.year) - Number(b.dataset.year);
      if (s === "title")
        return (a.dataset.title ?? "").localeCompare(
          b.dataset.title ?? "",
          "el",
        );
      // 'newest' matches the server-rendered order (year desc); Array.sort
      // is stable, so untouched pages don't reshuffle on load.
      return Number(b.dataset.year) - Number(a.dataset.year);
    });
    for (const el of ordered) gridEl.appendChild(el);

    let visible = 0;
    for (const el of ordered) {
      const show =
        (!q || (el.dataset.search ?? "").includes(q)) &&
        (!y || el.dataset.year === y) &&
        (!w || (el.dataset.writer ?? "") === w);
      el.hidden = !show;
      if (show) visible++;
    }

    if (status) {
      const tpl =
        visible === 1
          ? (status.dataset.resultsOne ?? "")
          : (status.dataset.resultsMany ?? "");
      status.textContent = tpl.replace("{count}", String(visible));
    }
    if (emptyEl) emptyEl.hidden = visible !== 0;
    if (clear) clear.hidden = !q && !y && !w && s === "newest";

    if (syncUrl) {
      const params = new URLSearchParams();
      if (q) params.set("q", searchEl.value.trim());
      if (y) params.set("year", y);
      if (w) params.set(writerParam, w);
      if (s !== "newest") params.set("sort", s);
      const qs = params.toString();
      history.replaceState(
        null,
        "",
        `${location.pathname}${qs ? `?${qs}` : ""}`,
      );
    }
  }

  // Restore state from the URL (deep links, back/forward navigation).
  const params = new URLSearchParams(location.search);
  searchEl.value = params.get("q") ?? "";
  yearEl.value = params.get("year") ?? "";
  if (writerEl) writerEl.value = params.get(writerParam) ?? "";
  sortEl.value = params.get("sort") ?? "newest";
  apply(false);

  searchEl.addEventListener("input", () => apply());
  yearEl.addEventListener("change", () => apply());
  writerEl?.addEventListener("change", () => apply());
  sortEl.addEventListener("change", () => apply());
  clear?.addEventListener("click", () => {
    searchEl.value = "";
    yearEl.value = "";
    if (writerEl) writerEl.value = "";
    sortEl.value = "newest";
    apply();
    searchEl.focus();
  });
}

// Same lifecycle pattern as the Navbar: element listeners are bound once
// per DOM node (data-bound), the astro:page-load hook is registered once
// per document and always queries the live DOM after ClientRouter swaps.
function bind() {
  const root = document.querySelector<HTMLElement>("[data-play-filters]");
  if (!root || root.dataset.bound === "true") return;
  root.dataset.bound = "true";
  setup(root);
}

onPageLoad(bind);
