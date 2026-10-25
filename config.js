/* =====================================================================
   NoForm Project – beállítások
   ---------------------------------------------------------------------
   Itt tudod átírni a csomagokat, az árakat és az elérhetőségeket.
   Programozói tudás nem kell hozzá, csak figyelj pár dologra:

   - Az árakat SZÁMKÉNT írd be, szóköz és "Ft" nélkül:  price: 150000
   - Ha egy ár még nincs meg, hagyd így:                 price: null
     (ilyenkor az oldalon "[IDE JÖN: ár]" helyőrző jelenik meg)
   - A szövegeket idézőjelek közé írd, a sor végén maradjon ott a vessző.
   - Mentés után frissítsd az oldalt, és már látszik is a változás.
   ===================================================================== */

window.NOFORM_CONFIG = {

  /* --- Elérhetőségek ------------------------------------------------ */
  contact: {
    email: 'design@noformproject.com',
    phone: '+36 30 269 9908',        // így jelenik meg az oldalon
    phoneHref: '+36302699908',       // ezt hívja a telefon (szóközök nélkül)
    area: 'Pomáz és környéke (Szentendre, Pilis, Dunakanyar), Szeged, online bárhol'
  },

  /* --- Impresszum (lábléc) ------------------------------------------ */
  company: {
    name: null,            // pl. 'Minta Kft.'
    seat: null,            // székhely
    taxNumber: null,       // adószám
    registryNumber: null   // cégjegyzékszám
  },

  /* --- Pénznem ------------------------------------------------------ */
  currency: 'Ft',

  /* Az árak közepes piaci becslések (2026), bármikor átírhatók. */

  /* --- Csomagok -----------------------------------------------------
     id:        belső azonosító, ne változtasd meg (az űrlap is ezt használja)
     name:      a csomag neve
     price:     a kiírt ár (a kártyán ez látszik)
     priceMax:  a becsült ár felső határa az árajánlatkérőben
                (ha null, a "price" számít felső határnak is)
     from:      true = "...-tól" ár (pl. az Egyedi csomagnál)
     featured:  true = ez a kiemelt csomag (csak egynél legyen true)
     badge:     kis matrica a kártyán (vagy null)
     lead:      egy mondat a csomagról
     features:  mi van benne (felsorolás)
  ------------------------------------------------------------------- */
  packages: [
    {
      id: 'egyoldalas',
      name: 'Egyoldalas',
      price: 150000,
      priceMax: 200000,
      from: false,
      featured: false,
      badge: null,
      lead: 'Egy oldal, ami mindent elmond.',
      features: [
        'Bemutatkozás',
        'Kínálat',
        'Nyitvatartás',
        'Térkép',
        'Elérhetőség',
        'Telefonon is tökéletes'
      ]
    },
    {
      id: 'szerkesztheto',
      name: 'Egyoldalas + szerkesztés',
      price: 250000,
      priceMax: 320000,
      from: false,
      featured: true,
      badge: 'Ezt ajánljuk',
      lead: 'Ugyanaz az egy oldal, de te magad is átírhatod.',
      features: [
        'Minden, ami az Egyoldalasban',
        'Egyszerű admin felület',
        'Szövegek, árak, nyitvatartás, képek átírása',
        'Programozói tudás nélkül'
      ]
    },
    {
      id: 'egyedi',
      name: 'Egyedi',
      price: 350000,     // a "-tól" ár
      priceMax: 700000,  // becsléshez: a szokásos felső határ
      from: true,
      featured: false,
      badge: null,
      lead: 'Több oldal, és amit még kérsz.',
      features: [
        'Több aloldal',
        'Foglalási naptár',
        'Étlap',
        'Eseménynaptár',
        'Amit kérsz'
      ]
    }
  ],

  /* --- Havi díj (a csomagok alatt) ---------------------------------- */
  monthly: {
    label: 'Domain és tárhely ügyintézése, havi karbantartás',
    price: 6000          // Ft/hó
  },

  /* --- Extrák az árajánlatkérő 3. lépésében -------------------------
     min / max:   ennyivel nő a becsült ár, ha bejelölik
     includedIn:  ezekben a csomagokban már benne van (nem számoljuk újra)
  ------------------------------------------------------------------- */
  extras: [
    { id: 'foglalas',   label: 'Foglalási naptár',   min: 40000, max: 80000, includedIn: ['egyedi'] },
    { id: 'etlap',      label: 'Étlap',              min: 20000, max: 40000, includedIn: ['egyedi'] },
    { id: 'galeria',    label: 'Galéria',            min: 15000, max: 30000, includedIn: [] },
    { id: 'esemeny',    label: 'Eseménynaptár',      min: 30000, max: 60000, includedIn: ['egyedi'] },
    { id: 'nyelvek',    label: 'Többnyelvűség',      min: 40000, max: 80000, includedIn: [] },
    { id: 'admin',      label: 'Admin felület',      min: 60000, max: 100000, includedIn: ['szerkesztheto'] },
    { id: 'domain',     label: 'Domain-ügyintézés',  min: 5000, max: 10000, includedIn: [] }
  ],

  /* --- Becsült ár kerekítése (Ft) ----------------------------------- */
  estimateRounding: 5000
};
