# Golf-poängräknare — arkitektur- och implementationsplan

## Context

Projektet är helt tomt (bara `CLAUDE.md` och `README.md`). Detta är en nystart av en
mobilanpassad PWA för att räkna golfpoäng med kompisar, enligt kravspecen i `CLAUDE.md`.
Målet med denna plan är att låsa arkitekturen och alla regelval **innan** någon kod
skrivs, så att poängmotorn och UI:t byggs rätt från start utan att gissa på golfregler.

Alla öppna frågor i `CLAUDE.md` är nu beslutade tillsammans med användaren (se nedan).
Denna fil kompletterar `CLAUDE.md` (krav) med *varför* arkitekturen ser ut som den gör.

## Beslutade öppna frågor

| Fråga | Beslut |
|---|---|
| Hur registrerar kompisar score? | **En markör per runda** matar in allas slag på sin telefon. Ingen delning mellan telefoner i v1. |
| Handicapslag fullt ut eller relativt? | **Fullt ut** — varje spelares eget spelhandicap/hålindex avgör, oberoende av övriga spelare. |
| Totalpoäng bästboll/sämstboll över rundor? | **Båda**: visas per spelare OCH per lagpar (filtrerbart), eftersom lag kan skifta mellan rundor. |
| Avrundning av decimal-handicap utan slope/CR? | **Standardavrundning** (`Math.round`-beteende: 11,5→12, -2,5→-2). |
| Oavgjort i totalstatistik/Köpenhamn-rundsegrare? | **Full "vinst" till båda** vid delad seger (ej 0,5 var). |
| "Denna säsong"-filter i Total-fliken? | **Fritt datumintervall** (inget hårdkodat säsongsdatum, bara "i år"/"senaste 30 dagarna" som genvägar). |
| Var ligger export/import + banredigering i navigeringen? | **Fjärde flik "Inställningar"** (bredvid Runda/Historik/Total). |
| GitHub-access för Claude? | Claude jobbar lokalt i klonen, gör små commits; användaren pushar själv till `main`. Ingen token/inloggning behövs. |

Kvarstående icke-blockerande antaganden (dokumenteras, inte frågade, eftersom de inte
är golfregler utan ren implementationsdetalj):
- Oavgjord delmatch i bästboll/sämstboll ger 0 poäng till båda lag (CLAUDE.md:s
  uttalade default). Den alternativa inställningen byggs inte förrän en konkret regel
  efterfrågas.
- En "avbruten runda" sparas aldrig i historiken — den ligger kvar som `inProgressRound`
  tills den antingen färdigställs eller skrivs över av en ny runda. Enhetstester
  säkerställer bara att poängmotorn inte kraschar på en ofullständig runda.
- GitHub Pages-publicering sker via **GitHub Actions** (auto-deploy vid push till
  `main`) snarare än manuell `gh-pages`-paket-publicering, eftersom det inte kräver
  något manuellt steg efter varje release.

## Arkitektur

### Mappstruktur

Kärnprincipen: **engine (ren logik) / storage (persistens) / components (UI)** är
separata lager utan beroenden uppåt. Poängmotorn ska gå att testa helt utan React/DOM/
localStorage.

```
src/
  domain/types.ts            # Course, Tee, Player, Round, HoleScore, ...
  engine/
    handicap.ts + handicap.test.ts
    roundResult.ts            # format-oberoende aggregator
    formats/
      types.ts                # GameFormatModule<TSettings> — plugin-gränssnittet
      registry.ts             # id -> modul
      bestBallWorstBall.ts + .test.ts
      copenhagen.ts + .test.ts   # fas 2
  data/courses.json            # frösådd banor, verbatim från CLAUDE.md
  storage/
    schema.ts, storage.ts, exportImport.ts
    roundRepository.ts, playerRepository.ts, courseRepository.ts, settingsRepository.ts
  components/
    layout/TabBar.tsx
    setup/CourseSelect.tsx, TeeSelect.tsx, FormatSelect.tsx, PlayerSetup.tsx, FormatSettingsForm.tsx
    round/HoleEntry.tsx, PlayerScoreRow.tsx, Scorecard.tsx
    history/HistoryList.tsx, HistoryDetail.tsx
    totals/TotalsView.tsx
    settings/SettingsView.tsx   # export/import + banredigering (4:e fliken)
    common/ConfirmDialog.tsx
  App.tsx, main.tsx
```

Ingen router — `App.tsx` håller `activeTab` i state och renderar villkorligt. Enklare
än React Router för en 4-flikad SPA.

### Domäntyper (`src/domain/types.ts`)

```ts
type TeeId = 'blue' | 'red' | 'white' | 'yellow';

interface Tee { id: TeeId; label: string; lengthMeters?: number; slope?: number; courseRating?: number; }
interface Course { id: string; club: string; name: string; holes: number; par: number[]; index: number[]; tees: Tee[]; }
interface PlayerRosterEntry { id: string; name: string; defaultHandicap?: number; }

interface RoundPlayer {
  playerId: string;
  name: string;                       // snapshot — överlever namnbyten i rosterlistan
  exactHandicapUsed: number | null;    // null = scratch för denna spelare
  teamId?: 'A' | 'B';                  // bara när format.usesTeams
}

interface HoleScore { hole: number; strokesByPlayer: Record<string, number | null>; }

interface Round {
  id: string; courseId: string; teeId: TeeId; formatId: string;
  scratch: boolean;
  players: RoundPlayer[];
  holeScores: HoleScore[];
  settings: unknown;                   // ägs av respektive format-modul
  status: 'in_progress' | 'completed';
  startedAt: string; completedAt?: string; currentHole?: number;
}
```

**Designbeslut:** `Round` lagrar bara råa inmatningar (slag, handicap-vid-tillfället,
inställningar). Resultat (poäng, netto, vinnare) cachas **aldrig** på rundan — de
räknas alltid fram på nytt via `engine/roundResult.ts`. Det gör att en framtida
regelfix automatiskt "lagar" gammal historik, och tar bort en hel klass av
cache-blir-inaktuell-buggar. Kostnaden är försumbar (18 hål).

### Spelformers plugin-gränssnitt (`src/engine/formats/types.ts`)

```ts
interface HoleStrokeInput {
  hole: number; par: number; index: number;
  strokesByPlayer: Record<string, number | null>;
  handicapStrokesByPlayer: Record<string, number>;   // förberäknat, 0 vid scratch
}
interface HolePointsResult {
  hole: number; complete: boolean;
  pointsByPlayer?: Record<string, number>;
  pointsByTeam?: Record<'A' | 'B', number>;
  detail?: unknown;
}
interface RoundTotals {
  pointsByPlayer?: Record<string, number>;
  pointsByTeam?: Record<'A' | 'B', number>;
  winnerPlayerIds?: string[];      // delad seger -> flera id
  winnerTeam?: 'A' | 'B' | 'tie';
}
interface GameFormatModule<TSettings> {
  id: string; label: string; playerCount: number; usesTeams: boolean;
  defaultSettings: TSettings;
  computeHolePoints(input: HoleStrokeInput, settings: TSettings, players: RoundPlayer[]): HolePointsResult;
  computeRoundTotals(holeResults: HolePointsResult[], players: RoundPlayer[]): RoundTotals;
}
```

Formatmodulen känner **inte** till handicapberäkning — `handicapStrokesByPlayer`
kommer förberäknat. Ren separation mellan "hur många slag får jag" (format-oberoende)
och "vem vinner hålet givet nettoscore" (format-specifikt).

`registry.ts`: `{ bestBallWorstBall, copenhagen }` — att lägga till Stableford senare
innebär en ny fil + en registerrad, inget annat ändras.

- **`bestBallWorstBall.ts`**: settings `{ bestBallPoints: number; worstBallPoints: number }`
  (default 1/1). Ofullständig tills alla 4 spelares slag finns. Bästboll: lägst
  `min(nettoTeamA)` vs `min(nettoTeamB)` vinner; sämstboll: lägst `max(...)` vs
  `max(...)` vinner. Oavgjort = 0 poäng till båda.
- **`copenhagen.ts`** (fas 2): ingen inställning. Ofullständig tills alla 3 spelares
  slag finns. Rangordna netto, dela ut 4/2/0, med specialfallen 3/3/0, 4/1/1, 2/2/2 vid
  delning. Summeras över 18 hål, delad seger vid lika totalsumma.

### Handicapmotor (`src/engine/handicap.ts`)

```ts
function playingHandicap(exactHandicap: number, tee: Tee, coursePar: number): number {
  if (tee.slope != null && tee.courseRating != null) {
    return Math.round(exactHandicap * tee.slope / 113 + (tee.courseRating - coursePar));
  }
  return Math.round(exactHandicap);   // beslutad avrundningsregel
}

function strokesOnHole(playingHcp: number, holeIndex: number, holesCount = 18): number {
  const base = Math.floor(playingHcp / holesCount);
  const remainder = playingHcp - base * holesCount;     // matematisk mod, alltid i [0, holesCount)
  return base + (holeIndex <= remainder ? 1 : 0);
}
```

Verifierat för negativt handicap: `h=-5` → `base=-1`, `remainder=13` → index 1–13 får
`0` slag, index 14–18 (de lättaste) får `-1` slag. Summa = -5. Matchar "plushandicap
ger tillbaka slag på de lättaste hålen".

**Testmatris (`handicap.test.ts`)** — täcker alla kantfall CLAUDE.md kräver:
- Invariant-test: för `h` i -20..40, `sum(strokesOnHole(h, idx) för idx 1..18) === h`.
- `h=0` → alla hål 0. `h=9` → index 1–9 får 1, 10–18 får 0. `h=18` → alla får 1.
  `h=19` → index 1 får 2, övriga 1. `h=36` → alla får 2. `h=-5` → se ovan (explicit).
- Gränsvärden: `index=1` och `index=18` explicit vid t.ex. `h=10`.
- `playingHandicap`: utan slope/CR → avrundat exakt handicap (inkl. negativt och
  halvtal); med slope/CR → formeln; slope finns men CR saknas (eller tvärtom) →
  faller tillbaka till enkla regeln (explicit test — CLAUDE.md kräver båda ifyllda).
- Scratch-läge: `computeHandicapStrokes(..., { scratch: true })` ger alltid 0,
  oavsett handicap.

### Lagring (`src/storage/`)

Ett enda localStorage-nyckel-objekt (`golf-team-game:v1`) — enklare än flera nycklar,
undviker inkonsistens vid delvisa skrivningar, gör export/import trivialt.

```ts
interface AppStorage {
  schemaVersion: 1;
  courses: Course[];               // frösådd från data/courses.json, sen användarredigerbar
  players: PlayerRosterEntry[];
  formatSettings: Record<string, unknown>;   // senast använda inställningar per format
  roundsHistory: Round[];
  inProgressRound: Round | null;    // exakt en i taget — matchar "en markör"-modellen
}
```

- `storage.ts`: `loadStorage()`/`saveStorage()` + migration på `schemaVersion`,
  try/catch för `QuotaExceededError`.
- Repositories (`roundRepository.ts` m.fl.) kapslar typad get/upsert/delete —
  komponenter rör aldrig rå `localStorage`/JSON.
- **Autosave:** varje +/- eller inställningsändring under en pågående runda sparar
  direkt (ingen debounce behövs för den datastorleken).
- **Avsluta runda:** "Spara till historik och starta ny runda" sätter
  `status: 'completed'`, flyttar till `roundsHistory`, tömmer `inProgressRound`.
- **Export/import** (`exportImport.ts`): export = `JSON.stringify(loadStorage())` —
  hela AppStorage-objektet, så allt (banor, spelare, historik, pågående runda,
  inställningar) följer med automatiskt. Import validerar `schemaVersion` + förväntade
  fält, visar bekräftelsedialog ("Detta skriver över all nuvarande data — fortsätt?"),
  skriver och laddar om.

### UI-struktur (v1)

`App.tsx` håller `activeTab: 'runda' | 'historik' | 'total' | 'installningar'`.

- **Runda:** ingen pågående runda → uppsättningsflöde (bana → tee → spelform →
  spelare/handicap/lag → formatinställningar → "Starta runda"). Pågående runda →
  `HoleEntry` (hålnummer/par/index, stora +/- per spelare med handicap-badge, löpande
  hålresultat) + länk till `Scorecard` (full hål×spelare-tabell, ut/in/totalt,
  par/index-rader, hålindex redigerbart). Tryck på tidigare hål i scorekortet hoppar
  tillbaka för att rätta. "Spara till historik" aktiveras när alla hål är kompletta.
- **Historik:** `HistoryList` (nyast först) → `HistoryDetail` (scorekort + poäng per
  hål, alltid live-beräknat, aldrig cachat) → radera med bekräftelse.
- **Total:** formatfilter, fritt datumintervall-filter; för bästboll/sämstboll växling
  "Per spelare" / "Per lagpar"; för Köpenhamn per-spelare-totaler + vinstantal.
- **Inställningar (4:e fliken):** export/import av all data (JSON), redigering av
  bandata/hålindex.

## Byggordning (motor+test först, varje steg en liten commit)

1. Scaffold Vite+React+TS, verifiera `npm run dev`.
2. Lägg till Vitest, ett sanity-test.
3. `domain/types.ts`.
4. `engine/handicap.ts` + hela testmatrisen ovan.
5. `engine/formats/types.ts` + `bestBallWorstBall.ts` + tester (oavgjort, saknade
   slag, olika poänginställningar, samspel med handicap).
6. `engine/roundResult.ts` + tester för pågående/ofullständig runda.
7. `data/courses.json` (Barsebäck Ocean + Pine, verbatim) + loader + shape-test.
8. `storage/`-lagret + tester (förstagångsdefault, spara/ladda round-trip,
   korrupt-data-fallback, export/import round-trip).
9. `vite-plugin-pwa` + manifest + offline-precache, verifierat med `vite preview` utan nät.
10. `App.tsx` + `TabBar` + tomma flikar.
11. Rondens uppsättningsflöde.
12. Hålinmatningsskärm kopplad till motorerna + autosave.
13. Scorekortsvy (+ tryck-för-att-rätta).
14. Avsluta-runda-flöde.
15. Historik-flik.
16. Total-flik.
17. Export/import + banredigering i Inställningar-fliken.
18. GitHub Pages-publicering (se nedan).
19. Manuell kontroll: öppna på telefon, lägg till på hemskärm, spela en låtsasrunda med wifi av.
20. *Fas 2, senare:* Köpenhamn-modul + tester, sen dess UI via samma
    HoleEntry/Scorecard/Total-infrastruktur genom registret.

Varje steg 1–18 avslutas med en liten, beskrivande commit (lokalt — användaren pushar
till `main` själv).

## GitHub Pages-publicering

Via **GitHub Actions** (auto-deploy vid push till `main`, inget manuellt steg per release):

1. `vite.config.ts`: `base: '/golf-team-game/'`.
2. `.github/workflows/deploy.yml`: checkout → setup-node → `npm ci` → `npm run build` →
   `actions/upload-pages-artifact` (path `dist`) → `actions/deploy-pages`
   (`permissions: pages: write, id-token: write`, `environment: github-pages`).
3. Repo Settings → Pages → Source: "GitHub Actions".
4. Första push till `main` publicerar på `https://megaman3.github.io/golf-team-game/`.
5. PWA: `manifest.start_url`/`scope` matchar `/golf-team-game/`;
   `vite-plugin-pwa` ärver Vites `base`. `registerType: 'autoUpdate'` så att redan
   hemskärms-installerade appar hämtar ny version nästa gång de har nät.
6. Nya versioner efter v1: bara push/merge till `main` — workflowet bygger och
   publicerar om automatiskt.

## Verifiering

- `npm run test` (Vitest) grön för hela testmatrisen i steg 4–8 innan UI börjar byggas.
- Manuellt i browser: spela en full 18-hålsrunda för bästboll/sämstboll med minst ett
  oavgjort hål, ett scratch-läge, ett handicap > 18 och ett negativt handicap — jämför
  resultat för hand mot reglerna i CLAUDE.md.
- PWA-check: `vite preview`, stäng av nätet, ladda om — appen ska fortfarande fungera
  och en pågående runda ska överleva en app-stängning/omstart.
- Efter GitHub Pages-steget: öppna den publicerade URL:en på en mobil, lägg till på
  hemskärmen, bekräfta att export/import fungerar (ladda ner JSON, radera
  localStorage via dev tools, importera tillbaka, data finns kvar).

### Kritiska filer
- `src/engine/handicap.ts`
- `src/engine/formats/types.ts`
- `src/engine/formats/bestBallWorstBall.ts`
- `src/domain/types.ts`
- `src/storage/schema.ts`
- `src/data/courses.json`
