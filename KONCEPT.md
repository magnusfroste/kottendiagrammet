# Koncept – Kotten och diagrammet

**Ett mål:** barnet ska kunna läsa en enkel tabell och ett enkelt diagram och svara på en fråga
om det som står där – inget annat.

**Målgrupp:** åk 1–3 (7–9 år), främst åk 2–3. Kategori i katalogen: Matte, FK–2, Spel, Alla enheter.

**Kärnmekanik (touch först):** tre sifferknappar under diagrammet. Frågan skrivs ut och läses upp
på svenska ("Hur många fler nötter än löv?"). Den rad, de staplar eller de dagar frågan gäller
markeras med en pulserande grön ram, så barnet ser var det ska titta utan att läsa.

**De tre nivåerna** – en mekanik, tre svårighetsgrader:
1. **Bilddiagram:** tre rader med nötter, svampar, löv och kottar (1–5 i varje). Frågan gäller
   hur många det finns i en rad.
2. **Stapeldiagram:** tre staplar med sifferaxel 0–6/0–8 och rutnät. Frågan gäller skillnaden
   mellan två staplar eller summan av två.
3. **Tabell:** fyra dagar (mån–tor) × två rader (nötter, kottar) med siffror 1–9. Frågan gäller en
   ruta, två dagar sammanlagt eller skillnaden mellan raderna en dag.

**5-minuterssession:** 8 uppgifter per runda, ca 3–5 minuter. Prickar visar hur många som är kvar,
stjärnor hur många som blev rätt, och resultatrutan säger "8 av 8 rätt" och erbjuder en runda till.

**Belöning barnet kan berätta om:** antal stjärnor och att det klarade tabellen – "jag räknade i
tabellen".

**Vad barnet lär:** att hämta en uppgift ur en tabell eller ett diagram i stället för ur en text:
läsa av en stapel mot en axel, summera två staplar, hitta rätt ruta (rad + kolumn), och räkna
skillnad. Det är samma färdighet som NP-uppgifterna i åk 3 bygger på.

**Lgr22 (ordagrant ur Skolverkets kursplan, kontrollerat med get_curriculum):**
- MA.1-3.4.2 – "Enkla tabeller och diagram och hur de används för att sortera data och beskriva
  resultat från undersökningar, såväl med som utan digitala verktyg."
- MA.1-3.1.6 – "De fyra räknesättens egenskaper och samband samt användning i olika situationer."
  (frågorna på nivå 2–3 kräver addition eller subtraktion med diagrammets siffror)

**Varför iPad:** allt ritas i en enda SVG som räknar om sin viewBox vid resize; tre stora
sifferknappar (83–112 px) träffas med tummen, ingen scroll, ingen text som måste läsas för att
kunna svara, ljudet går att stänga av och frågan finns alltid även som text (klassrumsplattor är
ofta ljudlösa).

**Kotten:** egen SVG med fem uttryck (glad, hejar, firar, tänker, funderar). Fel svar kostar
ingenting: Kotten funderar, frågan läses om, och efter två fel lyser rätt knapp och spelet går
vidare.

## Testplan (mätbara krav)

| Krav | Mätning | Kravvärde |
|---|---|---|
| Spelbart med bara fingrar | `Input.dispatchTouchEvent` på sifferknapparna | hel runda 8/8 utan mus |
| Allt ryms på skärmen | `scrollHeight-innerHeight`, `scrollWidth-innerWidth` efter Spela | 0 i 1024×768, 768×1024, 390×844, 1440×900 |
| Träffytor | `getBoundingClientRect()` på varje sifferknapp | ≥ 44 px, helst ≥ 72 px |
| Frågan ryms | varje SVG-`text`-bbox innanför viewBox, 8 uppgifter × 3 nivåer × 4 storlekar | inga utanför |
| Rätt fakta | `node verify.mjs` räknar om svaret ur tabellen/diagrammet | 0 fel av 90 000 uppgifter |
| Svensk text i barnets nivå | frågan är en rad, orden är vardagliga | granskat för hand |
| Återkoppling + nytt försök | fel två gånger → rätt knapp lyser, rundan går vidare | verifierat i fixtures |
| Ingen inloggning/reklam/länkar | enda externa request: kotten.js | granskat |

## Validering (steg 4)

`delegate_task` finns inte i den här körningens verktygsuppsättning, så granskningen gjordes som en
skriven självkritik mot de tre frågorna i stället för av en andra agent:

(a) *Spelar ett barn det frivilligt i fem minuter?* Ja, om svaret går att ge utan att läsa. Därför
är frågan uppläst, den frågade raden/stapeln/dagarna pulserar, och alla svar är tre siffror – inga
menyer, ingen text att tolka. Svagheten är nivå 3, som kräver att barnet hittar rätt rad i tabellen;
det löses av att de frågade kolumnerna är tonade.

(b) *Träffar det ett verkligt kunskapskrav?* Ja, MA.1-3.4.2 är ett av de tydligaste kraven i åk 1–3
och katalogen hade ingen app för det (56 appar, ingen läser tabeller eller diagram).

(c) *Teknisk risk?* Låg: ren SVG, ingen fysik, ingen timer. Den enda risken var textbrytningen i
frågebubblan, som mäts i testplanen.

**Go.** Byggt enligt konceptet; ingen revidering behövdes efter valideringen, men en iterering
gjordes efter test (se README: frågebubblans radbrytning).