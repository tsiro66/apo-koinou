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
      // No autoplay when the OS asks for reduced motion, and none once
      // the root left the DOM (a post-swap cleanup may race a pending
      // snap — its callbacks must not resurrect the timer).
      if (timer !== undefined || prefersReducedMotion() || !root.isConnected)
        return;
      timer = window.setInterval(() => show(index + 1), HERO_INTERVAL_MS);
    }

    // Autoplay pauses only while the tab is hidden (hover and keyboard
    // focus no longer pause it).
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
      interruptSnap(); // a snap in flight must not fight the class swap
      show(i);
      pause();
      play();
    };
    dots.forEach((dot, k) =>
      dot.addEventListener("click", () => go(k), { signal }),
    );

    // —— Touch/pen swipe —————————————————————————————————————
    // The photo tracks the finger: the current slide follows the drag
    // while the incoming one rides alongside, exactly one viewport
    // away; release either settles on the neighbor or springs back.
    // Desktop keeps the dots (mouse never swipes).
    // touch-action: pan-y keeps vertical scrolling native — gestures
    // that turn into a scroll arrive as pointercancel and spring back.
    // A committed swipe suppresses the click that follows it, so a
    // drag starting on the watch-now link never navigates.
    let pointerId: number | undefined;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let dx = 0;
    let dragW = 0;
    let applied = false; // a move actually drove the slides
    let neighbor: HTMLElement | undefined;
    let pendingSnap: { run: () => void } | undefined;
    let snapTimer: number | undefined;
    let suppressClick = false;

    const flush = (el: HTMLElement) => void el.offsetWidth;
    const snapDuration = () =>
      prefersReducedMotion() ? "none" : "transform 0.3s ease-out";

    // Bring the incoming slide in just offscreen on the drag's side,
    // transitions off while the finger drives it. Also retire a
    // previously parked neighbor when the drag flips direction.
    function parkNeighbor(dir: -1 | 1, w: number): HTMLElement {
      const target =
        slides[
          dir === -1
            ? (index + 1) % slides.length
            : (index - 1 + slides.length) % slides.length
        ];
      if (neighbor && neighbor !== target) {
        neighbor.style.transition = "none";
        neighbor.style.transform = "";
        neighbor.style.opacity = "";
        neighbor.style.zIndex = "";
        flush(neighbor);
        neighbor.style.transition = "";
      }
      neighbor = target;
      neighbor.style.transition = "none";
      neighbor.style.transform = `translateX(${dir === -1 ? w : -w}px)`;
      neighbor.style.opacity = "1";
      neighbor.style.zIndex = "3"; // above is-under leftovers mid-drag
      return target;
    }

    function discardNeighbor() {
      if (!neighbor) return;
      neighbor.style.transition = "none";
      neighbor.style.transform = "";
      neighbor.style.opacity = "";
      neighbor.style.zIndex = "";
      flush(neighbor);
      neighbor.style.transition = "";
      neighbor = undefined;
    }

    // Jump a snap in flight to its settled state so a new gesture or a
    // dot press starts from clean inline styles and a consistent index.
    function interruptSnap() {
      if (snapTimer !== undefined) {
        window.clearTimeout(snapTimer);
        snapTimer = undefined;
      }
      const pending = pendingSnap;
      pendingSnap = undefined;
      pending?.run();
    }

    function armSnap() {
      snapTimer = window.setTimeout(() => {
        snapTimer = undefined;
        const pending = pendingSnap;
        pendingSnap = undefined;
        pending?.run();
      }, 320);
    }

    function commitSwipe(nb: HTMLElement) {
      const cur = slides[index];
      const target =
        dx < 0
          ? (index + 1) % slides.length
          : (index - 1 + slides.length) % slides.length;
      cur.style.transition = snapDuration();
      nb.style.transition = snapDuration();
      cur.style.transform = `translateX(${dx < 0 ? -dragW : dragW}px)`;
      nb.style.transform = "translateX(0)";
      pendingSnap = {
        run: () => {
          // Hand over to the class state before dropping the inline
          // styles: incoming is .is-active (opaque) before its inline
          // opacity goes, so nothing flashes.
          nb.style.transition = "none";
          nb.classList.add("is-active");
          nb.style.transform = "";
          nb.style.opacity = "";
          nb.style.zIndex = "";
          flush(nb);
          nb.style.transition = "";
          cur.style.transition = "none";
          cur.classList.remove("is-active");
          cur.style.transform = "";
          flush(cur);
          cur.style.transition = "";
          neighbor = undefined;
          index = target;
          sync(index);
          play();
        },
      };
      armSnap();
      suppressClick = true;
    }

    function springBack() {
      const cur = slides[index];
      const nb = neighbor;
      cur.style.transition = snapDuration();
      cur.style.transform = "translateX(0)";
      if (nb) {
        nb.style.transition = snapDuration();
        nb.style.transform = `translateX(${dx < 0 ? dragW : -dragW}px)`;
        nb.style.opacity = "1";
      }
      pendingSnap = {
        run: () => {
          discardNeighbor();
          cur.style.transition = "none";
          cur.style.transform = "";
          flush(cur);
          cur.style.transition = "";
          play();
        },
      };
      armSnap();
    }

    function beginSwipe(e: PointerEvent) {
      if (e.pointerType === "mouse") return;
      if (pointerId !== undefined) return; // second finger: ignored
      interruptSnap();
      pointerId = e.pointerId;
      startX = lastX = e.clientX;
      startY = e.clientY;
      lastT = e.timeStamp;
      dragW = root.clientWidth;
      dx = 0;
      applied = false;
      suppressClick = false;
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone — tracking still works inside the hero */
      }
      pause(); // the user is driving; autoplay must not fire mid-drag
    }

    function moveSwipe(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Not yet a horizontal gesture — or it turned vertical (pan-y
      // then scrolls natively and cancels us): hands off the slides.
      if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) return;
      const dir = dx < 0 ? -1 : 1;
      const nb = parkNeighbor(dir, dragW);
      const cur = slides[index];
      cur.style.transition = "none";
      cur.style.transform = `translateX(${dx}px)`;
      nb.style.transform = `translateX(${
        dir === -1 ? dragW + dx : dx - dragW
      }px)`;
      nb.style.opacity = "1";
      applied = true;
      lastX = e.clientX;
      lastT = e.timeStamp;
    }

    // Commit on distance (~15% of the hero) or flick velocity, spring
    // back otherwise. A vertical-dominated gesture never applied, so
    // it can only spring back.
    function settle(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      pointerId = undefined;
      const nb = neighbor; // const capture so TS can narrow it
      const v = Math.abs(e.clientX - lastX) / Math.max(1, e.timeStamp - lastT);
      const commit =
        applied &&
        nb !== undefined &&
        (Math.abs(dx) > dragW * 0.15 || (v > 0.6 && Math.abs(dx) > 24));
      if (commit) commitSwipe(nb);
      else springBack();
    }

    root.addEventListener("pointerdown", beginSwipe, { signal });
    root.addEventListener("pointermove", moveSwipe, { signal });
    root.addEventListener("pointerup", settle, { signal });
    root.addEventListener(
      "pointercancel",
      (e) => {
        if (e.pointerId !== pointerId) return;
        pointerId = undefined;
        springBack();
      },
      { signal },
    );
    // A committed swipe is not a tap: eat the click that follows so the
    // watch-now link (or a dot) under the finger never fires.
    root.addEventListener(
      "click",
      (e) => {
        if (!suppressClick) return;
        suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
      },
      { capture: true, signal },
    );

    play();
    heroCleanups.push(() => {
      ac.abort();
      interruptSnap(); // a snap's timer must not outlive the page
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
