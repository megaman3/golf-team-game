# Golf-poängräknare

**Live:** [megaman3.github.io/golf-team-game](https://megaman3.github.io/golf-team-game/)

En mobilanpassad webbapp (PWA) för att räkna poäng när man spelar golf med
kompisar. Data sparas lokalt i webbläsaren — ingen inloggning, inget konto,
ingen server. Appen fungerar även med dålig eller ingen täckning på banan.
Öppna länken ovan på mobilen och lägg till den på hemskärmen.

## Funktioner

- **Bästboll/sämstboll (2 mot 2):** per hål jämförs lagens bästa och sämsta
  netto mot varandra, med konfigurerbara poäng per delmatch. Slutresultatet
  redovisas i klassisk matchspelsnotation ("Lag A vinner, 3 och 2").
- **Köpenhamare (3 spelare):** 6 poäng per hål fördelat 4-2-0 efter
  nettoresultat, med rätt delningsregler vid oavgjort (4-1-1, 3-3-0, 2-2-2).
- Spelare kan spela från **olika tees** i samma runda; handicapslag räknas
  utifrån spelarens eget handicap, tee och banans hålindex (och slope/course
  rating när de är ifyllda).
- Löpande ställning under rundan, inklusive matchstatus i golftermer
  ("1 upp", "Lika (A/S)", dormie, avgjord match) och normaliserad poängskillnad
  för Köpenhamare.
- **Diagram** över ställning och poäng per hål, i scorekortet och historiken.
- Bakgrundsbild från respektive golfbana under spel.
- Möjlighet att **avbryta en pågående runda** (med bekräftelse).
- **Scorekort** med ut/in/totalt, par och redigerbart hålindex.
- **Historik** över avslutade rundor, nyast först, med fullt scorekort och
  möjlighet att radera (med bekräftelse), direkt i listan eller i rundan.
- **Total**-flik som summerar poäng och vinster per spelare och per lagpar,
  filtrerbart på spelform och datumintervall.
- **Inställningar**: export/import av all data som JSON (backup), och
  möjlighet att lägga till en ny bana utan att ändra kod.
- Bandata för Barsebäck (Ocean, Pine) och The National (Links, Lakes) finns
  inlagd, och det går att lägga till fler banor i `src/data/courses.json`
  eller via Inställningar-fliken.

## Teknik

TypeScript + React + Vite, byggd som PWA (`vite-plugin-pwa`). Poänglogiken
ligger i ren, UI-oberoende kod under `src/engine/` och `src/domain/`, testad
med Vitest.

## Köra lokalt

Kräver [Node.js](https://nodejs.org/) (installeras t.ex. via `brew install node`).

```bash
npm install       # installera beroenden
npm run dev       # starta dev-servern (http://localhost:5173/golf-team-game/)
npm run test      # kör testsviten (Vitest)
npm run build     # bygg produktionsversionen till dist/
npm run preview   # servera det byggda resultatet lokalt, inklusive PWA/offline-stöd
npm run lint      # kör linter (oxlint)
```

## Publicera en ny version

Varje push till `main` bygger och publicerar appen automatiskt till GitHub
Pages via `.github/workflows/deploy.yml` — inget manuellt steg behövs.
Status för senaste publiceringen syns under repots **Actions**-flik.

## Mer information

- [`CLAUDE.md`](CLAUDE.md) — kravspec och arbetssätt för projektet.
- [`docs/architecture.md`](docs/architecture.md) — teknisk arkitektur, beslut
  och byggordning.
