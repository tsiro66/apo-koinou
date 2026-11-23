// Pages Function: /upload — client-facing drag & drop uploader that puts
// interview mp3s (and later press PDFs) straight into the R2 bucket
// behind https://media.apo-koinou.com. This is the repo's only dynamic
// endpoint; everything else stays static (static assets take precedence
// over functions, and /upload has no static counterpart).
//
// Setup done in the Cloudflare dashboard (NOT in this repo):
//   1. Pages project → Settings → Functions → R2 binding: BUCKET =
//      "apokoinou-media" (το πραγματικό όνομα του bucket — χωρίς παύλα).
//      Το όνομα του bucket φαίνεται μόνο εδώ· δημόσια σερβίρεται πάντα μέσω
//      media.apo-koinou.com.
//   2. Cloudflare Access application for apo-koinou.com/upload* with an
//      email-OTP policy for the client's address. Access gates the page
//      and every POST at the edge before this code even runs.
//   3. Optional: Pages env var UPLOAD_PASSWORD — fallback auth (Bearer)
//      for testing outside Access (wrangler dev, curl). The page has a
//      matching optional password field.
//
// Cache rule: files are NEVER overwritten in place — a replacement gets a
// new filename (-v2). Enforced below by refusing duplicate keys.

// ── Minimal local types ──────────────────────────────────────────────
// The project tsconfig includes **/*, so astro check type-checks this
// file. @cloudflare/workers-types would clash with the DOM lib, so these
// mirror just the surface we use. Request/Response/FormData/File come
// from the DOM lib and are runtime-compatible with the Workers runtime.

interface R2ObjectLike {
  key: string;
  size: number;
}

interface R2BucketLike {
  head(key: string): Promise<R2ObjectLike | null>;
  put(
    key: string,
    value: Blob | ArrayBuffer | ReadableStream<Uint8Array>,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

interface Env {
  BUCKET: R2BucketLike;
  UPLOAD_PASSWORD?: string;
}

interface EventContextLike {
  request: Request;
  env: Env;
}

// ── Constants ────────────────────────────────────────────────────────

// Public base URL of the R2 bucket's custom domain.
const MEDIA_BASE = "https://media.apo-koinou.com";

// Free-plan Pages body cap — keep a little under 100 MB so multipart
// overhead can't push a 100 MB file over the platform limit.
const MAX_BYTES = 99 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(["mp3", "pdf"]);

// A folder per play slug, mirroring src/content/parastaseis (+ the
// repertorio play). HARD CODED on purpose: the static build can't read
// the content collections at request time. When a new play is added via
// the CMS, add one line here — or use the «Άλλο» option on the page,
// which accepts any slug-shaped folder name (validated server-side).
const PLAY_FOLDERS: Array<{ slug: string; label: string }> = [
  { slug: "anoixta", label: "Πάντα ανοιχτά… (Σολωμός)" },
  { slug: "apel", label: "Απελευθέρωση της Πάτρας" },
  { slug: "autoxeiras", label: "Η κωμωδία ενός ιδανικού αυτόχειρα" },
  { slug: "gynaikon-pathi", label: "Γυναικών Πάθη" },
  { slug: "ekpnoes", label: "Εκπνοές νερού" },
  { slug: "epistrofh", label: "Επιστροφή" },
  { slug: "itan-oloi-tous-paidia-mou", label: "Ήταν όλοι τους παιδιά μου" },
  { slug: "kiklos", label: "Ο κύκλος με την κιμωλία (ρεπερτόριο)" },
  { slug: "kommatia-mou", label: "Κομμάτια μου πού να σας βρω" },
  { slug: "arkas", label: "Λίγο πριν, λίγο μετά το… τέλος" },
  { slug: "metakinisi-exi-gia-ton-papou-aristophani", label: "Μετακίνηση 6" },
  { slug: "mualo-xourafi", label: "Μυαλό ξουράφι" },
  { slug: "gyrizi", label: "Να κι αν γυρίζει να κι αν δεν γυρίζει" },
  { slug: "vussinokhpos", label: "Ο βυσσινόκηπος" },
  { slug: "glaros", label: "Ο γλάρος" },
  { slug: "epitheoriths", label: "Ο επιθεωρητής" },
  { slug: "o-kalos-anthrwpos", label: "Ο καλός άνθρωπος του ΣενΤσουαν" },
  {
    slug: "eseis-ti-tha-kanate-sthn-thesi-mou",
    label: "Ο Μπίντερμαν και οι εμπρηστές",
  },
  { slug: "panigyri", label: "Το πανηγύρι" },
  {
    slug: "patwntas-panw-sthn-anemelia-sou",
    label: "Πατώντας πάνω στην ανεμελιά σου",
  },
  { slug: "pyrkagies", label: "Πυρκαγιές" },
  { slug: "rinokeros", label: "Ρινόκερος" },
  { slug: "fomalo", label: "Φομαλώ" },
];

const FOLDER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ── Helpers ──────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function contentTypeFor(ext: string): string {
  return ext === "pdf" ? "application/pdf" : "audio/mpeg";
}

/**
 * Normalize an uploaded filename to the site's naming rules:
 * lowercase latin letters, digits and single hyphens, one allowed
 * extension. Spaces/underscores become hyphens; hyphen runs collapse.
 * Anything else (Greek letters, dots, parentheses, …) is REJECTED, not
 * transliterated — the client renames the file, keeping URLs mechanical
 * and cache-safe. Returns null when the name can't be used.
 */
function sanitizeFilename(raw: string): string | null {
  const dot = raw.lastIndexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return null;
  const ext = raw.slice(dot + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;

  let base = raw
    .slice(0, dot)
    .toLowerCase()
    .replace(/[ _]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base.length === 0 || base.length > 120) return null;
  if (!/^[a-z0-9-]+$/.test(base)) return null;
  if (!FOLDER_PATTERN.test(base)) return null;
  return `${base}.${ext}`;
}

function authorized(request: Request, env: Env): boolean {
  // Cloudflare Access (email OTP) is scoped to /upload* at the edge.
  // If Access let the request through it has authenticated the user and
  // injected this header — we check presence only and deliberately skip
  // deep JWT validation: the edge policy is the gate, the bucket is the
  // only thing this function can touch.
  if (request.headers.has("Cf-Access-Jwt-Assertion")) return true;
  // Fallback for testing outside Access (wrangler dev / curl) or as a
  // stopgap until Access is set up.
  const password = env.UPLOAD_PASSWORD;
  if (password && request.headers.get("Authorization") === `Bearer ${password}`)
    return true;
  return false;
}

// ── GET /upload — the page ───────────────────────────────────────────

export async function onRequestGet(
  context: EventContextLike,
): Promise<Response> {
  const options = PLAY_FOLDERS.map(
    (f) => `      <option value="${f.slug}">${f.label} — ${f.slug}</option>`,
  ).join("\n");

  const html = `<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Ανέβασμα αρχείου — Από κοινού</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; justify-content: center;
    background: #09090b; color: #fafafa;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 16px; line-height: 1.6; padding: 2.5rem 1.25rem 4rem;
  }
  main { width: 100%; max-width: 620px; }
  .brand {
    display: flex; align-items: center; gap: .5rem;
    letter-spacing: .35em; font-size: .75rem; font-weight: 700;
    color: rgba(250,250,250,.6);
  }
  .brand::before {
    content: ""; width: .75rem; height: .75rem; background: #c25908;
    display: inline-block;
  }
  h1 { font-size: 1.75rem; margin: .75rem 0 .25rem; }
  .sub { color: rgba(250,250,250,.55); margin: 0 0 2rem; }
  .lbl {
    display: block; font-size: .8rem; font-weight: 600;
    letter-spacing: .05em; margin-bottom: .4rem;
  }
  select, input[type=text] {
    width: 100%; padding: .65rem .75rem; appearance: none;
    background: #18181b; color: #fafafa; border: 1px solid rgba(250,250,250,.2);
    border-radius: 0; font: inherit; margin-bottom: 1.5rem;
  }
  select:focus, input:focus { outline: 2px solid #c25908; outline-offset: -1px; }
  .drop {
    border: 1px dashed rgba(250,250,250,.3); padding: 2.25rem 1rem;
    text-align: center; cursor: pointer; margin-bottom: 1.5rem;
    transition: border-color .15s, background .15s;
  }
  .drop.on { border-color: #c25908; background: rgba(194,89,8,.08); }
  .drop-t { margin: 0; font-weight: 600; }
  .drop-s { margin: .25rem 0 0; color: rgba(250,250,250,.55); }
  .drop-f { margin: .75rem 0 0; font-size: .8rem; color: rgba(250,250,250,.4); }
  .linkish {
    background: none; border: none; padding: 0; color: #c25908;
    text-decoration: underline; cursor: pointer; font: inherit;
  }
  .fileinfo { margin: -1rem 0 1.5rem; font-size: .9rem; }
  .fileinfo b { font-weight: 600; }
  .key-preview {
    margin: -1rem 0 1.5rem; font-size: .85rem; word-break: break-all;
    font-family: ui-monospace, monospace; color: rgba(250,250,250,.6);
  }
  .key-preview.bad { color: #f87171; }
  .bar {
    height: 3px; background: rgba(250,250,250,.15); margin-bottom: .4rem;
  }
  #bar-fill { height: 100%; width: 0%; background: #c25908; transition: width .2s; }
  .pct { font-size: .8rem; color: rgba(250,250,250,.55); margin: 0 0 1rem; }
  .btn {
    display: inline-block; border: none; border-radius: 0; cursor: pointer;
    background: #c25908; color: #fafafa; font: inherit; font-weight: 600;
    padding: .7rem 1.5rem; transition: background .15s, color .15s;
  }
  .btn:hover:not(:disabled) { background: #fafafa; color: #09090b; }
  .btn:disabled { opacity: .35; cursor: not-allowed; }
  .err {
    border: 1px solid rgba(248,113,113,.4); background: rgba(248,113,113,.08);
    color: #f87171; padding: .9rem 1rem; margin-top: 1.5rem; word-wrap: anywhere;
  }
  .ok { border: 1px solid rgba(250,250,250,.2); padding: 1.25rem; margin-top: 1.5rem; }
  .ok-t { margin: 0 0 .75rem; font-weight: 700; color: #fafafa; }
  .url {
    display: block; word-break: break-all; background: #18181b;
    border: 1px solid rgba(250,250,250,.15); padding: .75rem;
    font-family: ui-monospace, monospace; font-size: .9rem; margin-bottom: 1rem;
  }
  .remind {
    margin: 1rem 0 0; padding: .75rem 1rem; font-weight: 700;
    background: rgba(194,89,8,.12); border-left: 3px solid #c25908;
  }
  .ok-sub { margin: 1rem 0 0; font-size: .85rem; color: rgba(250,250,250,.55); }
  .ok-sub a { color: #c25908; }
  .pw-wrap { margin: -.5rem 0 1.5rem; font-size: .85rem; color: rgba(250,250,250,.5); }
  .pw-wrap input { margin-bottom: 0; }
</style>
</head>
<body>
<main>
  <div class="brand">ΑΠΟ ΚΟΙΝΟΥ</div>
  <h1>Ανέβασμα αρχείου</h1>
  <p class="sub">Ηχογραφήσεις συνεντεύξεων (mp3) και δημοσιεύματα (PDF), έως 100&nbsp;MB. Στο τέλος θα πάρεις το URL για το Pages CMS.</p>

  <label class="lbl" for="folder">Παράσταση (φάκελος)</label>
  <select id="folder">
${options}
    <option value="__other__">— Άλλο (νέος φάκελος) —</option>
  </select>

  <div id="custom-wrap" hidden>
    <label class="lbl" for="custom">Όνομα φακέλου (slug)</label>
    <input type="text" id="custom" autocomplete="off" placeholder="π.χ. neon-theama">
  </div>

  <div class="pw-wrap">
    <label class="lbl" for="pw">Κωδικός (προαιρετικό — μόνο αν σου έχει δοθεί)</label>
    <input type="text" id="pw" autocomplete="off" placeholder="κενό αν συνδέεσαι με Cloudflare Access">
  </div>

  <div id="drop" class="drop">
    <input type="file" id="file" accept=".mp3,.pdf" hidden>
    <p class="drop-t">Σύρε το αρχείο εδώ</p>
    <p class="drop-s">ή <button type="button" class="linkish" id="pick">πάτα για να το επιλέξεις</button></p>
    <p class="drop-f">Όνομα με μικρά αγγλικά γράμματα, αριθμούς και παύλες — π.χ. radio-gamma-94fm-syneunteksi.mp3</p>
  </div>
  <p id="fileinfo" class="fileinfo" hidden></p>
  <p id="key-preview" class="key-preview" hidden></p>

  <div id="bar" class="bar" hidden><div id="bar-fill"></div></div>
  <p id="pct" class="pct" hidden></p>

  <button id="upload" class="btn" type="button" disabled>Ανέβασμα</button>

  <div id="err" class="err" hidden></div>

  <div id="ok" class="ok" hidden>
    <p class="ok-t">✓ Το αρχείο ανέβηκε!</p>
    <code id="url" class="url"></code>
    <button id="copy" class="btn" type="button">Αντιγραφή URL</button>
    <p class="remind">Επικόλλησε αυτό το URL στο Pages CMS</p>
    <p class="ok-sub"><a id="open" href="#" target="_blank" rel="noopener">Άνοιγμα αρχείου</a> — για να επιβεβαιώσεις ότι παίζει. Αν το αντικαταστήσεις αργότερα, χρησιμοποίησε <b>νέο όνομα</b> (π.χ. …-v2.mp3): το ίδιο όνομα δεν ανεβαίνει ξανά.</p>
  </div>
</main>
<script>
(function () {
  "use strict";
  var BASE = ${JSON.stringify(MEDIA_BASE)};
  var FOLDER_RE = ${JSON.stringify(FOLDER_PATTERN.source)};
  var MAX_MB = ${Math.floor(MAX_BYTES / 1024 / 1024)};

  var drop = document.getElementById("drop");
  var fileInput = document.getElementById("file");
  var pick = document.getElementById("pick");
  var folder = document.getElementById("folder");
  var customWrap = document.getElementById("custom-wrap");
  var custom = document.getElementById("custom");
  var pw = document.getElementById("pw");
  var fileinfo = document.getElementById("fileinfo");
  var preview = document.getElementById("key-preview");
  var bar = document.getElementById("bar");
  var barFill = document.getElementById("bar-fill");
  var pct = document.getElementById("pct");
  var upload = document.getElementById("upload");
  var errBox = document.getElementById("err");
  var okBox = document.getElementById("ok");
  var urlBox = document.getElementById("url");
  var openLink = document.getElementById("open");
  var copyBtn = document.getElementById("copy");
  var currentFile = null;

  // Same rules as the server (which is the source of truth).
  function sanitize(name) {
    if (!name) return null;
    var dot = name.lastIndexOf(".");
    if (dot <= 0 || dot === name.length - 1) return null;
    var ext = name.slice(dot + 1).toLowerCase();
    if (ext !== "mp3" && ext !== "pdf") return null;
    var base = name.slice(0, dot).toLowerCase()
      .replace(/[ _]+/g, "-").replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!base || base.length > 120) return null;
    if (!new RegExp("^[a-z0-9-]+$").test(base)) return null;
    if (!new RegExp("^" + FOLDER_RE + "$").test(base)) return null;
    return base + "." + ext;
  }

  function chosenFolder() {
    if (folder.value === "__other__") {
      var v = (custom.value || "").trim().toLowerCase();
      return new RegExp("^" + FOLDER_RE + "$").test(v) ? v : null;
    }
    return folder.value;
  }

  function human(size) {
    if (size > 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + " MB";
    return Math.max(1, Math.round(size / 1024)) + " KB";
  }

  function refresh() {
    errBox.hidden = true;
    okBox.hidden = true;
    var f = chosenFolder();
    var clean = currentFile ? sanitize(currentFile.name) : null;
    preview.hidden = true;
    preview.classList.remove("bad");
    upload.disabled = !(f && currentFile && clean);
    if (!currentFile) return;
    fileinfo.hidden = false;
    fileinfo.innerHTML = "";
    var b = document.createElement("b");
    b.textContent = currentFile.name;
    fileinfo.append(b, " — " + human(currentFile.size));
    preview.hidden = false;
    if (!clean) {
      preview.classList.add("bad");
      preview.textContent =
        "Το όνομα δεν γίνεται δεκτό. Μετάφρασέ το σε μικρά αγγλικά γράμματα, " +
        "αριθμούς και παύλες (χωρίς ελληνικά, κενά, κεφαλαία) και ξαναδιάλεξε το αρχείο.";
      return;
    }
    if (currentFile.size > MAX_MB * 1024 * 1024) {
      preview.classList.add("bad");
      preview.textContent =
        "Το αρχείο είναι " + human(currentFile.size) +
        " — το όριο είναι " + MAX_MB + " MB.";
      upload.disabled = true;
      return;
    }
    preview.textContent = "Θα ανέβει ως: " + BASE + "/" + (f || "…") + "/" + clean;
  }

  function setFile(file) {
    currentFile = file;
    refresh();
  }

  pick.addEventListener("click", function () { fileInput.click(); });
  drop.addEventListener("click", function (e) {
    if (e.target === pick) return;
    fileInput.click();
  });
  fileInput.addEventListener("change", function () {
    if (fileInput.files && fileInput.files[0]) setFile(fileInput.files[0]);
  });
  ["dragover", "dragenter"].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      drop.classList.add("on");
    });
  });
  ["dragleave", "dragend"].forEach(function (ev) {
    drop.addEventListener(ev, function () { drop.classList.remove("on"); });
  });
  drop.addEventListener("drop", function (e) {
    e.preventDefault();
    drop.classList.remove("on");
    var dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) setFile(dt.files[0]);
  });
  folder.addEventListener("change", function () {
    var other = folder.value === "__other__";
    if (customWrap) customWrap.hidden = !other;
    if (other && custom) custom.focus();
    refresh();
  });
  if (custom) custom.addEventListener("input", refresh);

  upload.addEventListener("click", function () {
    var f = chosenFolder();
    var clean = currentFile ? sanitize(currentFile.name) : null;
    if (!f || !currentFile || !clean) return;
    errBox.hidden = true;
    okBox.hidden = true;
    upload.disabled = true;
    upload.textContent = "Ανεβαίνει…";
    bar.hidden = false;
    pct.hidden = false;

    var fd = new FormData();
    fd.append("folder", f);
    fd.append("file", currentFile, clean);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload");
    if (pw.value) xhr.setRequestHeader("Authorization", "Bearer " + pw.value);
    xhr.upload.addEventListener("progress", function (e) {
      if (!e.lengthComputable) return;
      var p = Math.round((e.loaded / e.total) * 100);
      barFill.style.width = p + "%";
      pct.textContent = p + "%";
    });
    xhr.addEventListener("load", function () {
      bar.hidden = true;
      pct.hidden = true;
      barFill.style.width = "0%";
      var body = {};
      try { body = JSON.parse(xhr.responseText); } catch (ex) {}
      if (xhr.status === 200 && body.url) {
        urlBox.textContent = body.url;
        openLink.href = body.url;
        okBox.hidden = false;
        upload.textContent = "Ανέβηκε ✓";
        return;
      }
      upload.disabled = false;
      upload.textContent = "Ανέβασμα";
      errBox.hidden = false;
      errBox.textContent = body.error ||
        "Κάτι πήγε στραβά (κωδικός " + xhr.status + "). Δοκίμασε ξανά.";
    });
    xhr.addEventListener("error", function () {
      bar.hidden = true;
      pct.hidden = true;
      upload.disabled = false;
      upload.textContent = "Ανέβασμα";
      errBox.hidden = false;
      errBox.textContent = "Πρόβλημα σύνδεσης — δοκίμασε ξανά.";
    });
    xhr.send(fd);
  });

  copyBtn.addEventListener("click", function () {
    var text = urlBox.textContent || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else { done(); }
    function done() {
      copyBtn.textContent = "Αντέγραψε ✓";
      setTimeout(function () { copyBtn.textContent = "Αντιγραφή URL"; }, 2000);
    }
  });

  refresh();
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

// ── POST /upload — receive the file, put it in R2 ────────────────────

export async function onRequestPost(
  context: EventContextLike,
): Promise<Response> {
  const { request, env } = context;

  if (!env.BUCKET) {
    return json(
      {
        error:
          "Ο διαχειριστής δεν έχει συνδέσει το binding BUCKET — πες του να το προσθέσει στις ρυθμίσεις του Pages project.",
      },
      500,
    );
  }

  if (!authorized(request, env)) {
    return json(
      {
        error:
          "Απαιτείται σύνδεση. Άνοιξε τη σελίδα μέσω του συνδέσμου σου (Cloudflare Access) — ή, αν σου έχει δοθεί κωδικός, γράψε τον στο πεδίο «Κωδικός».",
      },
      401,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BYTES) {
    return json({ error: oversizedError() }, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Δεν διαβάστηκε το αρχείο — δοκίμασε ξανά." }, 400);
  }

  const folder = String(form.get("folder") ?? "");
  if (
    folder.length === 0 ||
    folder.length > 60 ||
    !FOLDER_PATTERN.test(folder)
  ) {
    return json(
      {
        error:
          "Μη έγκυρος φάκελος παράστασης. Διάλεξε μία από τη λίστα ή γράψε όνομα με μικρά αγγλικά γράμματα και παύλες.",
      },
      400,
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json(
      { error: "Δεν βρέθηκε αρχείο — σύρε το mp3/PDF στη ζώνη ανεβάσματος." },
      400,
    );
  }

  if (file.size > MAX_BYTES) {
    return json({ error: oversizedError() }, 413);
  }

  const cleanName = sanitizeFilename(file.name);
  if (!cleanName) {
    return json({ error: badNameError(file.name) }, 400);
  }

  const key = `${folder}/${cleanName}`;

  // Cache rule: never overwrite in place. If the key exists, the client
  // must pick a new name (…-v2.mp3) so the edge can't serve a stale mix.
  const existing = await env.BUCKET.head(key);
  if (existing) {
    return json(
      {
        error: `Υπάρχει ήδη αρχείο με αυτό το όνομα: ${MEDIA_BASE}/${key}. Δεν γίνεται επικάλυψη — μετονόμασε το αρχείο σου (π.χ. ${cleanName.replace(/\.(\w+)$/, "-v2.$1")}) και δοκίμασε ξανά.`,
      },
      409,
    );
  }

  const ext = cleanName.slice(cleanName.lastIndexOf(".") + 1);
  await env.BUCKET.put(key, file, {
    httpMetadata: { contentType: contentTypeFor(ext) },
  });

  return json({ url: `${MEDIA_BASE}/${key}`, key });
}

function oversizedError(): string {
  return `Το αρχείο ξεπερνά το όριο των ${Math.floor(MAX_BYTES / 1024 / 1024)} MB — δεν ανεβαίνει από εδώ. Στείλτε το στον διαχειριστή του site, που το ανεβάζει απευθείας στο Cloudflare.`;
}

function badNameError(raw: string): string {
  return `Το όνομα «${raw}» δεν γίνεται δεκτό. Χρειάζεται μικρά αγγλικά γράμματα, αριθμούς και παύλες — χωρίς ελληνικά, κενά ή κεφαλαία (π.χ. radio-gamma-94fm-syneunteksi.mp3).`;
}
