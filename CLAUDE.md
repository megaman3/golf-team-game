# Projekt: Golf-poängräknare

## Mål
En mobilanpassad webbapp jag använder på golfbanan för att räkna poäng i olika spelformer.
Första spelformen är bästboll/sämstboll (2 mot 2). Köpenhamare (Copenhagen) kommer direkt efter.
Fler spelformer ska kunna läggas till senare.

## Språk och användare
- Appens gränssnitt är på svenska.
- Jag är van vid test och Python/Java men inte frontend, så förklara val kort och bygg stegvis.

## Teknik (förslag, fråga innan du avviker)
- TypeScript + React + Vite, byggd som PWA så den fungerar på mobilen även med dålig täckning.
- Data sparas lokalt i webbläsaren (localStorage). Ingen inloggning, ingen server i version 1.
- Eftersom localStorage kan rensas: bygg en knapp för **export/import av all data som JSON** (backup).
- Poänglogiken ligger i ren, separat kod utan UI-beroenden och har enhetstester (Vitest).
- Git-projekt (GitHub). Små, tydliga commits med beskrivande meddelanden. Föreslå commit efter varje färdigt steg.

## Måste fungera utan Claude
Mina kompisar har inte Claude men ska kunna använda appen och registrera score. Därför gäller:
- Appen är en **vanlig, fristående webbapp**. Den får inte kräva Claude-konto, Claude-inloggning eller anrop till Claude/Anthropic-API för att fungera. Den får inte vara en Claude-artifact eller bero på Claude-specifika funktioner (som `window.claude` eller `window.storage`).
- Ingen inloggning, inga konton och ingen app-installation krävs. Man öppnar en länk i mobilens webbläsare. Appen kan valfritt läggas på hemskärmen (PWA).
- Appen hostas som en statisk sida på en gratis tjänst (förslag: GitHub Pages, eftersom koden redan ligger på GitHub). Föreslå och beskriv uppsättningen steg för steg, inklusive hur en ny version publiceras.
- Alla funktioner som poängräkning, banval, handicap, historik och totalpoäng ska fungera helt i webbläsaren, utan server.
- Claude används bara av mig för att utveckla appen, aldrig av användarna.
- Gör gränssnittet så enkelt att en person som aldrig sett appen kan mata in slag utan instruktioner.

### Öppen fråga: flera som matar in slag
I version 1 sparas data lokalt på den telefon som används. Det betyder att en person per runda är "markör" och matar in allas slag, och att kompisarnas telefoner inte delar historik automatiskt. Hjälp mig välja hur kompisarna ska kunna registrera score:
1. En markör per runda (enklast, version 1). Alla kan använda appen på sin egen telefon för egna rundor.
2. Dela en runda via länk eller QR-kod, där rundans data ligger i länken. Fungerar utan server men blir en kopia, inte live.
3. Live-delning där flera telefoner matar in slag samtidigt och ser samma ställning. Kräver en liten backend/databas (t.ex. en gratis molntjänst). Gör detta först senare och förklara kostnad och komplexitet innan vi väljer.

Förklara kort för- och nackdelar innan du bygger något av alternativen.

## Spelformer

### 1. Bästboll/sämstboll, 2 mot 2 (först)
Per hål jämförs lagen i två delmatcher:
- Bästboll: lagets lägsta netto mot motståndarlagets lägsta netto. Lägst vinner.
- Sämstboll: lagets högsta netto mot motståndarlagets högsta netto. Lägst vinner.
- Poäng per vinst är inställningsbart. Standard: bästboll 1 poäng, sämstboll 1 poäng. Ska kunna ändras till t.ex. bästboll 2 och sämstboll 1.
- Lika resultat i en delmatch: 0 poäng till båda lagen, om inte inställningen säger något annat.

### 2. Köpenhamare / Copenhagen (andra spelformen)
Tre spelare, var och en spelar för sig själv. Sex poäng delas ut per hål efter nettoresultat:
- Bäst 4 poäng, mitten 2 poäng, sämst 0 poäng.
- Två delar bästa resultatet: 3 · 3 · 0.
- Två delar andraplatsen: 4 · 1 · 1.
- Alla lika: 2 · 2 · 2.
- Poängen summeras över 18 hål. Högst summa vinner. Lika summa ger delad seger.
- Hålet räknas först när alla tre spelarnas slag är inmatade.

Ett exempel finns att titta på (en kompis har byggt en Copenhagen-app, den är bara inspiration för regler och funktioner. Kopiera inte koden rakt av, bygg vår egen version):
https://claude.ai/artifact/VrXaWq6B4VfktWayhkW1fW

Bra idéer från den appen att ta med:
- Två flikar: **Runda** (aktuellt hål + scorekort) och **Historik**.
- Per hål: stora +/- knappar per spelare för slag, tydlig visning av nettoslag och hur många handicapslag spelaren får på hålet.
- Scorekort med ut/in/totalt, par och index synliga.
- "Spara till historik och starta ny runda" när alla 18 hål är klara. Det ska gå att gå tillbaka och rätta ett tidigare hål.
- Rekord per spelare på namn, så att laguppställningen kan ändras mellan rundor.

## Funktionskrav, version 1
1. Välj bana ur en banlista. Antal hål, par och hålens index (HCP-nyckel) läses in automatiskt från bandatan.
2. Välj tee (blå, röd, vit eller gul).
3. Lägg till spelare (2 mot 2 för bästboll/sämstboll, 3 för Köpenhamare). För varje spelare matas **exakt handicap** in.
4. Appen räknar ut spelhandicap och fördelar handicapslag på hålen enligt hålindex.
5. Mata in antal slag per spelare och hål. Appen räknar nettoresultat.
6. Visa löpande ställning per hål och totalt.
7. Spara pågående rond automatiskt så att den överlever att appen stängs.
8. Det ska gå att spela utan handicap (scratch) som ett val.

## Handicap och slag
- Version 1: använd exakt handicap avrundat till heltal som spelhandicap. Det räcker för att komma igång och är samma som i exempelappen.
- Slag per hål: `floor(h / 18) + (index <= h % 18 ? 1 : 0)`. Lägst index får första slaget. Plushandicap (negativt) ger tillbaka slag på de lättaste hålen. Skriv enhetstester för h = 0, 9, 18, 19, 36 och negativa värden.
- Slope och Course Rating är **valfria fält per tee** i bandatan. Är de ifyllda kan appen räkna: `spelhandicap = exakt handicap × slope / 113 + (course rating − par)`, avrundat. Är de tomma används exakt handicap enligt ovan.
- **Hitta inte på slope eller course rating.** Värdena finns inte på golfisverige.com. Jag matar in dem själv från scorekortet eller klubben, så lämna dem tomma tills jag ger dem.
- Fråga mig om slagen ska räknas fullt ut för alla spelare, eller relativt spelaren med lägst handicap.

## Bandata
Banorna ligger i en lokal JSON-fil, t.ex. `src/data/courses.json`, och det ska vara enkelt att lägga till fler. Per bana: namn, antal hål, par per hål, index per hål och tees (med valfri slope och course rating). Det ska också gå att lägga till en bana i appen utan att ändra kod.

Källa: scorekorten på https://www.golfisverige.com/klubb/barseback-golf-resort/ (klicka på "Visa Scorekort" för varje bana). Sidan visar längd, par och index för blå, röd, vit och gul tee, men **ingen slope eller course rating**.

### Barsebäck Golf & Resort, Ocean Course (par 73)
- Par per hål 1–18: 4,4,4,3,5,4,4,3,5,4,4,5,4,4,3,5,4,4
- Index per hål 1–18: 3,17,11,7,15,5,1,13,9,8,4,18,12,6,14,16,2,10
- Total längd (m): blå 5586, röd 5170, vit 6482, gul 6077

### Barsebäck Golf & Resort, Pine Course (par 71)
- Par per hål 1–18: 4,4,3,5,4,3,4,5,4,4,4,4,3,4,3,5,4,4
- Index per hål 1–18: 11,7,17,9,3,13,1,15,5,14,6,10,16,2,18,12,4,8
- Total längd (m): blå 5269, röd 4760, vit 5846, gul 5542

Notera: exempelappen har andra index för Ocean Course än scorekortet på golfisverige. Pine stämmer överens. Använd golfisverige som standard, men jag kontrollerar mot det fysiska scorekortet innan vi litar på Ocean-indexen. Gör index redigerbara i appen.

## Historik och totalpoäng
Jag spelar flera matcher mot samma personer och vill följa resultaten över tid.
- **Historik:** varje avslutad runda sparas med datum, bana, tee, spelform, spelare, handicap vid tillfället, slag per hål, poäng per hål och slutresultat. Rundorna visas i en lista, nyast först. Öppna en runda för att se hela scorekortet. Det ska gå att radera en runda i historiken (med bekräftelse).
- **Total poängräkning:** en flik som summerar poäng och antal vunna matcher per spelare över alla rundor, och som kan filtreras per spelform och per tidsperiod (t.ex. denna säsong).
- För bästboll/sämstboll spelar jag i lag och lagen kan skifta mellan rundor. Fråga mig hur totalen ska räknas (per spelare eller per lagpar) innan du bygger den.
- Spelarnas rekord kopplas till namn, inte till plats i listan.

## Ej i version 1 (men bygg så att det går att lägga till)
- Fler spelformer (t.ex. Stableford, skins). Använd ett gemensamt gränssnitt för spelformer så att varje spelform har egen poängfunktion och egna inställningar.
- Automatisk hämtning av handicap från golf.se (inloggning). Gör handicap-inmatningen så att källan kan bytas senare.
- Automatisk hämtning av bandata från externa källor.
- Live-delning där flera personer matar in slag samtidigt på olika telefoner (kräver backend). Se avsnittet "Måste fungera utan Claude".

## Arbetssätt
- Börja med en kort plan och be mig bekräfta den innan du skriver kod.
- Bygg poängmotorn och dess tester först, sedan gränssnittet.
- Skriv testfall för kantfall: lika resultat, handicap större än 18, plushandicap, spelare utan resultat på ett hål, avbruten runda.
- Fråga hellre än gissa när en regel är oklar. Hitta inte på golfregler eller banvärden.
