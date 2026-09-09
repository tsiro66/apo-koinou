import { onPageLoad } from "../scripts/onPageLoad";

// The dialog is re-created on each ClientRouter navigation, so listeners
// are bound to the live element on every page load (data-bound guards
// against double-binding when the script re-runs without a swap).
function bindLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>(
    "[data-lightbox-dialog]",
  )!;
  if (!dialog || dialog.dataset.bound) return;
  dialog.dataset.bound = "true";

  const img = dialog.querySelector<HTMLImageElement>("[data-lightbox-img]")!;
  const prevBtn = dialog.querySelector<HTMLButtonElement>(
    "[data-lightbox-prev]",
  )!;
  const nextBtn = dialog.querySelector<HTMLButtonElement>(
    "[data-lightbox-next]",
  )!;

  let items: HTMLElement[] = [];
  let index = 0;

  function render() {
    const el = items[index];
    if (!el) return;
    img.src = el.dataset.lightboxSrc ?? "";
    img.alt = el.getAttribute("aria-label") ?? "";
    const single = items.length < 2;
    prevBtn.classList.toggle("hidden", single);
    nextBtn.classList.toggle("hidden", single);
  }

  function step(delta: number) {
    index = (index + delta + items.length) % items.length;
    render();
  }

  function close() {
    dialog.close();
  }

  // One delegated listener covers every trigger on the page, including
  // content swapped in later. A trigger's set is its siblings carrying
  // the same data-lightbox attribute value (group name). Torn down on
  // page swap so re-bound dialogs don't stack duplicate listeners.
  const ac = new AbortController();
  document.addEventListener("astro:before-swap", () => ac.abort(), {
    once: true,
  });
  document.addEventListener(
    "click",
    (e) => {
      const trigger = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-lightbox-src]",
      );
      if (!trigger || !dialog.isConnected) return;
      const group = trigger.dataset.lightbox ?? "";
      // Filter in JS rather than an attribute selector: group names are
      // play titles (Greek, spaces) that would need escaping otherwise.
      items = [
        ...document.querySelectorAll<HTMLElement>("[data-lightbox-src]"),
      ].filter((el) => (el.dataset.lightbox ?? "") === group);
      index = Math.max(0, items.indexOf(trigger));
      render();
      dialog.showModal();
      prevBtn.focus();
    },
    { signal: ac.signal },
  );

  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  dialog
    .querySelector("[data-lightbox-close]")
    ?.addEventListener("click", close);
  // Click on the dark backdrop (the dialog element itself) closes.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });
  // Esc is native to <dialog>; arrows browse.
  dialog.addEventListener("keydown", (e) => {
    if (items.length < 2) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });
}

onPageLoad(bindLightbox);
