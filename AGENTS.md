# AGENTS.md — PWA « Jardin »

> Mémoire de projet transférée depuis Claude Code (session d'origine
> `200b4e65-c183-473b-bfce-4573285c3a80`, projet `resume-tailoring`).
> Langue de travail : **français**. Utilisateur : Willy (Montréal, zone 5b).

Assistant d'entretien de jardin **mobile, installable (PWA)**, qui propose des actions
selon la météo et la phase de chaque plante, pour un jardinier utilisant des **sels
d'engrais purs** (approche précision / hydroponique).

---

## 1. Emplacement & déploiement

- **Source** : `D:\KGW\Afronim\jardin-app\` (déplacée depuis `C:\Users\perso\Downloads\jardin-app\`).
- **Git** : remote `origin` = `https://github.com/gelo232/jardin.git` (public), branche `main`.
- **En ligne** : https://gelo232.github.io/jardin/ (GitHub Pages, branche `main`, racine `/`). Déployé le 2026-06-27.

## 2. Stack

Un seul **`index.html`** (HTML + CSS + JS vanilla, **aucun build**), accompagné de :
`sw.js` (service worker hors-ligne), `manifest.webmanifest`, `bootstrap-icons.woff2`
(police d'icônes embarquée localement, ~6 glyphes), `icon-192.png` / `icon-512.png`,
et `make-icons.js` (régénère les icônes via `node make-icons.js`).

**Thème** recalé sur kgw.afronim.com : navy `#10172e` / `#1c2341` + cyan `#6ec6d8` +
bleu « sel » `#6f97e0`, police **Montserrat**, **Bootstrap Icons**. (Contexte d'origine
et historique du thème dans `Downloads/HANDOFF.md`.)

## 3. Onglets (barre du bas)

1. **Programme** — « Aujourd'hui » (tâches priorisées météo + journal) et bascule
   « 2 semaines » (agenda 14 j sur prévisions réelles, recalculé à chaque ouverture,
   décale les fertilisations hors des jours de pluie).
2. **Plantes** — **13 cultures** suivies, regroupées en **catégories repliables**
   (`CATEGORIES`, état d'ouverture mémorisé dans `localStorage` clé `catFold`). Chaque
   fiche : jauge de stade, temps par phase, arrosage, recette d'engrais calculée,
   surveillance, entretien, boutons « Fertilisé / Arrosé ».
3. **Semis** — bascule « En pleine terre » (`SOW`) / « En intérieur » (`INDOOR`),
   calées sur le gel + section « pourquoi les poivrons n'ont pas germé ».
4. **Doseur** — volume d'arrosoir libre → grammes exacts de chaque sel + NPK résultant.
5. **Journal** — historique `localStorage` des arrosages/fertilisations, base des rappels.

## 4. Logique métier (datasets clés)

- **Phase auto-calculée** : `autoPhase()` à partir de `SOW_DATE` (dates de semis réelles)
  + `STAGE_DUR` (jours/phase comptés depuis le semis). 100 % automatique, aucun bouton
  manuel. La phase courante donne le « temps restant avant la phase suivante ».
- **Contenu dynamique par phase** : map `PH` (une entrée par phase, `r` = recette).
  `phaseInfo()` / `curRecipe()` sont lus par le détail plante, le Doseur, Aujourd'hui
  et le plan. Recette `aucun` = phase maturation/repos (pas d'engrais).
- **Kit d'engrais** (sels purs, `PROD` / `SALTS`, fractions [N, P₂O₅, K₂O]) : urée 46-0-0,
  MAP 12-61-0, MKP 0-52-34, KCl 0-0-62, **sulfate de potassium 0-0-53 (+18 % S)** —
  utilisé pour agrumes/ananas/racine(ail)/fleur (K sans chlore + soufre). Fer chélaté
  Ferti-Lome = **correctif** (Fe/Zn/Mn/Cu EDTA), pas un engrais. Poudre Ca/Mg : appliquer
  SEULE (précipité avec MAP/MKP). Pas de KCl sur agrumes ni ananas (sensibles au chlore).
- **Arrosage météo-adaptatif** (`waterPlan`) : intervalle par phase (`WATER_EVERY`) ;
  pluie ≥ 5 mm / ≥ 60 % **reporte** le tour, ≥ 2 jours chauds le **resserrent**. Date du
  prochain tour recalculée quand l'utilisateur valide « ✓ Arrosé / Fertilisé ».
- **Moment opportun de la journée** (`actionTiming(kind)`, `careTimingKind`) : **toute**
  recommandation est proposée à l'heure factuellement optimale, selon l'heure locale + la
  chaleur du jour. Types : `water`, `feed`, `foliar`, `pollinate` (cucurbitacées), `corn`,
  `harvest` (herbes). Renvoie `{good, ic, short, verb, advice}`. Utilisé par `renderToday`
  (Programme), `waterFreqLine`/`feedFreqLine` et le flag foliaire des fiches plante. Le
  Programme se réévalue toutes les 5 min et au retour sur l'app (`visibilitychange`).
  **Bases factuelles sourcées** (commentaire au-dessus de `actionTiming`) : arrosage tôt
  le matin 5h30–9h (Iowa State Ext.) ; engrais sol 6–9h ou 16–19h sur sol humide, éviter
  >29 °C ; foliaire <9h30 ou >18h30 (stomates ouverts, anti-brûlure ; Univ. Missouri IPM,
  ICL) ; pollinisation cucurbitacées 6–10h (UF IFAS, ISHS) ; maïs 9–11h30 (Purdue, Univ.
  Wisconsin) ; récolte d'herbes le matin après la rosée (WSU Ext.). **Toute nouvelle
  recommandation doit rester factuelle/sourcée**, pas spéculative.
- **Repères gel Montréal** : dernier gel printanier ~3–9 mai ; premier gel d'automne
  **~7 oct** (`daysToFrost()`). Repiquage des cultures fragiles après le 20–25 mai.
- Tout a été semé par l'utilisateur fin mai–juin 2026 → melon/pastèque/maïs tardif en
  course contre le gel. Citronniers = **jeunes semis** (pas des fruitiers de 2 ans).
- **Persistance `localStorage`** (helper `store`) : `can`, `coords`, `feeds`, `waters`,
  `logs`, `wxCache`, `catFold`.
- **Météo** : `fetch` open-meteo (sans clé), position par défaut Montréal
  (45.5019, -73.5674) ; `askLocation()` utilise la géoloc.

## 5. Workflow de mise à jour ⚠️

1. Éditer `index.html`.
2. **Incrémenter `CACHE` dans `sw.js`** (actuellement `jardin-v12`) — sinon les clients
   gardent l'ancienne version en cache.
3. `git -C "D:\KGW\Afronim\jardin-app" add -A && commit && push`. GitHub Pages se
   reconstruit en ~1 min.

> Note de déploiement initial (Claude Code) : fait sans `gh`, token GitHub récupéré via
> Git Credential Manager puis API REST (créer le repo + activer Pages). Bash sandbox sans
> réseau ; PowerShell a le réseau.
