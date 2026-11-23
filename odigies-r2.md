# Οδηγίες: Μεγάλα αρχεία (ήχος συνεντεύξεων, PDF κ.λπ.) σε Cloudflare R2

> **Γιατί:** Το Pages CMS ανεβάζει τα media μέσα από τον δικό του server, που έχει
> όριο ~20 MB — μεγαλύτερα αρχεία αποτυγχάνουν με σφάλμα **413**. Επιπλέον, το
> Cloudflare Pages έχει όριο **25 MiB ανά αρχείο** στα static assets του repo, οπότε
> ακόμη και αν παρακάμψουμε το CMS, ένα πιο μεγάλο mp3 θα «έσπαγε» όλο το deploy.
>
> **Η λύση:** Τα μεγάλα αρχεία ανεβάζονται σε ένα **Cloudflare R2 bucket**
> (`apo-koinou-media` — 10 GB δωρεάν, μηδενική χρέωση για κίνηση δεδομένων/egress)
> και το Pages CMS κρατάει απλώς το **URL** του αρχείου. Το site τα σερβίρει από
> εκεί — καμία αλλαγή στους players/viewers. Το bucket είναι γενικής χρήσης:
> σήμερα mp3 συνεντεύξεων, αύριο π.χ. PDF δημοσιευμάτων — γι' αυτό και το όνομα.
>
> **Κόστος:** Δωρεάν έως 10 GB αποθήκευση (≈ 120+ ηχογραφήσεις 20 λεπτών). Πέρα από
> αυτό: ~$0.015/GB/μήνα αποθήκευση, δωρεάν egress. Απαιτείται συνημμένη κάρτα στον
> λογαριασμό Cloudflare για την ενεργοποίηση του R2, ακόμη και για το δωρεάν όριο —
> δεν γίνεται χρέωση αν μείνουμε κάτω από τα όρια.

---

## Μέρος Α — Δημιουργία του bucket (μία φορά, ~10 λεπτά)

*(Αυτά τα κάνεις εσύ — χρειάζονται πρόσβαση στο Cloudflare dashboard του λογαριασμού
που φιλοξενεί ήδη το site.)*

### 1. Ενεργοποίηση του R2

1. Σύνδεση στο [dash.cloudflare.com](https://dash.cloudflare.com).
2. Από το αριστερό μενού του λογαριασμού (όχι του domain): **R2 Object Storage**.
3. Αν είναι η πρώτη φορά: **Purchase R2** / **Get started** → δέχεται τους όρους και
   **συνημμένα στοιχεία πληρωμής** (χρειάζονται even για το δωρεάν όριο· δεν θα
   γίνει χρέωση κάτω από 10 GB).

### 2. Δημιουργία του bucket

1. Στο R2: **Create bucket**.
2. **Bucket name:** `apo-koinou-media`
   (το όνομα δεν αλλάζει ποτέ μετά τη δημιουργία — γι' αυτό γενική ονομασία, όχι
   «audio»)
3. **Location:** Automatic (ή EU — αδιάφορο πρακτικά για κείμενο/ήχο).
4. **Default Storage Class:** Standard.
5. **Create bucket**.

### 3. Δημόσιος σύνδεσμος μέσω custom domain

Το mp3 πρέπει να είναι προσβάσιμο από τον browser χωρίς authenticate. Το κάνουμε με
subdomain του site (π.χ. `media.apo-koinou.com`) — προϋπόθεση: το `apo-koinou.com` είναι
ήδη zone στον ίδιο λογαριασμό Cloudflare (είναι, αφού το site τρέχει σε Pages). Αν
αγοραστεί στο μέλλον και το `apo-koinou.gr`, δεν χρειάζεται καμία αλλαγή εδώ — το
custom domain του R2 μένει κανονικά στο `.com`.

1. Μπες στο bucket → καρτέλα **Settings**. Θα δεις δύο ξεχωριστές κάρτες:
   - **Public Development URL** (`r2.dev`) — «μην το χρησιμοποιείς»: είναι για δοκιμές,
     με αυστηρά rate limits, όχι για παραγωγή.
   - **Custom Domains** — αυτό θέλουμε.
2. Στην κάρτα **Custom Domains** → **Connect Domain** → γράψε `media.apo-koinou.com` →
   **Continue** → επιβεβαίωση.
   Το Cloudflare προσθέτει αυτόματα το CNAME στο DNS και εκδίδει πιστοποιητικό
   (χρειάζεται μερικά λεπτά).
3. Το Cloudflare προσθέτει αυτόματα το CNAME στο DNS και εκδίδει πιστοποιητικό
   (χρειάζεται μερικά λεπτά).
4. *(Προαιρετικά, μόνο για δοκιμή αν κολλήσει το domain:)* μπορείς προσωρινά να
   ενεργοποιήσεις το **Public Development URL** — δουλεύει αμέσως αλλά είναι
   αυστηρά rate-limited, **όχι για παραγωγή**· μετά τη δοκιμή κλείστο.
5. Έλεγχος: ανέβασε ένα δοκιμαστικό αρχείο (bucket → **Upload**) και άνοιξε
   `https://media.apo-koinou.com/<όνομα-αρχείου>` στον browser. Αν κατεβαίνει/παίζει,
   είμαστε έτοιμοι.

> **Αν δεν βλέπεις καθόλου κάρτα «Custom Domains», ή στο «Continue» βγάζει**
> **«That domain was not found on your account»**: το bucket και το zone
> `apo-koinou.com` είναι σε **διαφορετικούς λογαριασμούς Cloudflare**. Βρες στο
> account switcher (πάνω αριστερά) τον λογαριασμό που φιλοξενεί το zone (αυτόν με
> το Pages project) και κάνε εκεί όλο το setup του R2 (ενεργοποίηση + κάρτα είναι
> ανά λογαριασμό). Τα buckets δεν μεταφέρονται μεταξύ λογαριασμών — αν έφτιαξες
> bucket σε λάθος λογαριασμό, απλώς σβέστο εκεί και ξαναφτιάξτο στον σωστό (άδειο
> = μηδενικό κόστος). Το zone πρέπει να είναι σε κατάσταση Active. Το R2 δουλεύει
> κανονικά και σε δωρεάν plan.

> **Προαιρετικό σκληρύνσιμο:** SSL/TLS → Edge Certificates → **Minimum TLS Version**
> → 1.2 (ισχύει για όλο το zone — site + media subdomain· κανένας σύγχρονος browser
> δεν υποστηρίζει πια 1.0/1.1, οπότε δεν χάνεται κανένας επισκέπτης). Το subdomain
> του R2 κληρονομεί αυτόματα τις ρυθμίσεις TLS του zone.

> Δεν χρειάζεται ρύθμιση CORS — ο player του site είναι σκέτο `<audio src>`, όχι
> fetch από JavaScript, οπότε αρχεία από άλλο domain παίζουν κανονικά.

### 4. Πρόσβαση του πελάτη (ποιος ανεβάζει το αρχείο στο R2)

**Σημαντικό:** το βήμα του CMS (γραμμή στο «Συνεντεύξεις (ήχος)» + επικόλληση URL)
δεν χρειάζεται καθόλου Cloudflare — ο πελάτης το κάνει μόνος του μέσω Pages CMS.
Το Cloudflare μπαίνει μόνο στο ανέβασμα του αρχείου, και εκεί έχουμε τρεις επιλογές:

| Επιλογή | Αυτονομία πελάτη | Ρίσκο | Κόστος |
| --- | --- | --- | --- |
| **A. Invite ως member (Administrator)** | Πλήρης | Πρόσβαση σε ΟΛΟ τον λογαριασμό (DNS, Pages — στον δωρεάν plan δεν υπάρχει role μόνο για R2· λεπτομερή roles μόνο σε Enterprise) | 2 λεπτά |
| **B. Ο πελάτης στέλνει το αρχείο στον dev** → ο dev το ανεβάζει στο R2 (~1 λεπτό), ο πελάτης καταχωρεί μόνος του το URL στο CMS | Μισή | Κανένα | Κανένα |
| **C. Σελίδα upload στο site** — Worker με R2 binding, πίσω από Cloudflare Access (email OTP) ή κωδικό· ο πελάτης κάνει drag & drop και το αρχείο πάει κατευθείαν στο bucket | Πλήρης, χωρίς καμία πρόσβαση λογαριασμού | Ελάχιστο (scoped μόνο στο bucket) | ~1-2 ώρες υλοποίηση |

**Σύσταση (τώρα ιστορικό):** ξεκινήσαμε με **B** και υλοποιήσαμε τη **Γ** —
σελίδα ανεβάσματος `/upload` (Pages Function), πίσω από Cloudflare Access.
Λεπτομέρειες και setup στο **Μέρος Ε**.
Αν ποτέ γίνει invite (Α), ο πελάτης παίρνει δικό του login + δικό του 2FA — ποτέ
κοινόχρηστα credentials — ώστε η πρόσβαση να ανακαλείται άμεσα.

---

## Μέρος Β — Η ροή του πελάτη (μετά τη μετοίκηση)

Δύο βήματα, ~2 λεπτά συνολικά:

1. **Ανέβασμα στο R2:** ο πελάτης ανοίγει το **apo-koinou.com/upload** (πίσω από
   Cloudflare Access), διαλέγει την παράσταση, σύρει το mp3 και πατά Ανέβασμα —
   το αρχείο καταλήγει στον φάκελο της παράστασης (π.χ. `rinokeros/`) με καθαρό
   όνομα (δες Μέρος Γ για το έτοιμο κείμενο προς αποστολή).
2. **Καταχώρηση στο Pages CMS:** ο πελάτης ανοίγει τη παράσταση στο CMS, προσθέτει
   γραμμή στο «Συνεντεύξεις (ήχος)» και **επικολλά το URL** — το CMS δεν ανεβάζει
   πλέον bytes, οπότε το 413 εξαφανίζεται.

> **Μελλοντικά αρχεία (π.χ. PDF):** η ίδια λογική ισχύει για οποιοδήποτε μεγάλο
> αρχείο — νέος φάκελος μέσα στο `apo-koinou-media`, ανέβασμα εκεί, επικόλληση URL
> στο αντίστοιχο πεδίο του CMS (το πεδίο των δημοσιευμάτων/dimosieumata γίνεται
> με τον ίδιο τρόπο σε επόμενο βήμα).

**Κανόνες ονομασίας αρχείων** (σημαντικά, για καθαρά URLs και καθαρό cache):

- Μικρά λατινικά γράμματα και παύλες: `radio-gamma-94fm-syneunteksi.mp3`
- **Όχι** κεφαλαία, κενά, ελληνικά χαρακτήρες, underlines
- Το URL προκύπτει μηχανικά:
  `https://media.apo-koinou.com/<φάκελος-παράστασης>/<όνομα-αρχείου>.mp3`
- **Αν αντικατασταθεί η ηχογράφηση με νέα έκδοση, νέο όνομα αρχείου** (π.χ.
  `...-v2.mp3`) — όχι επικάλυψη του ίδιου ονόματος, γιατί το edge cache του
  Cloudflare μπορεί να σερβίρει την παλιά έκδοση.

---

## Μέρος Γ — Οδηγίες για τον πελάτη (για αποστολή/ανάρτηση, έτοιμο κείμενο)

> ### Ανέβασμα αρχείου στο site (ήχος συνέντευξης ή άλλο μεγάλο αρχείο)
>
> **Βήμα 1 — Ανέβασμα του αρχείου (σελίδα «Ανέβασμα αρχείου»)**
>
> 1. Πήγαινε στη διεύθυνση **apo-koinou.com/upload** (κάνε την Αγαπημένη /
>    σελιδοδείκτη, τη βρίσκεις με ένα πάτημα).
> 2. Την **πρώτη φορά** θα σου ζητηθεί το email σου και ένας **κωδικός 6 ψηφίων**
>    που θα λάβεις με email — ακριβώς όπως μπαίνεις στο Pages CMS. Μετά μπαίνεις
>    αυτόματα και δεν ξαναζητείται για ώρα.
> 3. Διάλεξε την **παράσταση** από τη λίστα (αν δεν υπάρχει, διάλεξε «Άλλο» και
>    γράψε το slug της, π.χ. `neon-theama`).
> 4. **Σύρε το αρχείο mp3** μέσα στη σκιασμένη ζώνη (ή πάτα «πάτα για να το
>    διαλέξεις» και βρες το στον υπολογιστή σου).
> 5. Πάτα **Ανέβασμα** — η μπάρα προόδου δείχνει πόσο έχει ανέβει· περίμενε να
>    φτάσει στο 100%.
> 6. Μόλις εμφανιστεί το URL, πάτα **Αντιγραφή URL** (το κουμπί κάνει την
>    αντιγραφή για σένα).
>
> **Ονόματα αρχείων:** μόνο μικρά αγγλικά γράμματα, αριθμοί και παύλες (`-`), χωρίς
> κενά και χωρίς ελληνικούς χαρακτήρες, π.χ. `syneunteksi-radio-gamma.mp3`. Αν το
> όνομα δεν ακολουθεί τους κανόνες, η σελίδα σου λέει τι να διορθώσεις — μετονόμασε
> το αρχείο στον υπολογιστή σου (δεξί κλικ → Μετονομασία) και ξανασύρε το.
>
> **Βήμα 2 — Προσθήκη στη σελίδα της παράστασης (Pages CMS)**
>
> 1. Άνοιξε το [Pages CMS](https://pagescms.org) και το αποθετήριο του site.
> 2. Πήγαινε στη **παράσταση** → πεδίο **Συνεντεύξεις (ήχος)** → **Add**.
> 3. Στο **URL ήχου (από το R2)** επικόλλησε το URL από το Βήμα 1.
> 4. Συμπλήρωσε **Τίτλος** (π.χ. «Συνέντευξη Radio Gamma 94FM») και
>    **Ημερομηνία** (π.χ. «Νοέμβριος 2026»).
> 5. **Save** — σε λίγα λεπτά ο ήχος εμφανίζεται στη σελίδα της παράστασης.
>
> **Σημειώσεις**
>
> - Δεν χρειάζεται πια περικοπή/συμπίεση του ήχου — ανεβάζεις το αρχείο όπως είναι.
> - Αν αλλάξεις την ηχογράφηση αργότερα, ανέβασέ την με **νέο όνομα** (π.χ.
>   `...-v2.mp3`) και άλλαξε το URL στο CMS. Η σελίδα ανεβάσματος **δεν δέχεται το
>   ίδιο όνομα δύο φορές** — θα σου ζητήσει η ίδια νέο όνομα.

---

## Μέρος Δ — Αλλαγές στο repo (τι θα κάνω όταν το bucket είναι έτοιμο)

1. **`.pages.yml`** — το πεδίο παύει να είναι file upload και γίνεται κείμενο:

   ```yaml
   # ΠΡΙΝ
   - name: syneunteixeisAudio
     label: Συνεντεύξεις (ήχος)
     type: object
     description: Ηχογραφημένες συνεντεύξεις / ραδιοφωνικές εκπομπές. Ανεβάστε πρώτα το αρχείο στη βιβλιοθήκη «Ήχοι συνεντεύξεων», μέσα στον φάκελο της παράστασης.
     list:
       collapsible:
         collapsed: true
     fields:
       - name: audio
         label: Αρχείο ήχου
         type: file
         required: true
         options:
           media: syneunteixeis-media

   # ΜΕΤΑ
   - name: syneunteixeisAudio
     label: Συνεντεύξεις (ήχος)
     type: object
     description: Ηχογραφημένες συνεντεύξεις / ραδιοφωνικές εκπομπές. Ανεβάστε πρώτα το mp3 στο Cloudflare R2 (φάκελος της παράστασης) και επικολλήστε εδώ το URL του.
     list:
       collapsible:
         collapsed: true
     fields:
       - name: audio
         label: URL ήχου (από το R2)
         type: string
         required: true
         description: π.χ. https://media.apo-koinou.com/rinokeros/radio-gamma-94fm-syneunteksi.mp3
   ```

   (Θα ελέγξω αν η βιβλιοθήκη `syneunteixeis-media` χρησιμοποιείται από άλλα πεδία
   πριν τη διαγράψω από το `.pages.yml`.)

2. **Μετοίκηση των 5 υπαρχόντων ηχογραφήσεων** (ανέβασμα στο R2 με τους ίδιους
   φακέλους/ονόματα, ενημέρωση frontmatter):

   | Αρχείο στο repo | Νέο R2 key | Πεδίο σε |
   | --- | --- | --- |
   | `public/syneunteixeis/anoixta/maxfm-syneunteksi.mp3` (21.5 MB) | `anoixta/maxfm-syneunteksi.mp3` | `anoixta.md` |
   | `public/syneunteixeis/rinokeros/maxfm-syneunteksi-v3.mp3` (15.8 MB) | `rinokeros/maxfm-syneunteksi.mp3` (ανέβηκε χωρίς το `-v3` — φρέσκος bucket, καθαρό όνομα) | `rinokeros.md` |
   | `public/syneunteixeis/rinokeros/peloponnisos-fm-syneunteksi.mp3` (22.6 MB) | `rinokeros/peloponnisos-fm-syneunteksi.mp3` | `rinokeros.md` |
   | `public/syneunteixeis/rinokeros/radio-gamma-94fm-syneunteksi.mp3` (21.8 MB) | `rinokeros/radio-gamma-94fm-syneunteksi.mp3` | `rinokeros.md` |
   | `public/syneunteixeis/autoxeiras/radio-gamma-94fm-syneunteksi.mp3` (18.7 MB) | `autoxeiras/radio-gamma-94fm-syneunteksi.mp3` | `autoxeiras.md` |

   Κάθε τιμή `audio:` έγινε `https://media.apo-koinou.com/<key>`. Ο player
   (`InterviewAudio.astro`) δέχεται ήδη οποιοδήποτε URL — καμία αλλαγή κώδικα.

3. **Διαγραφή** του `public/syneunteixeis/` από το repo (τα αρχεία ζουν πια στο R2)
   και ενημέρωση του `odigies-cms.md` (η ενότητα «Συνεντεύξεις (ήχος)» περιγράφει
   τη νέα ροή).

4. `pnpm run format && pnpm run check && pnpm run build` → commit → push.

---

## Μέρος Ε — Σελίδα ανεβάσματος `/upload` (Pages Function)

Η «επιλογή Γ» του Μέρους Α.4, υλοποιημένη. Το `functions/upload.ts` είναι το **μοναδικό
δυναμικό endpoint** του site — όλα τα υπόλοιπα μένουν στατικά. Το static asset
προηγείται των functions στο routing, αλλά το `/upload` δεν έχει στατικό αντίστοιχο,
οπότε το κατέχει η function (και το `/upload/` κανονικοποιείται σε αυτό).

**Τι κάνει:**

- **GET** σερβίρει μια σελίδα στη γλώσσα του site (σκούρο zinc, πορτοκαλί έμφαση):
  λίστα παραστάσεων, ζώνη drag & drop, μπάρα προόδου (XHR) και, στην επιτυχία, το
  τελικό URL με κουμπί «Αντιγραφή» και την υπενθύμιση «Επικόλλησε αυτό το URL στο
  Pages CMS».
- **POST** δέχεται multipart `formData()` και γράφει το αρχείο στο bucket:
  - **Auth:** Cloudflare Access (email OTP) για το `/upload*` στο edge — η function
    ελέγχει μόνο την παρουσία του `Cf-Access-Jwt-Assertion` (το edge είναι το
    πραγματικό φίλτρο· βαθιά validated του JWT παραλείπεται συνειδητά). Fallback:
    αν υπάρχει το env var `UPLOAD_PASSWORD`, δέχεται `Authorization: Bearer <κωδικός>`
    (χρήσιμο για δοκιμές εκτός Access — η σελίδα έχει και προαιρετικό πεδίο «Κωδικός»).
  - **Επικύρωση:** μόνο `.mp3` / `.pdf`, έως **99 MB** (δωρεάν plan body cap), όνομα
    μόνο με μικρά λατινικά, αριθμούς και παύλες (κενά/underlines → παύλες, ελληνικά →
    **απόρριψη**, όχι μεταγραμματισμός), φάκελος αυστηρά slug-pattern (όχι traversal).
  - **Cache rule:** `BUCKET.head(key)` πριν το put — αν το key υπάρχει, **409** με
    ελληνικό μήνυμα «μετονόμασε σε …-v2». Ποτέ επικάλυψη επί του same ονόματος.
  - Επιστρέφει JSON `{ url, key }` με το δημόσιο URL `https://media.apo-koinou.com/<key>`.

**Setup στο dashboard (μία φορά, το κάνεις εσύ):**

1. **R2 binding:** Pages project → Settings → Functions → **R2 bindings** → Add:
   Variable name `BUCKET`, bucket `apo-koinou-media`. (Χωρίς αυτό, το POST απαντά 500
   με μήνυμα ότι λείπει το binding.)
2. **Cloudflare Access:** Zero Trust → **Access → Applications → Add an application →
   Self-hosted**: Application domain `apo-koinou.com`, path `upload*`. Policy «Allow»,
   action **Login methods → Email One-Time Password**, Include το email του Φώτη
   (και το δικό σου). Από τη στιγμή που γίνει αυτό, το `/upload` ζητά email-OTP πριν
   εμφανίσει τη φόρμα.
3. *(Προαιρετικά)* **UPLOAD_PASSWORD:** Pages → Settings → Environment variables →
   `UPLOAD_PASSWORD` (production) — μόνο για δοκιμές με curl εκτός Access. Αν δεν
   το ορίσεις ποτέ, απλώς μένει η προστασία του Access.

**Συντήρηση:** η λίστα φακέλων στο select είναι **hardcode** στον πίνακα
`PLAY_FOLDERS` (`functions/upload.ts`) — το static build δεν μπορεί να διαβάσει τα
content collections σε request time. Νέα παράσταση = μία γραμμή στον πίνακα (ή,
προσωρινά, η επιλογή «Άλλο (νέος φάκελος)» της σελίδας, που δέχεται οποιοδήποτε
slug — επικυρώνεται εξίσου server-side).

**Τοπική δοκιμή** (miniflare R2 simulation, χωρίς Cloudflare login):

```sh
pnpm run build
pnpm dlx wrangler pages dev dist --r2 BUCKET --binding UPLOAD_PASSWORD=devpass
# → http://localhost:8788/upload  (login με κωδικό devpass στο πεδίο «Κωδικός»)
```

Δοκιμασμένο τοπικά: 401 χωρίς/με λάθος κωδικό, 400 σε ελληνικό όνομα (χωρίς
μεταγραμματισμό), 400 σε traversal folder/λάθος επέκταση/χωρίς αρχείο, **409 σε
διπλότυπο** (με πρόταση -v2), **413 πάνω από 99 MB**, 200 με καθαρισμένο όνομα
(`Radio Gamma 94FM_Syneunteksi v2.MP3` → `radio-gamma-94fm-syneunteksi-v2.mp3`).
*(Σημείωση: το τοπικό `wrangler pages dev` δεν αναγνωρίζει named `GET`/`POST`
exports στο route discovery — γι' αυτό το αρχείο εξάγει `onRequestGet`/
`onRequestPost`, που υποστηρίζονται κανονικά και στην παραγωγή.)*

Στην παραγωγή, μετά τα bindings: δοκίμασε ένα πραγματικό ανέβασμα και επιβεβαίωσε
ότι το URL παίζει (π.χ. `curl -I https://media.apo-koinou.com/<φάκελος>/<αρχείο>`
→ 200, `content-type: audio/mpeg`).

---

## Checklist συνόψισης

- [x] Ενεργοποίηση R2 (+ κάρτα) — Μέρος Α.1
- [x] Bucket `apo-koinou-media` — Μέρος Α.2
- [x] Custom domain `media.apo-koinou.com` + δοκιμή — Μέρος Α.3
- [x] Πρόσβαση πελάτη — Μέρος Α.4 (επιλογή Γ: σελίδα `/upload` πίσω από Access)
- [x] Repo αλλαγές (.pages.yml, 5 URLs, διαγραφή public/syneunteixeis, odigies-cms.md) — Μέρος Δ
- [x] Σελίδα ανεβάσματος `/upload` (functions/upload.ts) + τοπικές δοκιμές — Μέρος Ε
- [ ] R2 binding `BUCKET` = apo-koinou-media στο Pages project — Μέρος Ε
- [ ] Cloudflare Access app για `apo-koinou.com/upload*` (email OTP) — Μέρος Ε
- [ ] End-to-end δοκιμή ανεβάσματος στην παραγωγή — Μέρος Ε
- [ ] Αποστολή του «Μέρους Γ» στον πελάτη
