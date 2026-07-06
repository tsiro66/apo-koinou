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
    'site.tagline': 'Θεατρική ομάδα της ελληνικής παροικίας',
    'site.description':
      'Ψηφιακό αρχείο της θεατρικής ομάδας «Από Κοινού». Παραστάσεις, βίντεο, φωτογραφία, πρόγραμμα, ιστορία και τρόποι επικοινωνίας.',

    'nav.home': 'Αρχική',
    'nav.parastaseis': 'Παραστάσεις',
    'nav.nea': 'Νέα',
    'nav.programma': 'Πρόγραμμα',
    'nav.synteleistes': 'Συντελεστές',
    'nav.syllogi': 'Συλλογή',
    'nav.istoria': 'Ιστορία',
    'nav.epikoinonia': 'Επικοινωνία',

    'common.open_menu': 'Άνοιγμα μενού',
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

    'page.parastaseis.title': 'Παραστάσεις',
    'page.parastaseis.eyebrow': 'Αρχείο',
    'page.nea.title': 'Νέα',
    'page.nea.eyebrow': 'Ανακοινώσεις',
    'page.synteleistes.title': 'Συντελεστές',
    'page.synteleistes.eyebrow': 'Ομάδα',
    'page.syllogi.title': 'Συλλογή',
    'page.syllogi.eyebrow': 'Αρχείο',
    'page.syllogi.heading': 'Συλλογή παραγωγών',
    'page.programma.title': 'Πρόγραμμα',
    'page.programma.eyebrow': 'Τρέχων περίοδος',
    'page.programma.heading': 'Πρόγραμμα {season}',
    'page.programma.soon':
      'Λεπτομέρειες για εισιτήρια και χώρους θα ανακοινωθούν σύντομα.',
    'page.istoria.title': 'Ιστορία',
    'page.istoria.eyebrow': 'Χρονικό',
    'page.istoria.heading': 'Η ιστορία μας',
    'page.istoria.intro':
      'Η πορεία της θεατρικής ομάδας «Από Κοινού» μέσα στον χρόνο.',
    'page.istoria.empty': 'Δεν υπάρχουν καταχωρημένα ορόσημα.',
    'page.epikoinonia.title': 'Επικοινωνία',
    'page.epikoinonia.eyebrow': 'Επικοινωνία',
    'page.epikoinonia.heading': 'Επικοινωνήστε μαζί μας',
    'page.epikoinonia.body':
      'Για πληροφορίες, συνεργασίες και προσκλήσεις σε παραστάσεις, επικοινωνήστε μέσω email.',

    'empty.parastaseis': 'Δεν υπάρχουν καταχωρημένες παραστάσεις.',
    'empty.nea': 'Δεν υπάρχουν ανακοινώσεις.',
    'empty.synteleistes': 'Δεν υπάρχουν καταχωρημένοι συντελεστές.',
    'empty.syllogi': 'Δεν υπάρχουν διαθέσιμα πολυμέσα.',

    'prod.premiere': 'Πρεμιέρα',
    'prod.director': 'Σκηνοθεσία',
    'prod.writer': 'Συγγραφέας',
    'prod.duration': 'Διάρκεια',
    'prod.genre': 'Είδος',
    'prod.language': 'Γλώσσα',
    'prod.stream_section': 'Παράσταση',
    'prod.trailer_section': 'Trailer',
    'prod.cast_section': 'Συμμετέχουν',
    'prod.crew_section': 'Συντελεστές',
    'prod.gallery_section': 'Φωτογραφίες',
    'prod.stream_default': 'Παράσταση',

    'page.404.code': '404',
    'page.404.heading': 'Η σελίδα δεν βρέθηκε',
    'page.404.body':
      'Η σελίδα που ζητήσατε δεν υπάρχει ή έχει μετακινηθεί.',
    'page.404.title': 'Σελίδα δεν βρέθηκε',
  },
  en: {
    'site.title': 'Από Κοινού',
    'site.tagline': 'Greek community theater group',
    'site.description':
      'Digital archive of the «Από Κοινού» theater group. Productions, video, photography, programme, history, and contact.',

    'nav.home': 'Home',
    'nav.parastaseis': 'Productions',
    'nav.nea': 'News',
    'nav.programma': 'Programme',
    'nav.synteleistes': 'Contributors',
    'nav.syllogi': 'Archive',
    'nav.istoria': 'History',
    'nav.epikoinonia': 'Contact',

    'common.open_menu': 'Open menu',
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

    'page.parastaseis.title': 'Productions',
    'page.parastaseis.eyebrow': 'Archive',
    'page.nea.title': 'News',
    'page.nea.eyebrow': 'Announcements',
    'page.synteleistes.title': 'Contributors',
    'page.synteleistes.eyebrow': 'The group',
    'page.syllogi.title': 'Archive',
    'page.syllogi.eyebrow': 'Archive',
    'page.syllogi.heading': 'Productions archive',
    'page.programma.title': 'Programme',
    'page.programma.eyebrow': 'Current season',
    'page.programma.heading': 'Programme {season}',
    'page.programma.soon':
      'Details about tickets and venues will be announced soon.',
    'page.istoria.title': 'History',
    'page.istoria.eyebrow': 'Timeline',
    'page.istoria.heading': 'Our story',
    'page.istoria.intro':
      'The journey of the «Από Κοινού» theater group over time.',
    'page.istoria.empty': 'No milestones recorded yet.',
    'page.epikoinonia.title': 'Contact',
    'page.epikoinonia.eyebrow': 'Contact',
    'page.epikoinonia.heading': 'Get in touch',
    'page.epikoinonia.body':
      'For information, collaborations, and performance invitations, contact us by email.',

    'empty.parastaseis': 'No productions listed yet.',
    'empty.nea': 'No announcements yet.',
    'empty.synteleistes': 'No contributors listed yet.',
    'empty.syllogi': 'No media available yet.',

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

    'page.404.code': '404',
    'page.404.heading': 'This page was not found',
    'page.404.body':
      'The page you requested does not exist or has moved.',
    'page.404.title': 'Page not found',
  },
} as const;

export type UIKey = keyof (typeof ui)[Locale];