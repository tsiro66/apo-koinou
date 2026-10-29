// Swaps each trailer facade for its YouTube nocookie iframe (autoplay)
// when the visitor presses play. Bound through onPageLoad so it
// re-binds after every ClientRouter swap; element guards keep
// double-binding harmless.
import { onPageLoad } from "../scripts/onPageLoad";

function bindFacades(): void {
  document
    .querySelectorAll<HTMLElement>("[data-trailer-facade]:not([data-bound])")
    .forEach((facade) => {
      facade.dataset.bound = "1";
      facade.querySelector("button")?.addEventListener("click", () => {
        const id = facade.dataset.trailerId;
        if (!id) return;
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        iframe.title = facade.dataset.trailerTitle ?? "Trailer";
        iframe.allow = "accelerometer; encrypted-media; autoplay; fullscreen";
        iframe.allowFullscreen = true;
        iframe.className = "aspect-video w-full";
        facade.replaceWith(iframe);
      });
    });
}

onPageLoad(bindFacades);
