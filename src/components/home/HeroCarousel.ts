import { onPageLoad } from "../../scripts/onPageLoad";

// Hero carousel: cross-fades the production photos on a timer.
// Module scripts run only once under the ClientRouter, so re-binding
// happens through the shared onPageLoad helper (astro:page-load).
const HERO_INTERVAL_MS = 3000;
const HERO_FADE_MS = 1000;

const heroCleanups: Array<() => void> = [];
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function bindHeroCarousel() {
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((root) => {
    if (root.dataset.bound) return;
    root.dataset.bound = "true";

    const slides = [...root.querySelectorAll<HTMLElement>("[data-slide]")];
    if (slides.length < 2) return; // Single photo: nothing to rotate.
    const captions = [...root.querySelectorAll<HTMLElement>("[data-caption]")];
    const dots = [...root.querySelectorAll<HTMLButtonElement>("[data-dot]")];

    const ac = new AbortController();
    const { signal } = ac;
    let index = 0;
    let timer: number | undefined;

    // Keep captions, indicators and screen-reader visibility on the
    // active slide. Captions cross-fade through the same is-active
    // class as the slides — without toggling it here the first
    // caption would stay visible forever.
    function sync(i: number) {
      slides.forEach((s, k) => s.setAttribute("aria-hidden", String(k !== i)));
      captions.forEach((c, k) => {
        c.classList.toggle("is-active", k === i);
        c.setAttribute("aria-hidden", String(k !== i));
        // Every link inside the caption follows its focusability, so
        // hidden slides never trap the keyboard.
        c.querySelectorAll("a").forEach((a) => {
          if (k === i) a.removeAttribute("tabindex");
          else a.setAttribute("tabindex", "-1");
        });
      });
      dots.forEach((d, k) => {
        d.classList.toggle("bg-orange", k === i);
        d.classList.toggle("bg-zinc-50/40", k !== i);
        if (k === i) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }

    // The incoming slide fades in on top while the outgoing one stays
    // fully opaque underneath until the fade completes (no dip to black).
    function show(i: number) {
      const next = (i + slides.length) % slides.length;
      if (next === index) return;
      const prev = slides[index];
      index = next;
      slides.forEach((s) => s.classList.remove("is-under"));
      prev.classList.replace("is-active", "is-under");
      slides[next].classList.add("is-active");
      window.setTimeout(
        () => prev.classList.remove("is-under"),
        HERO_FADE_MS + 50,
      );
      sync(next);
    }

    function pause() {
      window.clearInterval(timer);
      timer = undefined;
    }
    function play() {
      // No autoplay when the OS asks for reduced motion.
      if (timer !== undefined || prefersReducedMotion()) return;
      timer = window.setInterval(() => show(index + 1), HERO_INTERVAL_MS);
    }

    // Autoplay pauses on hover, keyboard focus and hidden tabs.
    root.addEventListener("mouseenter", pause, { signal });
    root.addEventListener("mouseleave", play, { signal });
    root.addEventListener("focusin", pause, { signal });
    root.addEventListener("focusout", play, { signal });
    document.addEventListener(
      "visibilitychange",
      () => (document.hidden ? pause() : play()),
      { signal },
    );
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addEventListener(
        "change",
        () => (prefersReducedMotion() ? pause() : play()),
        { signal },
      );
    // Manual navigation: jump and reset the autoplay timer.
    const go = (i: number) => {
      show(i);
      pause();
      play();
    };
    dots.forEach((dot, k) =>
      dot.addEventListener("click", () => go(k), { signal }),
    );

    // Swipe navigation (touch/pen — desktop has hover-pause and
    // dots). A drag past ~40px moves one slide; vertical scrolling
    // is untouched (the gesture turns into a scroll and fires
    // pointercancel) and taps on links/dots are unaffected (delta
    // too small).
    let swipeStartX: number | undefined;
    root.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse") return;
        swipeStartX = e.clientX;
      },
      { signal },
    );
    root.addEventListener(
      "pointerup",
      (e) => {
        if (swipeStartX === undefined) return;
        const dx = e.clientX - swipeStartX;
        swipeStartX = undefined;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? index + 1 : index - 1);
      },
      { signal },
    );
    root.addEventListener("pointercancel", () => (swipeStartX = undefined), {
      signal,
    });

    play();
    heroCleanups.push(() => {
      ac.abort();
      pause();
    });
  });
}

onPageLoad(bindHeroCarousel, {
  // Drop the outgoing page's timers and listeners before a swap.
  cleanup: () => {
    heroCleanups.forEach((fn) => fn());
    heroCleanups.length = 0;
  },
});
