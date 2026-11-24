# Kotten och diagrammet

Läsa enkla tabeller och diagram – matematik åk 1–3 (Lgr22 MA.1-3.4.2, MA.1-3.1.6).

Kotten har varit i skogen och samlat. Tre sorters diagram, en fråga i taget:

1. **Bilddiagram** – tre rader med nötter, svampar, löv och kottar. Hur många är det i raden?
2. **Stapeldiagram** – siffror på axeln, frågan gäller skillnaden mellan två staplar eller summan.
3. **Tabell** – fyra dagar × två rader. Läs en ruta, summera två dagar eller räkna skillnaden.

Frågan skrivs ut **och** läses upp på svenska; raden, staplarna eller dagarna som frågan gäller
markeras. Tre stora sifferknappar svarar. Fel svar kostar inget – efter två fel lyser rätt knapp och
rundan går vidare. Åtta uppgifter per runda, stjärnor och "en runda till".

## Filer

```
public/index.html      appen (startskärm med läroplansruta, spel, överlägg)
public/app.js          uppgiftsgenerator (ren funktion) + SVG-ritning + ljud
public/styles.css      Kotten-familjens färger
public/kort.png        1200×900 spelmoment (kortbild till katalogen)
kit.py                 appikoner, favicon, og.png, manifest, robots, sitemap
verify.mjs             räknar om 90 000 uppgifter mot sin egen data
```

## Test

```
node verify.mjs     # 0 fel = varje svar stämmer med tabellen/diagrammet
```

Rikt browser-test: `python3 -m http.server` i `public/`, sedan touch-events på sifferknapparna
(se KONCEPT.md, testplanen). 0 px scroll i 1024×768, 768×1024, 390×844 och 1440×900.

## Iteration efter test

Första versionen bröt frågetexten mot ett fast teckenantal och klippte långa frågor (t.ex.
"Hur många nötter sammanlagt på tisdag och onsdag?") utanför viewBox i stående läge. Nu mäts den
tillgängliga bredden mot en uppskattning per tecken, frågan bryts i så många rader som behövs och
fonten krymps tills blocket ryms i bubblan; testat med 8 uppgifter × 3 nivåer × 4 skärmstorlekar –
ingen text sticker ut. Två frågor kortades också ("har Kotten sammanlagt" → "sammanlagt", "blev det
på" → "på") eftersom de satt ihop med långa dagnamn.