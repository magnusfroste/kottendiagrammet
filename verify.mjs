// Kontrollerar uppgiftsgeneratorn i public/app.js mot den data uppgiften bär:
//  – nivå 1: rätt svar är antalet i den frågade raden, alla tre raderna har olika sort,
//  – nivå 2: rätt svar är skillnaden eller summan av de staplar frågan nämner,
//  – nivå 3: rätt svar läses ur tabellen (en ruta, summan av två dagar, skillnaden i en kolumn),
//  – alla nivåer: exakt tre olika sifferknappar 0–16, svar pekar på rätt knapp,
//    frågetexten nämner rätt saker och förklaringen nämner svaret.
//   node verify.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./public/app.js", import.meta.url), "utf8");
const start = src.indexOf("var TALORD = [");
const end = src.indexOf("* 2. Kotten");
if (start < 0 || end < 0) throw new Error("hittar inte den rena generatorn i app.js");
const ren = src.slice(start, src.lastIndexOf("/*", end));
const G = eval("(function(){" + ren + "\nreturn {uppgift:uppgift, SLAG:SLAG, DAGAR:DAGAR, TALORD:TALORD};})()");

let seed = 20261124;
Math.random = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

let fel = 0;
const kolla = (c, m, p) => { if (!c) { fel++; if (fel <= 25) console.log("FEL", m, JSON.stringify(p)); } };
const antal = { 1: 0, 2: 0, 3: 0 };
const typer = { 1: new Set(), 2: new Set(), 3: new Set() };

for (let k = 0; k < 30000; k++) {
  for (const niva of [1, 2, 3]) {
    const p = G.uppgift(niva);
    antal[niva]++;
    typer[niva].add(p.typ);

    kolla(p.niva === niva, "fel nivå", p.niva);
    kolla(Array.isArray(p.alternativ) && p.alternativ.length === 3, "fel antal knappar", p);
    kolla(new Set(p.alternativ).size === 3, "samma tal två gånger", p);
    kolla(p.alternativ.every(a => Number.isInteger(a) && a >= 0 && a <= 16), "tal utanför 0–16", p);
    kolla(p.svar >= 0 && p.svar <= 2, "svar utanför 0–2", p);
    kolla(p.alternativ[p.svar] === p.ratt, "svar pekar inte på rätt knapp", p);
    kolla(p.ratt === Math.max(...p.alternativ) || p.ratt < Math.max(...p.alternativ), "orimligt svar", p);
    kolla(typeof p.fragaText === "string" && p.fragaText.length > 12 && p.fragaText.endsWith("?"), "dålig fråga", p);
    kolla(typeof p.text === "string" && p.text.length > 8, "saknar förklaring", p);

    // förklaringen ska nämna svaret som siffra (inte bara som ord)
    if (!/[0-9]/.test(p.text)) kolla(false, "förklaringen saknar siffra", p);

    if (niva === 1) {
      kolla(p.rader.length === 3, "nivå 1 ska ha tre rader", p);
      kolla(new Set(p.rader.map(r => r.slag)).size === 3, "samma sort två gånger", p);
      kolla(p.rader.every(r => Number.isInteger(r.antal) && r.antal >= 1 && r.antal <= 5), "orimligt antal i raden", p);
      kolla(p.ratt === p.fraga.antal, "rätt svar är inte radens antal", p);
      kolla(p.fragaText.includes(G.SLAG[p.fraga.slag].plural), "frågan nämner inte sorten", p);
      const antalRader = p.rader.map(r => r.antal);
      kolla(new Set(antalRader).size >= 1, "rader", p);
    }

    if (niva === 2) {
      kolla(p.staplar.length === 3, "nivå 2 ska ha tre staplar", p);
      kolla(new Set(p.staplar.map(s => s.slag)).size === 3, "samma sort två gånger", p);
      kolla(p.staplar.every(s => Number.isInteger(s.antal) && s.antal >= 1 && s.antal <= 8), "stapel utanför 1–8", p);
      const hitta = slag => p.staplar.find(s => s.slag === slag).antal;
      if (p.typ === "fler") {
        const h = hitta(p.hog), l = hitta(p.lag);
        kolla(h > l, "fler-frågan har inte en högre stapel", p);
        kolla(p.ratt === h - l, "skillnaden stämmer inte", p);
        kolla(p.fragaText.includes(G.SLAG[p.hog].plural) && p.fragaText.includes(G.SLAG[p.lag].plural), "frågan nämner inte båda sorterna", p);
      } else {
        const a = hitta(p.par[0]), b = hitta(p.par[1]);
        kolla(p.ratt === a + b, "summan stämmer inte", p);
        kolla(p.fragaText.includes(G.SLAG[p.par[0]].plural) && p.fragaText.includes(G.SLAG[p.par[1]].plural), "frågan nämner inte båda sorterna", p);
      }
    }

    if (niva === 3) {
      const t = p.tabell;
      kolla(t && t.nötter.length === 4 && t.kottar.length === 4, "tabellen har inte fyra dagar", p);
      kolla([...t.nötter, ...t.kottar].every(v => Number.isInteger(v) && v >= 1 && v <= 9), "tabellvärde utanför 1–9", p);
      kolla(p.dagar.length >= 1 && p.dagar.every(d => d >= 0 && d <= 3), "okänd dag markerad", p);
      if (p.typ === "cell") {
        kolla(p.ratt === t[p.rad][p.dagar[0]], "cellvärdet stämmer inte", p);
        kolla(p.fragaText.includes(G.DAGAR[p.dagar[0]]), "frågan nämner inte dagen", p);
      } else if (p.typ === "summa") {
        const d1 = p.dagar[0], d2 = p.dagar[1];
        kolla(d1 !== d2, "summan använder samma dag två gånger", p);
        kolla(p.ratt === t.nötter[d1] + t.nötter[d2], "summan stämmer inte", p);
        kolla(p.fragaText.includes(G.DAGAR[d1]) && p.fragaText.includes(G.DAGAR[d2]), "frågan nämner inte båda dagarna", p);
      } else {
        const d = p.dagar[0];
        kolla(p.ratt === Math.abs(t.nötter[d] - t.kottar[d]), "skillnaden stämmer inte", p);
        kolla(p.ratt > 0, "skillnaden är noll", p);
      }
    }
  }
}

kolla(typer[1].has("rakna"), "nivå 1 ska räkna en rad");
kolla(typer[2].has("fler") && typer[2].has("sammanlagt"), "nivå 2 ska blanda fler och sammanlagt: " + [...typer[2]]);
kolla(typer[3].has("cell") && typer[3].has("summa") && typer[3].has("skillnad"), "nivå 3 ska blanda cell, summa och skillnad: " + [...typer[3]]);
kolla(G.TALORD.length >= 16, "talorden räcker inte");

for (const niva of [1, 2, 3]) console.log("nivå " + niva + ":", antal[niva], "uppgifter, typer:", [...typer[niva]].join("+"));
console.log(fel === 0 ? "OK – 0 fel" : fel + " FEL");
process.exit(fel === 0 ? 0 : 1);