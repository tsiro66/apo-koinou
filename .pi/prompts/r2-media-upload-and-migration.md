---
description: Migrate voice-recording audio to Cloudflare R2 (odigies-r2.md Μέρος Δ) + build the Access-protected /upload Pages Function (option C)
---

# Task: R2 audio migration + upload page for apo-koinou

You are working in `/home/tsiro/Projects/apo-koinou` (Astro 7 static site,
Cloudflare Pages, Tailwind v4, Astro Content Collections; client edits content
via Pages CMS which commits straight to `master`). Read `AGENTS.md` first, and
**read `odigies-r2.md` (repo root) in full before doing anything** — it is the
plan this prompt summarizes. Do both tasks in order; each ships separately
(own commit(s), checks, push).

## Decisions already made (do not re-litigate)

- Media bucket: **`apo-koinou-media`**, public via custom domain
  **`https://media.apo-koinou.com`** (zone is `apo-koinou.com` — hyphenated).
  Already created, domain connected, verified working.
- The bucket is **general-purpose** (today mp3 voice interviews; later possibly
  press-clipping PDFs). Folders inside = one per play slug (`rinokeros/`,
  `autoxeiras/`, …).
- Cache rule: **files are never overwritten in place** — a replacement gets a
  new filename (`-v2`). Enforce this in the upload page by refusing duplicate
  keys.
- Why R2 at all: Pages CMS uploads >~20 MB fail with 413 (their proxy limit),
  and Cloudflare Pages has a 25 MiB per-file static-asset limit — the old
  "audio in `public/`" approach is dead.
- Client is non-technical (theater group); all client-facing text in Greek.
- The custom audio player (`src/components/InterviewAudio.astro` + `.ts`)
  renders `<audio src>` with whatever string the frontmatter holds, so it
  already accepts full cross-origin URLs. **No player changes needed.**

## Current state of the 4 recordings (all still in-repo)

| File in repo | Target R2 key | Frontmatter field to update |
| --- | --- | --- |
| `public/syneunteixeis/anoixta/maxfm-syneunteksi.mp3` | `anoixta/maxfm-syneunteksi.mp3` | `src/content/parastaseis/anoixta.md` |
| `public/syneunteixeis/rinokeros/maxfm-syneunteksi-v3.mp3` | `rinokeros/maxfm-syneunteksi-v3.mp3` | `src/content/parastaseis/rinokeros.md` |
| `public/syneunteixeis/rinokeros/peloponnisos-fm-syneunteksi.mp3` | `rinokeros/peloponnisos-fm-syneunteksi.mp3` | `src/content/parastaseis/rinokeros.md` |
| `public/syneunteixeis/autoxeiras/radio-gamma-94fm-syneunteksi.mp3` | `autoxeiras/radio-gamma-94fm-syneunteksi.mp3` | `src/content/parastaseis/autoxeiras.md` |

## Task 1 — Migration (odigies-r2.md Μέρος Δ)

1. **Verify uploads exist first**: the user must upload the 4 files to R2 (via
   dashboard or ask them). Before touching frontmatter, `curl -sI` each target
   URL (`https://media.apo-koinou.com/<key>`) and require HTTP 200. If any
   404s, stop and ask the user to upload them.
2. **`.pages.yml`**: change the `syneunteixeisAudio.audio` field from
   `type: file` / `options: media: syneunteixeis-media` to `type: string`
   (label «URL ήχου (από το R2)», description with a full example URL), and
   update the field's object `description` to describe the new two-step flow.
   Check whether the `syneunteixeis-media` media library is referenced by any
   other field before removing its definition (run `scripts/lint-pages-yml.mjs`
   — it's in the repo — to validate).
3. **Frontmatter**: rewrite the 4 `audio:` values to full R2 URLs (keep titles
   and dates as-is).
4. **Delete `public/syneunteixeis/`** entirely after the URLs are switched.
5. **Update `odigies-cms.md`**: the «Συνεντεύξεις (ήχος)» section currently
   describes uploading into the CMS media library — rewrite it for the new
   flow (Greek, client-facing). Until the upload page (Task 2) exists, the
   interim client flow is: file to the developer → dev uploads to R2 → client
   pastes URL in CMS. Adjust wording accordingly; Task 2 will finalize it.
6. `pnpm run format && pnpm run check && pnpm run build`, then commit + push.
   **Always `git pull --rebase` before pushing** — the client's Pages CMS
   commits land on `master` constantly and pushes get rejected otherwise.

## Task 2 — Upload page (odigies-r2.md Μέρος Α.4 option C)

Build a **Pages Function** at `functions/upload.ts` serving
`https://apo-koinou.com/upload`. The site stays 100% static otherwise; the
function is the only dynamic endpoint. This is the repo's first `functions/`
directory.

**GET** — minimal page in the site's visual language (dark zinc bg, orange
accent — see `src/components/InterviewAudio.astro` for the palette; inline CSS
is fine, no Tailwind build for the function):
- folder `<select>` with the play slugs (read them from the content dir at
  request time is NOT possible statically — hardcode the list, keep it easy to
  extend, include a comment saying so)
- drag-&-drop zone + file input, progress bar (XHR upload progress), Greek
  labels
- on success: show the final URL prominently with a copy button and the
  reminder «Επικόλλησε αυτό το URL στο Pages CMS»

**POST** — accept multipart `formData()`:
- auth: user will set up **Cloudflare Access (email OTP)** scoped to the
  `/upload*` path; the function should verify the `Cf-Access-Jwt-Assertion`
  header exists (policy enforced by Access itself; deep JWT validation
  optional — keep it simple but note it in a comment). ALSO support a
  fallback: if Pages env var `UPLOAD_PASSWORD` is set, accept `Authorization:
  Bearer <password>` instead (useful for testing outside Access).
- extension whitelist `.mp3` / `.pdf`, content-length ≤ 100 MB (free-plan
  body cap — return a clear Greek error above it)
- sanitize filename: lowercase, latin letters/digits/hyphens only, collapse
  runs of hyphens (reject otherwise — Greek characters must not be transliterated)
- key = `<folder>/<filename>`; run a `BUCKET.head(key)` first and **refuse
  duplicates** with a Greek error telling the client to use a new name
  (`-v2`) — this enforces the cache rule
- `BUCKET.put(key, body)`, respond with the final URL as JSON; the GET page
  renders it for copying

**Bindings/setup the USER does in the dashboard (tell them when you're done):**
1. Pages project → Settings → Functions → **R2 binding**: `BUCKET` =
   `apo-koinou-media`
2. Cloudflare Access app for `apo-koinou.com/upload*`, email-OTP policy with
   the client's address

**Testing**: `wrangler dev` locally with a local R2 sim for logic (sanitizer,
duplicate refusal, size cap), then end-to-end on production after the user
adds the binding. Confirm a real upload lands at
`https://media.apo-koinou.com/<key>` and plays.

**Finish Task 2 by**: updating `odigies-r2.md` (Μέρος Γ client instructions →
final upload-page flow; Μέρος Δ checklist) and `odigies-cms.md` wording from
the interim flow to the final one. Format/check/build, commit, push
(rebase first).

## Gotchas

- Pages Functions routes: static assets take precedence; `/upload` has no
  static counterpart, so the function owns it.
- The client may have made CMS commits while you worked — rebase, resolve
  trivially, push.
- Don't touch `dimosieumata` (press PDFs) — same R2 treatment will come later,
  but it's out of scope today.
- `hxhtika/` is the user's local drop folder for client files; `pdf/` is an
  unrelated untracked folder — never stage either unless explicitly asked.
