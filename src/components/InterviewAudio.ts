// Behavior for the custom interview audio player (InterviewAudio.astro):
// play/pause toggle, seek bar sync, time labels, one-player-at-a-time.
// Bound through onPageLoad so it re-binds after every ClientRouter swap;
// element guards keep double-binding harmless.
import { onPageLoad } from "../scripts/onPageLoad";

/** m:ss; en dash placeholder while the duration is still unknown. */
const fmt = (s: number): string => {
  if (!Number.isFinite(s)) return "\u2013:\u2013\u2013";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

function bindPlayers(): void {
  document
    .querySelectorAll<HTMLElement>("[data-audio-player]:not([data-bound])")
    .forEach((player) => {
      player.dataset.bound = "1";
      const audio = player.querySelector<HTMLAudioElement>(
        "audio[data-audio-el]",
      );
      const btn = player.querySelector<HTMLButtonElement>("[data-audio-play]");
      const iconPlay = player.querySelector<SVGElement>(
        "[data-audio-icon-play]",
      );
      const iconPause = player.querySelector<SVGElement>(
        "[data-audio-icon-pause]",
      );
      const seek = player.querySelector<HTMLInputElement>("[data-audio-seek]");
      const cur = player.querySelector<HTMLElement>("[data-audio-current]");
      const dur = player.querySelector<HTMLElement>("[data-audio-duration]");
      if (!audio || !btn || !iconPlay || !iconPause || !seek || !cur || !dur)
        return;

      const playLabel = player.dataset.labelPlay ?? "Play";
      const pauseLabel = player.dataset.labelPause ?? "Pause";

      /** Orange fill of the seek bar, in percent of the track. */
      const setFill = () => {
        const max = Number(seek.max) || 100;
        seek.style.setProperty(
          "--fill",
          `${(Number(seek.value) / max) * 100}%`,
        );
      };

      const setPlaying = (playing: boolean) => {
        iconPlay.classList.toggle("hidden", playing);
        iconPause.classList.toggle("hidden", !playing);
        btn.setAttribute("aria-label", playing ? pauseLabel : playLabel);
      };

      btn.addEventListener("click", () => {
        if (audio.paused) {
          // One voice at a time: pause every other player on the page.
          document
            .querySelectorAll<HTMLAudioElement>("audio[data-audio-el]")
            .forEach((other) => {
              if (other !== audio) other.pause();
            });
          audio.play();
        } else {
          audio.pause();
        }
      });
      audio.addEventListener("play", () => setPlaying(true));
      audio.addEventListener("pause", () => setPlaying(false));

      // Duration arrives once the metadata header is fetched — usually
      // before this script runs for small files (then loadedmetadata
      // has already fired and must not be waited on), otherwise on a
      // durationchange after binding.
      const applyDuration = () => {
        seek.max = String(audio.duration);
        dur.textContent = fmt(audio.duration);
      };
      if (audio.readyState >= 1 /* HAVE_METADATA */) applyDuration();
      else audio.addEventListener("loadedmetadata", applyDuration);
      setFill();

      seek.addEventListener("input", () => {
        if (!Number.isFinite(audio.duration)) return;
        audio.currentTime = Number(seek.value);
        cur.textContent = fmt(Number(seek.value));
        setFill();
      });

      audio.addEventListener("timeupdate", () => {
        if (audio.seeking) return;
        seek.value = String(audio.currentTime);
        cur.textContent = fmt(audio.currentTime);
        setFill();
      });

      audio.addEventListener("ended", () => {
        setPlaying(false);
        seek.value = "0";
        cur.textContent = fmt(0);
        setFill();
      });
    });
}

onPageLoad(bindPlayers);
