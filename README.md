# Golf-poängräknare

En mobilanpassad webbapp (PWA) för att räkna poäng när man spelar golf med
kompisar. Data sparas lokalt i webbläsaren — ingen inloggning, inget konto,
ingen server. Appen fungerar även med dålig eller ingen täckning på banan.

## Funktioner

- **Bästboll/sämstboll (2 mot 2):** per hål jämförs lagens bästa och sämsta
  netto mot varandra, med konfigurerbara poäng per delmatch.
- Spelare kan spela från **olika tees** i samma runda; handicapslag räknas
  utifrån spelarens eget handicap, tee och banans hålindex (och slope/course
  rating när de är ifyllda).
- Löpande ställning under rundan, inklusive matchstatus i golftermer
  ("1 upp", "Lika (A/S)", dormie, avgjord match).
- **Scorekort** med ut/in/totalt, par och redigerbart hålindex.
- **Historik** över avslutade rundor, nyast först, med fullt scorekort och
  möjlighet att radera (med bekräftelse).
- **Total**-flik som summerar poäng och vinster per spelare och per lagpar,
  filtrerbart på spelform och datumintervall.
- Bandata för Barsebäck (Ocean, Pine) och The National (Links, Lakes) finns
  inlagd, och det går att lägga till fler banor i `src/data/courses.json`.

Fler spelformer (t.ex. Köpenhamare) och GitHub Pages-publicering är planerat
men inte klart än — se `docs/architecture.md` för hela planen.

## Teknik

TypeScript + React + Vite, byggd som PWA (`vite-plugin-pwa`). Poänglogiken
ligger i ren, UI-oberoende kod under `src/engine/` och `src/domain/`, testad
med Vitest.

## Köra lokalt

Kräver [Node.js](https://nodejs.org/) (installeras t.ex. via `brew install node`).

```bash
npm install       # installera beroenden
npm run dev       # starta dev-servern (http://localhost:5173)
npm run test      # kör testsviten (Vitest)
npm run build     # bygg produktionsversionen till dist/
npm run preview   # servera det byggda resultatet lokalt, inklusive PWA/offline-stöd
npm run lint      # kör linter (oxlint)
```

## Mer information

- [`CLAUDE.md`](CLAUDE.md) — kravspec och arbetssätt för projektet.
- [`docs/architecture.md`](docs/architecture.md) — teknisk arkitektur, beslut
  och byggordning.
