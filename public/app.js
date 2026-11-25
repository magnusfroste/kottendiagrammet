/* Kotten och diagrammet – läsa enkla tabeller och diagram.
   Statisk app, inga beroenden. Tränar MA.1-3.4.2 (enkla tabeller och diagram).
   Frågan skrivs OCH läses upp på svenska; barnet svarar med en av tre sifferknappar.
   Allt ritas i kod: staplar, bildrader, tabell och Kotten i SVG, ljud i WebAudio
   och talsyntes. Uppgiftsgeneratorn nedan är en ren funktion som verify.mjs kör. */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. Ren uppgiftsgenerator                                            *
   *    Varje uppgift bär sin egen data (diagrammet/tabellen) och svaret  *
   *    räknas fram ur datan – verify.mjs räknar om allt och jämför.      *
   * ------------------------------------------------------------------ */
  var TALORD = ["noll", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta",
    "nio", "tio", "elva", "tolv", "tretton", "fjorton", "femton", "sexton"];

  var SLAG = {
    not: { namn: "nöt", plural: "nötter", färg: "#c98a4b" },
    svamp: { namn: "svamp", plural: "svampar", färg: "#c9503f" },
    lov: { namn: "löv", plural: "löv", färg: "#2f7d5a" },
    kotte: { namn: "kotte", plural: "kottar", färg: "#8a5f36" }
  };
  var NYCKLAR = ["not", "svamp", "lov", "kotte"];
  var DAGAR = ["måndag", "tisdag", "onsdag", "torsdag"];

  function heltal(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function blanda(a) {
    var i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function slumpa(lista) { return lista[heltal(0, lista.length - 1)]; }

  /* Tre sifferknappar: rätt svar plus två som ligger nära eller är en
     "frestelse" (t.ex. en av staplarna i stället för skillnaden). Aldrig
     samma tal två gånger, aldrig utanför 0–16. */
  function knappar(ratt, frestelser) {
    var ut = [ratt], kandidat = blanda((frestelser || []).concat([ratt + 1, ratt - 1, ratt + 2]));
    kandidat.forEach(function (v) {
      if (ut.length < 3 && v !== ratt && v >= 0 && v <= 16 && ut.indexOf(v) < 0) ut.push(v);
    });
    var extra = 0;
    while (ut.length < 3) { extra++; if (ut.indexOf(ratt + extra) < 0) ut.push(ratt + extra); }
    return blanda(ut);
  }

  function uppgift(niva) {
    niva = niva === 2 || niva === 3 ? niva : 1;
    var p, i, par, a, b;

    /* ---- Nivå 1: bilddiagram, räkna en rad ---- */
    if (niva === 1) {
      var unika = blanda(NYCKLAR.slice()).slice(0, 3);
      var rader = unika.map(function (k) { return { slag: k, antal: heltal(1, 5) }; });
      var fraga = slumpa(rader);
      var ratt1 = fraga.antal;
      var alt1 = knappar(ratt1, rader.filter(function (r) { return r !== fraga; }).map(function (r) { return r.antal; }));
      return {
        niva: 1, typ: "rakna", rader: rader, fraga: fraga,
        fragaText: "Hur många " + SLAG[fraga.slag].plural + " har Kotten?",
        text: ratt1 + " " + SLAG[fraga.slag].plural + ". Bra räknat!",
        ratt: ratt1, alternativ: alt1, svar: alt1.indexOf(ratt1)
      };
    }

    /* ---- Nivå 2: stapeldiagram med siffror på axeln ---- */
    if (niva === 2) {
      var slag2 = blanda(NYCKLAR.slice()).slice(0, 3);
      var staplar = slag2.map(function (k) { return { slag: k, antal: heltal(1, 8) }; });
      var typ2 = Math.random() < 0.5 ? "fler" : "sammanlagt";
      if (typ2 === "fler") {
        /* två staplar där den ena är större; skillnaden är svaret */
        staplar.sort(function (x, y) { return y.antal - x.antal; });
        var hog = staplar[0], lag = staplar[1 + heltal(0, 1)];
        if (lag.antal >= hog.antal) lag.antal = hog.antal - 1;
        if (lag.antal < 1) { lag.antal = 1; hog.antal = heltal(2, 8); }
        var ratt2 = hog.antal - lag.antal;
        var alt2 = knappar(ratt2, [hog.antal, lag.antal, hog.antal + lag.antal]);
        return {
          niva: 2, typ: "fler", staplar: staplar, hog: hog.slag, lag: lag.slag,
          fragaText: "Hur många fler " + SLAG[hog.slag].plural + " än " + SLAG[lag.slag].plural + "?",
          text: TALORD[ratt2].charAt(0).toUpperCase() + TALORD[ratt2].slice(1) + " fler. " +
            hog.antal + " " + SLAG[hog.slag].plural + " och " + lag.antal + " " + SLAG[lag.slag].plural + ".",
          ratt: ratt2,
          alternativ: alt2,
          svar: alt2.indexOf(ratt2)
        };
      }
      par = blanda(staplar.slice()).slice(0, 2);
      var ratt3 = par[0].antal + par[1].antal;
      var alt3 = knappar(ratt3, [par[0].antal, par[1].antal, Math.abs(par[0].antal - par[1].antal)]);
      return {
        niva: 2, typ: "sammanlagt", staplar: staplar, par: [par[0].slag, par[1].slag],
        fragaText: "Hur många " + SLAG[par[0].slag].plural + " och " + SLAG[par[1].slag].plural +
          " sammanlagt?",
        text: par[0].antal + " och " + par[1].antal + " är " + ratt3 + " sammanlagt.",
        ratt: ratt3, alternativ: alt3, svar: alt3.indexOf(ratt3)
      };
    }

    /* ---- Nivå 3: tabell med två rader och fyra dagar ---- */
    var tabell = { nötter: [], kottar: [] };
    for (i = 0; i < 4; i++) { tabell.nötter.push(heltal(1, 8)); tabell.kottar.push(heltal(1, 8)); }
    var typ3 = slumpa(["cell", "summa", "skillnad"]);
    if (typ3 === "cell") {
      var rad = slumpa(["nötter", "kottar"]);
      var dag = heltal(0, 3);
      var ratt4 = tabell[rad][dag];
      var alt4 = knappar(ratt4, [tabell[rad][(dag + 1) % 4], tabell[rad === "nötter" ? "kottar" : "nötter"][dag]]);
      return {
        niva: 3, typ: "cell", tabell: tabell, rad: rad, dagar: [dag],
        fragaText: "Hur många " + (rad === "nötter" ? "nötter" : "kottar") + " samlade Kotten på " + DAGAR[dag] + "?",
        text: ratt4 + " " + (rad === "nötter" ? "nötter" : "kottar") + " på " + DAGAR[dag] + ".",
        ratt: ratt4, alternativ: alt4, svar: alt4.indexOf(ratt4)
      };
    }
    if (typ3 === "summa") {
      var d1 = heltal(0, 2), d2;
      do { d2 = heltal(d1 + 1, 3); } while (d2 === d1);
      var ratt5 = tabell.nötter[d1] + tabell.nötter[d2];
      var alt5 = knappar(ratt5, [tabell.nötter[d1], tabell.nötter[d2], Math.abs(tabell.nötter[d1] - tabell.nötter[d2])]);
      return {
        niva: 3, typ: "summa", tabell: tabell, rad: "nötter", dagar: [d1, d2],
        fragaText: "Hur många nötter på " + DAGAR[d1] + " och " + DAGAR[d2] + " sammanlagt?",
        text: tabell.nötter[d1] + " och " + tabell.nötter[d2] + " är " + ratt5 + " nötter sammanlagt.",
        ratt: ratt5, alternativ: alt5, svar: alt5.indexOf(ratt5)
      };
    }
    var ds = heltal(0, 3);
    a = tabell.nötter[ds]; b = tabell.kottar[ds];
    if (a === b) {
      /* två lika höga värden gör skillnaden noll – flytta den ena raden */
      tabell.nötter[ds] = b <= 5 ? b + heltal(1, 4) : b - heltal(1, 4);
      a = tabell.nötter[ds];
    }
    var ratt6 = Math.abs(a - b);
    var alt6 = knappar(ratt6, [a, b, a + b]);
    return {
      niva: 3, typ: "skillnad", tabell: tabell, rad: "nötter", dagar: [ds],
      fragaText: "Hur många fler " + (a > b ? "nötter än kottar" : "kottar än nötter") + " på " + DAGAR[ds] + "?",
      text: ratt6 + " fler. " + Math.max(a, b) + " och " + Math.min(a, b) + " på " + DAGAR[ds] + ".",
      ratt: ratt6, alternativ: alt6, svar: alt6.indexOf(ratt6)
    };
  }

  /* ------------------------------------------------------------------ *
   * 2. Kotten (egen SVG, fem uttryck – samma figur som i familjen)       *
   * ------------------------------------------------------------------ */
  function kottenSvg(uttryck, klass) {
    var F = "#b07d4b", M = "#8a5f36", O = "#2b2118", mun, ogen = "", extra = "";
    if (uttryck === "hejar") { mun = '<path d="M22 36 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else if (uttryck === "firar") {
      mun = '<path d="M21 34 q9 12 18 0" fill="#fff"/><path d="M21 34 q9 12 18 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>';
      extra = '<path d="M10 12 l3 6M50 12 l-3 6M30 6 v5" stroke="#e8a33d" stroke-width="2.2" stroke-linecap="round" fill="none"/>';
    }
    else if (uttryck === "tanker") { mun = '<path d="M24 37 h11" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>'; ogen = '<circle cx="46" cy="24" r="4" fill="none" stroke="' + M + '" stroke-width="1.6" opacity=".5"/>'; }
    else if (uttryck === "funderar") { mun = '<path d="M22 38 q8 -6 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else { mun = '<path d="M22 34 q8 8 16 0" fill="none" stroke="' + O + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    var oga = '<circle cx="23" cy="24" r="5.2" fill="#fff"/><circle cx="37" cy="24" r="5.2" fill="#fff"/>' +
      '<circle cx="24" cy="24.6" r="2.5" fill="' + O + '"/><circle cx="36" cy="24.6" r="2.5" fill="' + O + '"/>';
    return '<svg class="' + (klass || "kotten-svg") + '" viewBox="0 0 60 60" aria-hidden="true">' + extra +
      '<path d="M30 6 q9 4 12 12 q9 12 4 24 q-4 12 -16 14 q-12 -2 -16 -14 q-5 -12 4 -24 q3 -8 12 -12z" fill="' + F + '"/>' +
      '<path d="M19 20 q11 -5 22 0M16 30 q14 -5 28 0M16 40 q14 -4 28 0" stroke="' + M + '" stroke-width="1.7" fill="none" opacity=".85" stroke-linecap="round"/>' +
      oga + ogen + mun + '</svg>';
  }

  /* ------------------------------------------------------------------ *
   * 3. Ljud (WebAudio + talsyntes, skapas vid första gesten)             *
   * ------------------------------------------------------------------ */
  var ac = null, ljudPa = true;
  function ljud(frekvens, längd, typ) {
    if (!ljudPa) return;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = typ || "sine"; o.frequency.value = frekvens;
      g.gain.value = 0.001; o.connect(g); g.connect(ac.destination);
      var t = ac.currentTime;
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + längd);
      o.start(t); o.stop(t + längd + 0.02);
    } catch (e) { }
  }
  function sag(text) {
    if (!ljudPa) return;
          try { if (window.__rost && window.__rost(text, true)) return; } catch (e) { }
    try {
      if (!("speechSynthesis" in window) || !text) return;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "sv-SE"; u.rate = 0.95; u.volume = 0.9;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch (e) { }
  }
  function spar(namn, värde) { try { if (window.skolappar && window.skolappar.event) window.skolappar.event(namn, värde); } catch (e) { } }

  /* ------------------------------------------------------------------ *
   * 4. Figurerna, ritade i kod (samma färger som stapelns/radens färg)   *
   * ------------------------------------------------------------------ */
  function ikon(slag, cx, cy, r) {
    if (slag === "not") {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#c98a4b" stroke="#7c5327" stroke-width="' + (r * 0.16) + '"/>' +
        '<path d="M' + (cx - r * 0.34) + ',' + (cy - r * 1.02) + ' q' + (r * 0.34) + ',-' + (r * 0.42) + ' ' + (r * 0.68) + ',0" fill="#6b4a24"/>' +
        '<path d="M' + cx + ',' + (cy - r * 1.42) + ' l' + (r * 0.2) + ',' + (r * 0.34) + '" stroke="#6b4a24" stroke-width="' + (r * 0.22) + '" stroke-linecap="round"/>';
    }
    if (slag === "svamp") {
      return '<rect x="' + (cx - r * 0.28) + '" y="' + (cy - r * 0.1) + '" width="' + (r * 0.56) + '" height="' + (r * 1.0) + '" rx="' + (r * 0.2) + '" fill="#e8dcc4" stroke="#b9a888" stroke-width="' + (r * 0.12) + '"/>' +
        '<path d="M' + (cx - r) + ',' + (cy - r * 0.05) + ' a' + r + ',' + (r * 0.95) + ' 0 0 1 ' + (2 * r) + ',0 z" fill="#c9503f" stroke="#9c3a2d" stroke-width="' + (r * 0.12) + '"/>' +
        '<circle cx="' + (cx - r * 0.35) + '" cy="' + (cy - r * 0.45) + '" r="' + (r * 0.16) + '" fill="#f7e7dc"/>' +
        '<circle cx="' + (cx + r * 0.3) + '" cy="' + (cy - r * 0.32) + '" r="' + (r * 0.13) + '" fill="#f7e7dc"/>';
    }
    if (slag === "lov") {
      return '<path d="M' + cx + ',' + (cy - r * 1.1) + ' q' + (r * 0.95) + ',' + (r * 0.5) + ' ' + (r * 0.2) + ',' + (r * 1.55) + ' q-' + (r * 0.95) + ',0 -' + (r * 1.15) + ',-' + (r * 0.95) + ' q' + (r * 0.2) + ',-' + (r * 0.5) + ' ' + (r * 0.95) + ',-' + (r * 0.6) + ' z" fill="#2f7d5a" stroke="#215c41" stroke-width="' + (r * 0.12) + '"/>' +
        '<path d="M' + (cx + r * 0.85) + ',' + (cy - r * 0.9) + ' L' + (cx - r * 0.7) + ',' + (cy + r * 0.75) + '" stroke="#f2f7f3" stroke-width="' + (r * 0.16) + '" stroke-linecap="round" opacity=".8"/>';
    }
    /* kotte: avlång med fjäll */
    var h = "";
    for (var i = 0; i < 3; i++) {
      h += '<path d="M' + (cx - r * 0.6) + ',' + (cy - r * 0.55 + i * r * 0.55) + ' q' + (r * 0.6) + ',' + (r * 0.32) + ' ' + (r * 1.2) + ',0" fill="none" stroke="#5d3f22" stroke-width="' + (r * 0.18) + '" stroke-linecap="round"/>';
    }
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (r * 0.7) + '" ry="' + (r * 0.95) + '" fill="#8a5f36" stroke="#5d3f22" stroke-width="' + (r * 0.12) + '"/>' + h;
  }

  /* ------------------------------------------------------------------ *
   * 5. Ritningen                                                        *
   * ------------------------------------------------------------------ */
  var RUNDA = 8;
  var S = {
    skärm: "start", niva: 1, runda: 1, item: 0, svarRätt: 0, stjärnor: 0,
    felförsök: 0, p: null, klar: false, visaRätt: false, visatGrepp: false
  };

  function layoutFor(el) {
    var r = el.getBoundingClientRect();
    if (r.width && r.height && r.width < r.height * 0.95) {
      return {
        vb: [660, 980], liggande: false,
        fraga: { x: 24, y: 24, w: 612, h: 138 },
        dg: { x: 34, y: 176, w: 592, h: 500 },
        knapp: { y: 700, h: 96, w: 180, gap: 16, storlek: 44 }
      };
    }
    return {
      vb: [900, 520], liggande: true,
      fraga: { x: 24, y: 14, w: 852, h: 92 },
      dg: { x: 40, y: 118, w: 820, h: 306 },
      knapp: { y: 436, h: 76, w: 148, gap: 14, storlek: 36 }
    };
  }

  /* Frågebubbla: ikoner för det som frågas + text (texten finns även skriven,
     eftersom klassrumsplattor ofta är ljudlösa). */
  function fragaRit(L, p) {
    var b = L.fraga, h = [];
    h.push('<rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="' + (L.liggande ? 22 : 28) + '" fill="#fff" stroke="var(--linje)" stroke-width="3"/>');
    /* ikoner som visar vilka saker frågan gäller */
    var glyf = [], i, r = L.liggande ? 15 : 19;
    if (p.niva === 1) glyf = [p.fraga.slag];
    else if (p.niva === 2 && p.typ === "fler") glyf = [p.hog, p.lag];
    else if (p.niva === 2) glyf = p.par;
    else if (p.typ === "skillnad") glyf = ["not", "kotte"];
    else if (p.niva === 3) glyf = ["not"];
    var gx = b.x + (L.liggande ? 74 : 84);
    var textX = b.x + (glyf.length ? (L.liggande ? 152 : 176) : 34);
    if (glyf.length) {
      for (i = 0; i < glyf.length; i++) {
        var cx = gx + i * (L.liggande ? 46 : 56);
        h.push('<circle cx="' + cx + '" cy="' + (b.y + b.h / 2) + '" r="' + (r * 1.55) + '" fill="color-mix(in srgb, ' + SLAG[glyf[i]].färg + ' 14%, #fff)"/>');
        h.push(ikon(glyf[i], cx, b.y + b.h / 2, r));
      }
    }
    /* Textens bredd mäts inte av SVG förrän den finns i DOM:en, så raderna
       bryts mot en uppskattning (0,60 em per tecken) och fonten krymps tills
       hela frågan ryms i bubblan. Frågan får aldrig klippas. */
    var tillgänglig = (b.x + b.w - 22) - textX;
    var fs = L.liggande ? 30 : 32;
    var rader = [];
    for (var försök = 0; försök < 8; försök++) {
      var perRad = Math.max(8, Math.floor(tillgänglig / (fs * 0.60)));
      var ord2 = p.fragaText.split(" "), nu = "";
      rader = [];
      ord2.forEach(function (o) {
        if ((nu + " " + o).trim().length <= perRad) nu = (nu + " " + o).trim();
        else { if (nu) rader.push(nu); nu = o; }
      });
      if (nu) rader.push(nu);
      if (rader.length * fs * 1.14 <= b.h - 18) break;
      fs -= 2;
    }
    var blockH = rader.length * fs * 1.14;
    var yStart = b.y + (b.h - blockH) / 2 + fs * 0.9;
    rader.forEach(function (r, k) {
      h.push('<text x="' + textX + '" y="' + (yStart + k * fs * 1.14) + '" font-size="' + fs + '" font-weight="700" fill="var(--bläck)">' + r + '</text>');
    });
    return h.join("");
  }

  function ring(x, y, w, hh, r) {
    return '<rect class="fraga-ring" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="' + r + '" fill="none" stroke="var(--accent)" stroke-width="4"/>';
  }

  /* Nivå 1: bilddiagram – tre rader med samma sorts saker i rad */
  function bilddiagramRit(L, p) {
    var d = L.dg, h = [], radH = d.h / p.rader.length, r = L.liggande ? 17 : 20;
    p.rader.forEach(function (rad, i) {
      var cy = d.y + radH * (i + 0.5);
      var ärFr = rad === p.fraga;
      if (ärFr && !S.klar) h.push(ring(d.x + 8, cy - radH / 2 + 6, d.w - 16, radH - 12, 20));
      var w = L.liggande ? 40 : 46;
      var totW = (rad.antal - 1) * w;
      var x0 = d.x + d.w / 2 - totW / 2;
      for (var j = 0; j < rad.antal; j++) h.push(ikon(rad.slag, x0 + j * w, cy, r));
      if (S.klar || S.visaRätt) {
        h.push('<text x="' + (d.x + d.w - 22) + '" y="' + (cy + 12) + '" text-anchor="end" font-size="' + (L.liggande ? 34 : 38) + '" font-weight="800" fill="var(--accent-mörk)">' + rad.antal + '</text>');
      }
    });
    return h.join("");
  }

  /* Nivå 2: stapeldiagram med sifferaxel */
  function stapelRit(L, p) {
    var d = L.dg, h = [], i;
    var maxV = 0;
    p.staplar.forEach(function (s) { if (s.antal > maxV) maxV = s.antal; });
    var topp = Math.max(4, Math.ceil(maxV / 2) * 2);
    var vänster = d.x + (L.liggande ? 46 : 54);
    var basY = d.y + d.h - (L.liggande ? 44 : 56);
    var toppY = d.y + 8;
    var hScale = (basY - toppY) / topp;
    /* rutnät + siffror på axeln */
    for (i = 0; i <= topp; i += 2) {
      var y = basY - i * hScale;
      h.push('<line x1="' + vänster + '" y1="' + y + '" x2="' + (d.x + d.w) + '" y2="' + y + '" stroke="var(--linje)" stroke-width="1.5"/>');
      h.push('<text x="' + (vänster - 12) + '" y="' + (y + 7) + '" text-anchor="end" font-size="' + (L.liggande ? 20 : 22) + '" font-weight="700" fill="var(--dämpad)">' + i + '</text>');
    }
    h.push('<line x1="' + vänster + '" y1="' + toppY + '" x2="' + vänster + '" y2="' + basY + '" stroke="var(--dämpad)" stroke-width="2"/>');
    var bredd = (d.x + d.w - vänster) / p.staplar.length;
    var stapelW = Math.min(bredd * 0.56, L.liggande ? 96 : 78);
    p.staplar.forEach(function (s, k) {
      var cx = vänster + bredd * (k + 0.5);
      var hh = s.antal * hScale;
      var frågad = (p.typ === "fler" && (s.slag === p.hog || s.slag === p.lag)) ||
        (p.typ === "sammanlagt" && p.par.indexOf(s.slag) >= 0);
      h.push('<rect x="' + (cx - stapelW / 2) + '" y="' + (basY - hh) + '" width="' + stapelW + '" height="' + Math.max(hh, 4) + '" rx="' + Math.min(10, stapelW / 4) + '" fill="' + SLAG[s.slag].färg + '" opacity="' + (frågad || S.klar ? 1 : 0.55) + '"/>');
      h.push(ikon(s.slag, cx, basY + (L.liggande ? 26 : 32), L.liggande ? 15 : 17));
      if (S.klar || S.visaRätt) {
        h.push('<text x="' + cx + '" y="' + (basY - hh - 12) + '" text-anchor="middle" font-size="' + (L.liggande ? 26 : 28) + '" font-weight="800" fill="var(--accent-mörk)">' + s.antal + '</text>');
      }
      if (frågad && !S.klar) h.push('<rect class="fraga-ring" x="' + (cx - stapelW / 2 - 7) + '" y="' + (basY - hh - 7) + '" width="' + (stapelW + 14) + '" height="' + (hh + 14) + '" rx="12" fill="none" stroke="var(--accent)" stroke-width="4"/>');
    });
    return h.join("");
  }

  /* Nivå 3: tabell — fyra dagar i kolumner, två rader */
  function tabellRit(L, p) {
    var d = L.dg, h = [], i, j;
    var rubrikH = L.liggande ? 54 : 64;
    var radH = L.liggande ? 76 : 88;
    var första = L.liggande ? 140 : 150;
    var cellW = (d.w - första) / 4;
    var y0 = d.y + 6;
    h.push('<rect x="' + d.x + '" y="' + y0 + '" width="' + d.w + '" height="' + (rubrikH + radH * 2) + '" rx="18" fill="#fff" stroke="var(--linje)" stroke-width="3"/>');
    /* dagrubriker */
    for (i = 0; i < 4; i++) {
      var cx = d.x + första + cellW * (i + 0.5);
      var frågadDag = p.dagar.indexOf(i) >= 0;
      if (frågadDag) h.push('<rect x="' + (d.x + första + cellW * i + 4) + '" y="' + (y0 + 4) + '" width="' + (cellW - 8) + '" height="' + (rubrikH + radH * 2 - 8) + '" rx="12" fill="color-mix(in srgb, var(--accent) 9%, #fff)"/>');
      h.push('<text x="' + cx + '" y="' + (y0 + rubrikH * 0.68) + '" text-anchor="middle" font-size="' + (L.liggande ? 24 : 25) + '" font-weight="700" fill="var(--dämpad)">' + DAGAR[i].slice(0, 3) + '</text>');
    }
    h.push('<line x1="' + d.x + '" y1="' + (y0 + rubrikH) + '" x2="' + (d.x + d.w) + '" y2="' + (y0 + rubrikH) + '" stroke="var(--linje)" stroke-width="2"/>');
    /* rader */
    ["nötter", "kottar"].forEach(function (rad, k) {
      var ry = y0 + rubrikH + radH * k;
      var slag = rad === "nötter" ? "not" : "kotte";
      if (k > 0) h.push('<line x1="' + d.x + '" y1="' + ry + '" x2="' + (d.x + d.w) + '" y2="' + ry + '" stroke="var(--linje)" stroke-width="2"/>');
      h.push('<circle cx="' + (d.x + första / 2) + '" cy="' + (ry + radH / 2) + '" r="' + (L.liggande ? 26 : 28) + '" fill="#fff" stroke="var(--linje)" stroke-width="2"/>');
      h.push(ikon(slag, d.x + första / 2, ry + radH / 2, L.liggande ? 16 : 18));
      for (j = 0; j < 4; j++) {
        var x = d.x + första + cellW * (j + 0.5);
        h.push('<text x="' + x + '" y="' + (ry + radH / 2 + 11) + '" text-anchor="middle" font-size="' + (L.liggande ? 34 : 36) + '" font-weight="800" fill="var(--bläck)">' + p.tabell[rad][j] + '</text>');
      }
    });
    if (p.typ === "skillnad" && !S.klar) {
      var rr = y0 + rubrikH;
      h.push(ring(d.x + 4, rr + 4, d.w - 8, radH * 2 - 8, 14));
    }
    return h.join("");
  }

  function knapparRit(L, p) {
    var k = L.knapp, h = [], totW = k.w * 3 + k.gap * 2;
    var x0 = L.vb[0] / 2 - totW / 2;
    p.alternativ.forEach(function (v, i) {
      var x = x0 + i * (k.w + k.gap);
      var rätt = S.klar && S.visaRätt && v === p.ratt;
      var valt = S.sistaVal === i;
      var fyll = rätt ? "var(--accent)" : "#fff";
      var färg = rätt ? "#fff" : "var(--bläck)";
      h.push('<g class="svar-g' + (rätt ? " ratt" : "") + (valt && !rätt ? " fel" : "") + '" data-i="' + i + '" role="button" tabindex="0" aria-label="svar ' + v + '">');
      h.push('<rect class="svar-kort" x="' + x + '" y="' + k.y + '" width="' + k.w + '" height="' + k.h + '" rx="' + (L.liggande ? 20 : 24) + '" fill="' + fyll + '" stroke="' + (rätt ? "var(--accent)" : "var(--linje)") + '" stroke-width="3"/>');
      h.push('<text x="' + (x + k.w / 2) + '" y="' + (k.y + k.h / 2 + k.storlek * 0.36) + '" text-anchor="middle" font-size="' + k.storlek + '" font-weight="800" fill="' + färg + '">' + v + '</text>');
      h.push('</g>');
    });
    return h.join("");
  }

  function ritaScen() {
    var p = S.p, el = document.getElementById("scen");
    if (!p) return;
    var L = layoutFor(el), h = [];
    h.push('<rect x="0" y="0" width="' + L.vb[0] + '" height="' + L.vb[1] + '" fill="var(--papper)"/>');
    h.push(fragaRit(L, p));
    if (p.niva === 1) h.push(bilddiagramRit(L, p));
    else if (p.niva === 2) h.push(stapelRit(L, p));
    else h.push(tabellRit(L, p));
    h.push(knapparRit(L, p));
    el.setAttribute("viewBox", "0 0 " + L.vb[0] + " " + L.vb[1]);
    el.innerHTML = h.join("");
  }

  function ritaPrickar() {
    var h = "", i;
    for (i = 0; i < RUNDA; i++) h += '<i class="' + (i < S.item ? "klar" : "") + '"></i>';
    document.getElementById("prickar").innerHTML = h;
  }
  function ritaStjärnor() {
    document.getElementById("stjarnor").textContent = "★".repeat(Math.min(S.stjärnor, 12)) + (S.stjärnor > 12 ? "+" : "");
  }
  function kottenByt(uttryck) {
    var el = document.getElementById("kotten");
    if (el) el.innerHTML = kottenSvg(uttryck, "kotten-svg");
  }

  /* ------------------------------------------------------------------ *
   * 6. Spelflöde                                                       *
   * ------------------------------------------------------------------ */
  var idleTimer = null;
  function startIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (S.skärm === "spel" && !S.klar && S.felförsök === 0) {
        sag(S.p.fragaText);
        spar("hint");
      }
    }, 12000);
  }

  function nyUppgift() {
    S.p = uppgift(S.niva);
    S.klar = false; S.felförsök = 0; S.visaRätt = false; S.sistaVal = -1;
    ritaScen(); ritaPrickar();
    sag(S.p.fragaText);
    startIdle();
  }

  function valj(i) {
    if (S.skärm !== "spel" || S.klar) return;
    var p = S.p;
    if (i < 0 || i >= p.alternativ.length) return;
    clearTimeout(idleTimer);
    S.sistaVal = i;
    if (p.alternativ[i] === p.ratt) {
      S.klar = true; S.visaRätt = true; S.item++; S.svarRätt++; S.stjärnor++;
      ritaScen(); ritaPrickar(); ritaStjärnor();
      ljud(520, 0.12, "square");
      setTimeout(function () { ljud(780, 0.14, "sine"); }, 130);
      setTimeout(function () { ljud(1040, 0.18, "sine"); }, 260);
      sag("Rätt! " + p.text);
      kottenByt("firar");
      setTimeout(function () {
        kottenByt("glad");
        if (S.item >= RUNDA) rundaKlar(); else nyUppgift();
      }, 2400);
    } else {
      S.felförsök++;
      ritaScen();
      ljud(220, 0.16, "triangle");
      setTimeout(function () { ljud(170, 0.18, "triangle"); }, 150);
      kottenByt("funderar");
      sag("Titta på siffrorna igen. " + p.fragaText);
      spar("hint");
      if (S.felförsök >= 2) {
        S.visaRätt = true; S.klar = true;
        ritaScen();
        sag("Den som lyser är rätt. " + p.text);
        kottenByt("tanker");
        setTimeout(function () {
          S.item++;
          kottenByt("glad");
          if (S.item >= RUNDA) rundaKlar(); else nyUppgift();
        }, 2800);
      } else {
        setTimeout(function () { ritaScen(); startIdle(); }, 500);
      }
    }
  }

  function rundaKlar() {
    S.skärm = "överlägg";
    var procent = Math.round(100 * S.svarRätt / RUNDA);
    spar("round_done", procent);
    sag("Rundan är klar. " + S.svarRätt + " av " + RUNDA + " rätt.");
    var stegUpp = S.svarRätt >= 6 && S.niva < 3;
    visaOverlay(S.svarRätt >= 6 ? "firar" : "hejar", "Rundan är klar!",
      S.svarRätt + " av " + RUNDA + " rätt. " + S.stjärnor + " stjärnor totalt." +
      (stegUpp ? " Nu blir det svårare!" : ""),
      "En runda till →", function () {
        if (stegUpp) { S.niva++; spar("level", S.niva); }
        S.runda++; startaRunda(S.niva);
      }, true);
  }

  function visaOverlay(uttryck, titel, text, knapptext, vidare, medNiva) {
    var ov = document.getElementById("overlay");
    document.getElementById("ov-bild").innerHTML = kottenSvg(uttryck, "ov-kotten");
    document.getElementById("ov-titel").textContent = titel;
    document.getElementById("ov-text").textContent = text;
    var b = document.getElementById("ov-nasta");
    b.textContent = knapptext;
    b.onclick = function () { ov.hidden = true; vidare(); };
    var n = document.getElementById("ov-niva");
    n.hidden = !medNiva;
    n.onclick = function () { ov.hidden = true; S.niva = S.niva >= 3 ? 1 : S.niva + 1; S.runda++; startaRunda(S.niva); };
    ov.hidden = false;
  }

  function startaRunda(niva) {
    S.niva = niva; S.skärm = "spel"; S.item = 0; S.svarRätt = 0; S.felförsök = 0;
    S.visatGrepp = false; S.sistaVal = -1;
    document.getElementById("startskarm").hidden = true;
    document.getElementById("spel").hidden = false;
    document.getElementById("overlay").hidden = true;
    ritaStjärnor(); kottenByt("glad");
    spar("round_start"); spar("level", niva);
    if (niva === 2) setTimeout(function () { sag("Nu är det ett stapeldiagram. Titta på siffrorna vid sidan."); }, 900);
    if (niva === 3) setTimeout(function () { sag("Nu är det en tabell. Läs i rätt ruta."); }, 900);
    nyUppgift();
  }

  function tipsa() {
    if (S.skärm !== "spel" || S.klar) return;
    sag(S.p.fragaText);
    spar("hint");
    kottenByt("tanker");
    setTimeout(function () { if (!S.klar) kottenByt("glad"); }, 1800);
  }

  /* ------------------------------------------------------------------ *
   * 7. Händelser och start                                             *
   * ------------------------------------------------------------------ */
  function ritaLjudIkon() {
    document.getElementById("ljudikon").innerHTML = ljudPa
      ? '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 8a5 5 0 0 1 0 8"/>'
      : '<path d="M4 9h3l4-3v12l-4-3H4z"/><path d="M15 9l5 6M20 9l-5 6"/>';
  }

  function bind() {
    document.getElementById("scen").addEventListener("pointerdown", function (e) {
      var g = e.target.closest(".svar-g");
      if (g) { e.preventDefault(); valj(Number(g.dataset.i)); }
    });
    document.getElementById("spela").addEventListener("click", function () { ljud(600, 0.1); startaRunda(1); });
    document.getElementById("hjalp").addEventListener("click", tipsa);
    document.getElementById("ljud").addEventListener("click", function () {
      ljudPa = !ljudPa;
      if (!ljudPa && "speechSynthesis" in window) { try { window.speechSynthesis.cancel(); } catch (e) { } }
      ritaLjudIkon(); spar("sound_off");
    });
    document.addEventListener("keydown", function (e) {
      if (S.skärm !== "spel") return;
      if (e.key === "1" || e.key === "ArrowLeft") valj(0);
      if (e.key === "2" || e.key === "ArrowDown") valj(1);
      if (e.key === "3" || e.key === "ArrowRight") valj(2);
      if (e.key === "h" || e.key === "?") tipsa();
    });
    window.addEventListener("resize", function () { if (S.p) ritaScen(); });
  }

  function init() {
    bind(); ritaLjudIkon(); ritaStjärnor(); ritaPrickar();
    document.getElementById("kotten-hud").innerHTML = kottenSvg("glad", "kotten-hud");
    kottenByt("glad");
    window.__game = {
      S: S, uppgift: uppgift, SLAG: SLAG, DAGAR: DAGAR, valj: valj,
      startaRunda: startaRunda, nyUppgift: nyUppgift, tipsa: tipsa, ritaScen: ritaScen
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();