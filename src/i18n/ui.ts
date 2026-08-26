// Central UI string dictionary. Single source of truth for every
// locale-dependent string in the chrome (nav, footer, page titles, labels,
// empty states). Page content lives in content collections; this file
// only covers shared UI strings.
//
// Add locales here and in astro.config.mjs `i18n.locales`.

export const locales = ['el', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'el';

// English fallback: defaultLocale strings are used when a key is missing.
export const ui = {
  el: {
    'site.title': 'Από Κοινού',
    'site.tagline': 'Θεατρική ομάδα της Α΄ ΕΛΜΕ Αχαΐας',
    'site.description':
      'Ψηφιακό αρχείο της θεατρικής ομάδας «Από Κοινού». Παραστάσεις, βίντεο, φωτογραφία, πρόγραμμα, ιστορία και τρόποι επικοινωνίας.',

    'nav.home': 'Αρχική',
    'nav.parastaseis': 'Παραστάσεις',
    'nav.nea': 'Νέα',
    'nav.programma': 'Πρόγραμμα',
    'nav.syllogi': 'Συλλογή',
    'nav.istoria': 'Ιστορία',
    'nav.epikoinonia': 'Επικοινωνία',
    'nav.main_aria': 'Κύρια πλοήγηση',

    'common.open_menu': 'Άνοιγμα μενού',
    'common.close_menu': 'Κλείσιμο μενού',
    'common.back_home': 'Επιστροφή στην αρχική',
    'common.photo': 'φωτογραφία',
    'common.skip_to_content': 'Παράλειψη στο περιεχόμενο',

    'footer.nav_aria': 'Υποσέλιδο',
    'footer.rights': 'Με επιφύλαξη κάθε δικαιώματος.',

    'page.home.title': 'Από Κοινού',
    'page.home.eyebrow': 'Θεατρική ομάδα',
    'page.home.heading': 'Ψηφιακό αρχείο της θεατρικής ομάδας «Από Κοινού».',
    'page.home.body':
      'Παραστάσεις, βίντεο, φωτογραφία, πρόγραμμα, ιστορία και τρόποι επικοινωνίας.',

    'home.hero.alt': 'Σκηνή θεάτρου φωτισμένη μόνο από κεριά στο σκοτάδι.',
    'home.featured.eyebrow': 'Από το αρχείο',
    'home.featured.heading': 'Πρόσφατες παραστάσεις',
    'home.featured.all': 'Όλες οι παραστάσεις',
    'home.news.all': 'Όλα τα νέα',
    'home.program.cta': 'Δείτε το πρόγραμμα',

    'page.parastaseis.title': 'Παραστάσεις',
    'page.parastaseis.eyebrow': 'Αρχείο',
    'page.nea.title': 'Νέα',
    'page.nea.eyebrow': 'Ανακοινώσεις',
    'page.syllogi.title': 'Συλλογή',
    'page.syllogi.eyebrow': 'Αρχείο',
    'page.syllogi.heading': 'Συλλογή παραγωγών',
    'page.programma.title': 'Πρόγραμμα',
    'page.programma.eyebrow': 'Τρέχων περίοδος',
    'page.programma.heading': 'Πρόγραμμα {season}',
    'page.programma.soon':
      'Λεπτομέρειες για εισιτήρια και χώρους θα ανακοινωθούν σύντομα.',
    'page.istoria.title': 'Ιστορία',
    'page.istoria.eyebrow': 'Η ομάδα',
    'page.istoria.heading': 'Η ιστορία μας',
    'page.istoria.intro':
      'Από το 2015 μέχρι σήμερα — πώς γεννήθηκε η ομάδα, πώς λειτουργεί και τι έχει ανεβάσει.',
    'page.istoria.image_alt': 'Το σύνολο της θεατρικής ομάδας «Από Κοινού» στη σκηνή.',
    'page.istoria.caption': 'Το σύνολο της ομάδας στη σκηνή.',
    'page.istoria.toc': 'Σε αυτή τη σελίδα',
    'page.istoria.empty': 'Δεν υπάρχουν καταχωρημένα ορόσημα.',
    'page.epikoinonia.title': 'Επικοινωνία',
    'page.epikoinonia.eyebrow': 'Επικοινωνία',
    'page.epikoinonia.heading': 'Επικοινωνήστε μαζί μας',
    'page.epikoinonia.body':
      'Για πληροφορίες και συνεργασίες επικοινωνήστε μέσω email.',

    'empty.parastaseis': 'Δεν υπάρχουν καταχωρημένες παραστάσεις.',
    'empty.nea': 'Δεν υπάρχουν ανακοινώσεις.',
    'empty.syllogi': 'Δεν υπάρχουν διαθέσιμα πολυμέσα.',

    'filter.aria': 'Φιλτράρισμα παραστάσεων',
    'filter.search': 'Αναζήτηση',
    'filter.search_placeholder': 'Τίτλος, συγγραφέας ή σύνοψη…',
    'filter.year': 'Χρονιά',
    'filter.year_all': 'Όλες οι χρονιές',
    'filter.writer': 'Συγγραφέας',
    'filter.writer_all': 'Όλοι οι συγγραφείς',
    'filter.sort': 'Ταξινόμηση',
    'filter.sort_newest': 'Νεότερες πρώτες',
    'filter.sort_oldest': 'Παλαιότερες πρώτες',
    'filter.sort_title': 'Αλφαβητικά',
    'filter.clear': 'Καθαρισμός φίλτρων',
    'filter.results_one': '1 παράσταση',
    'filter.results_many': '{count} παραστάσεις',
    'filter.empty': 'Καμία παράσταση δεν ταιριάζει στα επιλεγμένα φίλτρα.',

    'prod.premiere': 'Πρεμιέρα',
    'prod.director': 'Σκηνοθεσία',
    'prod.writer': 'Συγγραφέας',
    'prod.duration': 'Διάρκεια',
    'prod.genre': 'Είδος',
    'prod.language': 'Γλώσσα',
    'prod.stream_section': 'Παράσταση',
    'prod.trailer_section': 'Τρέιλερ',
    'prod.cast_section': 'Συμμετέχουν',
    'prod.crew_section': 'Συντελεστές',
    'prod.gallery_section': 'Φωτογραφίες',
    'prod.stream_default': 'Παράσταση',

    'prod.watch_now': 'Παρακολουθήστε τώρα',
    'prod.yliko': 'Υλικό',
    'prod.section.play': 'Θεατρικό έργο',
    'prod.section.cast': 'Διανομή',
    'prod.section.place_time': 'Τόπος & Χρόνος',
    'prod.program': 'Πρόγραμμα',
    'prod.invitation': 'Πρόσκληση',
    'prod.poster': 'Αφίσα',
    'prod.reviews': 'Κριτικές',
    'prod.back_to_play': 'Πίσω στην παράσταση',
    'prod.field.title': 'Τίτλος',
    'prod.field.summary': 'Σύνοψη',
    'prod.field.date': 'Ημερομηνία',
    'prod.field.venue': 'Χώρος',

    'page.404.code': '404',
    'page.404.heading': 'Η σελίδα δεν βρέθηκε',
    'page.404.body':
      'Η σελίδα που ζητήσατε δεν υπάρχει ή έχει μετακινηθεί.',
    'page.404.title': 'Σελίδα δεν βρέθηκε',
  },
  en: {
    'site.title': 'Από Κοινού',
    'site.tagline': 'Theater group of Α΄ ΕΛΜΕ Αχαΐας',
    'site.description':
      'Digital archive of the «Από Κοινού» theater group. Productions, video, photography, programme, history, and contact.',

    'nav.home': 'Home',
    'nav.parastaseis': 'Productions',
    'nav.nea': 'News',
    'nav.programma': 'Programme',
    'nav.syllogi': 'Archive',
    'nav.istoria': 'History',
    'nav.epikoinonia': 'Contact',
    'nav.main_aria': 'Main navigation',

    'common.open_menu': 'Open menu',
    'common.close_menu': 'Close menu',
    'common.back_home': 'Back to home',
    'common.photo': 'photo',
    'common.skip_to_content': 'Skip to content',

    'footer.nav_aria': 'Footer',
    'footer.rights': 'All rights reserved.',

    'page.home.title': 'Από Κοινού',
    'page.home.eyebrow': 'Theater group',
    'page.home.heading': 'Digital archive of the «Από Κοινού» theater group.',
    'page.home.body':
      'Productions, video, photography, programme, history, and ways to reach us.',

    'home.hero.alt': 'A theater stage lit only by candles in the dark.',
    'home.featured.eyebrow': 'From the archive',
    'home.featured.heading': 'Recent productions',
    'home.featured.all': 'All productions',
    'home.news.all': 'All news',
    'home.program.cta': 'View the programme',

    'page.parastaseis.title': 'Productions',
    'page.parastaseis.eyebrow': 'Archive',
    'page.nea.title': 'News',
    'page.nea.eyebrow': 'Announcements',
    'page.syllogi.title': 'Archive',
    'page.syllogi.eyebrow': 'Archive',
    'page.syllogi.heading': 'Productions archive',
    'page.programma.title': 'Programme',
    'page.programma.eyebrow': 'Current season',
    'page.programma.heading': 'Programme {season}',
    'page.programma.soon':
      'Details about tickets and venues will be announced soon.',
    'page.istoria.title': 'History',
    'page.istoria.eyebrow': 'The group',
    'page.istoria.heading': 'Our story',
    'page.istoria.intro':
      'From 2015 to today — how the group was born, how it works, and what it has staged.',
    'page.istoria.image_alt': 'The full «Από Κοινού» theater company on stage.',
    'page.istoria.caption': 'The full company on stage.',
    'page.istoria.toc': 'On this page',
    'page.istoria.empty': 'No milestones recorded yet.',
    'page.epikoinonia.title': 'Contact',
    'page.epikoinonia.eyebrow': 'Contact',
    'page.epikoinonia.heading': 'Get in touch',
    'page.epikoinonia.body':
      'For information and collaborations contact us by email.',

    'empty.parastaseis': 'No productions listed yet.',
    'empty.nea': 'No announcements yet.',
    'empty.syllogi': 'No media available yet.',

    'filter.aria': 'Filter productions',
    'filter.search': 'Search',
    'filter.search_placeholder': 'Title, writer, or synopsis…',
    'filter.year': 'Year',
    'filter.year_all': 'All years',
    'filter.writer': 'Writer',
    'filter.writer_all': 'All writers',
    'filter.sort': 'Sort by',
    'filter.sort_newest': 'Newest first',
    'filter.sort_oldest': 'Oldest first',
    'filter.sort_title': 'Alphabetical',
    'filter.clear': 'Clear filters',
    'filter.results_one': '1 production',
    'filter.results_many': '{count} productions',
    'filter.empty': 'No productions match the selected filters.',

    'prod.premiere': 'Premiere',
    'prod.director': 'Direction',
    'prod.writer': 'Writer',
    'prod.duration': 'Duration',
    'prod.genre': 'Genre',
    'prod.language': 'Language',
    'prod.stream_section': 'Performance',
    'prod.trailer_section': 'Trailer',
    'prod.cast_section': 'Cast',
    'prod.crew_section': 'Crew',
    'prod.gallery_section': 'Photos',
    'prod.stream_default': 'Performance',

    'prod.watch_now': 'Watch now',
    'prod.yliko': 'Material',
    'prod.section.play': 'The play',
    'prod.section.cast': 'Cast',
    'prod.section.place_time': 'Place & time',
    'prod.program': 'Programme',
    'prod.invitation': 'Invitation',
    'prod.poster': 'Poster',
    'prod.reviews': 'Reviews',
    'prod.back_to_play': 'Back to the play',
    'prod.field.title': 'Title',
    'prod.field.summary': 'Synopsis',
    'prod.field.date': 'Date',
    'prod.field.venue': 'Venue',

    'page.404.code': '404',
    'page.404.heading': 'This page was not found',
    'page.404.body':
      'The page you requested does not exist or has moved.',
    'page.404.title': 'Page not found',
  },
} as const;

export type UIKey = keyof (typeof ui)[Locale];