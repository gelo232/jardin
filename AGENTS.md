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

1. **Programme** — « Aujourd'hui » : tâches priorisées météo + journal, **groupées en
   sections repliables** (`progBlock`/`toggleProg`, état dans `localStorage` clé `progFold`,
   réutilise le style `.cat` des catégories Plantes) : 💧 Arrosage, ⚗️ Fertilisation,
   🌿 Soins & phases, 🔎 Inspection, + 🔎 À vérifier · solutions. Bascule « 2 semaines »
   (agenda 14 j sur prévisions réelles, recalculé à chaque ouverture, décale les
   fertilisations hors des jours de pluie). **Liens Programme → fiche plante** :
   `focusPlant(id)` (ligne mono-plante cliquable + `plantLink()` sur chaque nom dans les
   listes multi-plantes) ouvre l'onglet Plantes, déplie la catégorie parente, ouvre la fiche
   (accordéon), centre la page dessus (`scrollIntoView` block:center) et la surligne
   (`.card.flash`).
2. **Plantes** — **13 cultures + arbustes déco** suivis, regroupés en **catégories
   repliables** (`CATEGORIES`, état d'ouverture mémorisé dans `localStorage` clé `catFold`).
   Fiches en **accordéon** : une seule ouverte à la fois (`toggle`/`openPlant`).
   Chaque fiche : jauge de stade, temps par phase, arrosage, recette d'engrais calculée,
   **« À vérifier → solution »** (champ `checks` par plante), surveillance, entretien,
   boutons « Fertilisé / Arrosé ». **Plantes ornementales** (`ornamental:true`, ex. `buis`) :
   fiche dédiée `ornamentalBody()` sans jauge ni recette, axée reprise/choc de
   transplantation ; exclues du Doseur (`fillMixSelect`) et des rappels d'engrais.
3. **Inspection** — saisie de l'état réel d'une plante (`INSP_FIELDS`) → moteur de
   diagnostic (`DIAG`, `diagnose()`) → **réajustement automatique du programme**. Voir §4bis.
   Contient aussi la **corbeille** (plants retirés, restauration).
4. **Semis** — bascule « En pleine terre » (`SOW`) / « En intérieur » (`INDOOR`),
   calées sur le gel + section « pourquoi les poivrons n'ont pas germé ».
5. **Doseur** — volume d'arrosoir libre **+ unité sélectionnable** (L / gal US / gal imp.,
   `state.canUnit`, table `UNITS`, converti en litres via `canLiters()`) → grammes exacts
   de chaque sel + NPK résultant.
6. **Journal** — historique `localStorage` des arrosages/fertilisations, base des rappels.
   Section **Sauvegarde** : `exportData()` / `importData()` (JSON portable des données).

## 4bis. Inspection → diagnostic → réajustement (⚠️ prime sur le calendrier)

- **Saisie** (`INSP_FIELDS`) : date, hauteur, **stade observé**, vigueur, couleur du feuillage,
  signes visibles (multi-choix), sol à 3–5 cm, **racines**, origine (semis direct / repiqué),
  heures de soleil mesurées, ravageurs, notes. Stockée dans `state.insp[id]` (dernière) et
  `state.inspLog` (historique, sert à calculer `growthRate()` = cm/semaine mesurés).
- **Moteur** (`DIAG` → `diagnose()` → `dg()` mémoïsé → `adj()`) : chaque règle porte
  `sev` (3 bloquant / 2 à corriger / 1 bénin), `cause`, `why` (explication factuelle),
  `fix[]`, `src` (**source obligatoire**) et `adj` (effet sur le programme).
  **Règle de rigueur : un symptôme bénin est annoncé comme bénin et ne change RIEN**
  (ex. `fentes_vent` : fentes longitudinales = vent/sénescence, surtout pas une carence).
  Fusion des effets : la cause la plus grave impose la recette ; `waterDelta` retient la
  **magnitude maximale** (pas la somme — deux causes corrélées doubleraient la correction) ;
  `feedDelta` s'additionne, borné ±6 ; `feedHold` = suspension d'engrais en jours.
- **Points d'application** (tout le reste en découle) : `curStage()` (stade observé >
  calendrier), `stageSince()` (daté de l'observation), `curRecipe()` vs `baseRecipe()`,
  `waterEvery()` vs `baseWaterEvery()`, `feedDaysOf()`, `feedHoldUntil()`. Le Programme,
  le plan 14 j, la fiche plante et le Doseur lisent ces fonctions → un enregistrement
  d'inspection met à jour l'app entière.
- **`frostOutlook()`** : jours de cycle restants vs `daysToFrost()` → dit franchement si la
  culture peut encore aboutir. Sert à ne pas entretenir de faux espoirs.
- **Suppression de plant** : `state.removed` + `isRemoved()` / `activePlants()`.
  **Réversible et non destructive** — le plant sort du Programme / plan / Doseur / Plantes,
  mais `byId()` continue de le résoudre et son journal + ses inspections sont conservés
  (restauration depuis l'onglet Inspection).

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
- **Volume de liquide par plante** : champ `vol` (str) = quantité d'eau par arrosage,
  factuel (capacités exactes des réservoirs ; ailleurs règle 2,5 cm/sem ≈ 25 L/m² et
  « jusqu'à écoulement », en ranges approx.). Affiché par `waterVolLine()` (section
  Arrosage) et `feedVolLine()` (section Engrais : volume de solution = un arrosage, ou
  demi-dose au réservoir pour les pots `selfWater`). Le Doseur ajoute aussi une note
  « À appliquer sur <plante> : … ».
- **Pots à réserve d'eau** (sub-irrigation par mèche) : champ `selfWater` = litres du
  réservoir (carotte 3, citron 3, ananas 1). Pour ces plantes : la fiche garde le texte
  d'arrosage **spécifique** de la plante (`p.water`) **plus** une note `reservoirWater()`
  qui précise le **mode** : verser dans le **réservoir** (tube de remplissage), **jamais sur
  les feuilles ni les copeaux** ; 2 exceptions par le haut = amorçage initial de la mèche +
  rinçage mensuel des sels (la sub-irrigation concentre les sels en surface → pointes brunes).
  Engrais possible dans l'eau du réservoir mais à **demi-dose** (+ rinçage). `waterFreqLine`
  affiche « réservoir à remplir, à tout moment » (pas de fenêtre horaire), et `renderToday`
  sépare ces plantes (tâche 🪣 « Réservoir à vérifier ») des plantes arrosées par le haut.
- **À vérifier → solution** (`checks` par plante = liste `{q, fix}`, factuel) : affiché
  dans chaque fiche plante **et** dans le Programme via `renderChecks()` (carte
  `#checkCard`, visible seulement en vue « Aujourd'hui »). Sources clés : trous feuilles
  cucurbitacées = chrysomèle rayée / altises / limaces, voile anti-insectes jusqu'à la
  floraison (UMN, USU, U. Illinois Ext.) ; tige tomate cassée mais reliée = attelle +
  tuteur, cicatrise 2–4 sem. ; tête tomate cassée/séchée = couper dans le sain + laisser un
  gourmand sous la cassure reprendre la dominance apicale (sources Ext. tomato). Ananas =
  sol acide impératif (l'ancien sol calcaire blanchâtre brunissait les feuilles), pas
  d'engrais 2–4 sem. après transplantation.
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
- **Arbustes déco (buis) — choc de transplantation** : sujets déterrés ~2 sem. à l'automne
  + redéplacés en été + 20-20-20 appliqué (contre-indiqué). Contenu factuel/sourcé : ne
  PAS fertiliser un arbuste stressé/transplanté (l'azote force un feuillage que les racines
  abîmées ne nourrissent pas, prolonge le choc, brûle les racines — U. Maryland, U. Kentucky,
  Morton Arb., UGA) ; test de l'ongle (cambium vert = vivant) ; eau profonde ≈ 2,5 cm/sem.
  sans détremper ; paillis ; récup ≈ 1 an/pouce de tronc ; seuil remplacement > 50 % de
  bois mort (replanter à l'automne).
- **Persistance `localStorage`** (helper `store`) : `can`, `canUnit`, `coords`, `feeds`,
  `waters`, `logs`, `wxCache`, `catFold`, `progFold`. Les données **survivent aux mises à jour** (le
  SW ne touche pas `localStorage` ; le chargement utilise des défauts → ajouter une clé ne
  réinitialise rien). Export/import JSON dans le Journal pour transfert/sauvegarde
  (inclut `catFold` **et** `progFold` ; l'import rafraîchit aussi le plan 14 j).
- **Météo** : `fetch` open-meteo (sans clé), position par défaut Montréal
  (45.5019, -73.5674) ; `askLocation()` utilise la géoloc.

## 5. Workflow de mise à jour ⚠️

1. Éditer `index.html`.
2. **Incrémenter `CACHE` dans `sw.js`** (actuellement `jardin-v19`) — sinon les clients
   gardent l'ancienne version en cache.
3. `git -C "D:\KGW\Afronim\jardin-app" add -A && commit && push`. GitHub Pages se
   reconstruit en ~1 min.

> Note de déploiement initial (Claude Code) : fait sans `gh`, token GitHub récupéré via
> Git Credential Manager puis API REST (créer le repo + activer Pages). Bash sandbox sans
> réseau ; PowerShell a le réseau.
