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
2. **Plantes** — plantations suivies, regroupées en **catégories repliables** dérivées de la
   FAMILLE de l'espèce (`CAT_ORDER`, état d'ouverture mémorisé dans `localStorage` clé
   `catFold`). Le bandeau compte les plantations et les cultures au catalogue — plus de
   nombre figé, le catalogue s'enrichit depuis l'app (voir « Ajouter une culture »).
   Fiches en **accordéon** : une seule ouverte à la fois (`toggle`/`openPlant`).
   Chaque fiche : jauge de stade, temps par phase, arrosage, recette d'engrais calculée,
   **« À vérifier → solution »** (champ `checks` par plante), surveillance, entretien,
   boutons « Fertilisé / Arrosé ». **Plantes ornementales** (`ornamental:true`, ex. `buis`) :
   fiche dédiée `ornamentalBody()` sans jauge ni recette, axée reprise/choc de
   transplantation ; exclues du Doseur (`fillMixSelect`) et des rappels d'engrais.
3. **Inspection** — saisie de l'état réel d'une plante (`INSP_FIELDS`) → moteur de
   diagnostic (`DIAG`, `diagnose()`) → **réajustement automatique du programme**. Voir §4bis.
   Contient aussi la **corbeille** (plants retirés, restauration).
4. **Saison** (ex-Semis) — 3 volets (`setSeasonPane`, état `seasonPane`) :
   🌱 **Semis** (contenu d'origine : `SOW` / `INDOOR`, gel, poivrons) ·
   🧪 **Sol** (température du sol à 6 cm, parcelles avec pH + date de test + matière
   organique, diagnostic pH `phVerdict`, calendrier `AMEND`, principes du sol vivant) ·
   🔄 **Rotation** (historique par parcelle, alerte `rotWarnings`, familles `FAM`).
5. **Doseur** — volume d'arrosoir libre **+ unité sélectionnable** (L / gal US / gal imp.,
   `state.canUnit`, table `UNITS`, converti en litres via `canLiters()`) → grammes exacts
   de chaque sel + NPK résultant.
6. **Journal** — historique `localStorage` des arrosages/fertilisations, base des rappels.
   Section **Sauvegarde** : `exportData()` / `importData()` (JSON portable des données).

## 4pre. Pièges relevés en audit (⚠️ à ne pas réintroduire)
- **Propagation d'événement dans une carte cliquable.** `.card.plant` porte
  `onclick="toggle(id)"` sur TOUT le bloc : n'importe quel élément interactif ajouté à
  l'intérieur (bouton, `<summary>`, champ) doit couper la propagation, sinon il referme la
  fiche au lieu d'agir. Pour un `<details>`, poser `onclick="event.stopPropagation()"` sur le
  **`<summary>`**, jamais sur le `<details>` (cela bloquerait aussi les boutons internes).
  Même règle pour `.task.clickable`.
- **Symbole supprimé lors d'un refactor mais encore référencé.** `CATEGORIES` avait disparu
  au profit de `CAT_ORDER` : `focusPlant()` levait une ReferenceError et TOUS les liens
  « Programme → fiche plante » étaient morts, sans message visible. Après un refactor,
  balayer les identifiants non définis (en retirant chaînes et commentaires, sinon le texte
  français noie le résultat).
- **Tables héritées** (`STAGE_DUR`, `SOW_DATE`, `WATER_EVERY`, `RESOW`, `POLLEN`, `CAMG`,
  `PH_OPT`, `N_TARGET`, `PLANT_FAM`, `PLANT_ARCH`, `PEREN`) : indexées par les ids d'origine.
  Une plantation créée dans l'app a un id `plN` qui n'y figure pas → toujours passer par
  l'objet résolu (`p.resow`, `p.pollen`, …), jamais par `TABLE[p.id]`.
- **Sélecteurs de cases à cocher** : les marqueurs de phase portent `data-mark`. Toute
  manipulation groupée des `.chk input` doit les exclure (`:not([data-mark])`), sinon on
  efface les observations de stade et la phase retombe au calendrier.
- **Source unique du rattachement** : `pl.bed`. `state.plantBed` n'est plus qu'un vestige lu
  à la migration ; ne jamais y réécrire, il divergeait dès qu'une plantation était modifiée
  autrement que par `assignPlant()`.
- **Deux prédictions de fin de cycle** coexistent : `varietyOutlook()` (jours à maturité
  réels, **prioritaire**) et `frostOutlook()` (modèle générique de phases, repli et seul à
  intégrer le retard constaté). L'interface annonce laquelle fait foi et signale une
  divergence — ne jamais les afficher côte à côte sans arbitrage.
- **Fonction définie mais jamais appelée = règle non appliquée.** `windOK()` documentait un
  seuil de 12 km/h que rien n'utilisait pendant que `renderWeather` en appliquait un de 20.
- **Export/import** : toute nouvelle clé d'état doit figurer dans `exportData()` ET être
  relue dans `importData()`. Vérifier les deux sens.
- **Duplication d'une plantation** : conserver la parcelle d'origine, sinon la copie hérite
  de la configuration par défaut (terre / aucune couverture / drainage).

### ⚠️ Listes déroulantes — six pièges, tous rencontrés en vrai
1. **`color-scheme:dark` sur `:root` est OBLIGATOIRE.** L'interface est sombre mais la page se
   déclarait claire : le navigateur dessinait tous ses widgets natifs en clair — liste
   déroulante des `<select>`, calendrier des `<input type=date>`, flèches des `type=number`,
   barres de défilement. Le texte des options héritant de la couleur claire du `<select>`,
   **toutes les listes s'ouvraient blanc sur blanc**. `select option,select optgroup` sont en
   plus peints explicitement, tous les moteurs ne dérivant pas la couleur du parent.
2. **`appearance:none` impose un `padding-right`.** Le chevron est une image de fond à 13 px du
   bord ; avec le padding commun de 12 px les libellés longs passaient dessous. 34 px +
   `text-overflow:ellipsis`.
3. **Reconstruire une liste efface la sélection.** `fillInspSelect`, `fillMixSelect` et la liste
   du Journal doivent toutes relire `sel.value` avant, et le restaurer s'il existe encore.
   `fillMixSelect` est rappelée à chaque création / duplication / suppression / retrait /
   restauration : sans cela le Doseur affichait la recette d'une AUTRE plante.
4. **Ne jamais remplir une liste « une seule fois ».** Le `if(!sel.options.length)` du Journal
   la figeait sur l'état du démarrage : plantation créée ensuite invisible, plantation
   supprimée toujours proposée. Toute liste alimentée par `activePlants()` se reconstruit à
   chaque rendu — et `renderHarvest()` doit figurer partout où `fillMixSelect()` figure.
5. **Un menu qui re-rend son propre conteneur doit mémoriser le repli.** Les menus de parcelle
   appellent `setBedField` → `renderBeds()` : les sous-sections `<details>` se refermaient au
   moment même où l'on validait un choix. Clés `state.bedFold['<parcelle>.<section>']`
   (`sol` / `plantes` / `histo`), même convention que `state.plantFold`. Piège dans le piège :
   le défaut de « Analyse du sol » dépendait de `(v||b.om)` — régler la matière organique
   faisait donc basculer la section de « ouverte » à « fermée » sur son propre changement.
6. **Ne jamais affecter `.value` sans vérifier que l'option existe** : `selectedIndex` passe à
   −1 et le menu s'affiche **vide** au lieu de retomber sur son premier choix (cas de
   `canUnit` restauré depuis `localStorage`).

Accessoirement : chaque `<label>` porte un `for` vers l'id de son champ (taper l'étiquette
ouvre le menu), `#canUnit` a un `aria-label` faute d'étiquette propre, et `select:disabled`
est visiblement grisé avec un cadenas — le menu « Culture » verrouillé en édition passait
sinon pour cassé.

## 4ante. Fiche plante : sections repliables
`plantBody()` et `ornamentalBody()` composent la fiche avec `pgroup(p,clé,icône,titre,sous-titre,contenu,ouvertParDéfaut)` :
📊 État (ouverte) · 💧 Arrosage · ⚗️ Nutrition · 🔎 Diagnostic & contrôles · 🛠️ Entretien ·
🧱 Situation & sol. Chaque en-tête porte un résumé (phase, intervalle, recette, parcelle) pour
décider sans déplier. Repli mémorisé par plante ET par section (`state.plantFold['<id>.<clé>']`).
Les boutons d'action restent HORS des sections, toujours accessibles.
⚠️ `plantStatus()` est défini juste avant `plantCard()` et sert aussi aux pastilles de
catégorie : ne pas l'emporter en réécrivant `plantBody()`.

## 4bis. Inspection → diagnostic → réajustement (⚠️ prime sur le calendrier)

- ⚠️ **Le formulaire est ADAPTÉ À LA PLANTE** — `inspFields(p)`, pas une liste figée.
  Chaque plante a un **archétype** (`ARCH` / `PLANT_ARCH` / `archOf()`) : `grass`, `fruit`,
  `vine`, `root`, `bulb`, `herb`, `potTree`, `potRosette`, `shrub`. L'archétype décide :
  le libellé de la mesure (`hLab` — « hauteur du plant » vs « diamètre de la rosette » vs
  « longueur de la liane »), le **motif de carence azotée** (`nColor` : le V le long de la
  nervure n'existe QUE chez les graminées ; ailleurs jaunissement uniforme des vieilles
  feuilles), les **signes proposés** (`signs`, fusionnés avec les signes universels), les
  **champs pertinents** (`fields` : `nb`/`rows`/`space`/`polli`) et l'espacement visé
  (`spaceMin`/`spaceTxt`). Ne JAMAIS réintroduire de champ global sans se demander s'il a
  un sens pour un ail, une carotte ou un citronnier en pot.
- Clés stockées : `INSP_KEYS` (toutes archétypes confondus) dans `state.insp[id]`
  (dernière) et `state.inspLog` (historique → `growthRate()` = cm/semaine mesurés).
  Chaque enregistrement porte son `arch`.
- **Moteur** (`DIAG` → `diagnose()` → `dg()` mémoïsé → `adj()`) : chaque règle porte
  `sev` (3 bloquant / 2 à corriger / 1 bénin), `cause`, `why` (explication factuelle),
  `fix[]`, `src` (**source obligatoire**) et `adj` (effet sur le programme).
  **Règle de rigueur : un symptôme bénin est annoncé comme bénin et ne change RIEN**
  (ex. `fentes_vent` : fentes longitudinales = vent/sénescence, surtout pas une carence ;
  `senescence_bulbe` : chez l'ail en fin de cycle, le jaunissement des feuilles basses EST
  le signal de récolte — fertiliser là nuirait à la conservation).
  **Règles cadrées par archétype** : `choc_transplant` ne se déclenche que sur les cultures
  qui supportent mal le repiquage (`ARCH.resent`) — la tomate se repique très bien ;
  `fentes_vent` et `polli_vent` sont propres aux graminées ; `racine_repiquee`, `fourchue`,
  `collet_vert` aux racines ; `scape`, `moisi_blanc` aux alliacées ; `culnoir`,
  `chute_fleurs`, `fentes_fruit` aux légumes-fruits ; `avorte`, `fletri_tige`, `oidium` aux
  cucurbitacées ; `montaison`, `ligneux` aux aromatiques ; `chute_feuilles`, `collant` aux
  pots ; `coeur_mou` à la rosette ; `bois_mort` à l'ornemental ; `espacement` partout où
  `spaceMin` est défini. Les règles génériques (`mildiou`, `ravageurs`, `sels`) ont un
  `why` **fonction de l'archétype** : jamais de texte de tomate servi à un ail.
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

## 4bis-oid. Oïdium des cucurbitacées : « les feuilles les plus atteintes », CHIFFRÉ

Cas d'école de la règle « ne jamais donner un conseil qu'on ne sait pas appliquer ».
L'app disait « retire les feuilles atteintes » — inapplicable : sur une courge en juillet,
presque toutes en portent. Module dédié (constantes `OID_*` + `oidObs` / `oidCull` /
`oidGrade` / `oidCullText` / `oidCullBlock`), placé juste avant `DIAG`.

- **Seuil de retrait** (`OID_CRIT`, énoncé UNE fois, réutilisé partout) : une feuille se
  coupe quand **plus de la moitié du limbe est blanchie** ou qu'elle a **jauni / bruni /
  séché** sous le feutrage. En dessous, elle reste bénéficiaire : on la garde, même tachée.
- **Plafond** (`OID_CAP`) : jamais plus du **tiers** du feuillage en une fois ; le reste
  7 jours plus tard. Le plant perdrait plus en photosynthèse qu'il ne gagne en assainissement,
  et les fruits découverts brûlent au soleil.
- **Exception** (`OID_ORDER`) : ne jamais retirer une feuille qui **ombrage un fruit**.
- **Seuil de dépistage** : 1 feuille symptomatique sur 50 vieilles feuilles, dessus ET
  dessous → porté par la tâche météo « risque d'oïdium » du Programme.
- ⚠️ **Test du doigt d'abord** : le blanc qui suit exactement les nervures et ne s'efface pas
  est la **panachure argentée variétale** de beaucoup de courges — pas une maladie. Règle
  `panachure` (sev 1, ne change RIEN) qui court-circuite tout le reste (`oidRub==='reste'`).
  Sans elle, l'app faisait effeuiller un plant sain.
- **Inspection** : 5 champs `oidRub` / `oidCover` / `oidTot` / `oidBad` / `oidWhere`, ajoutés
  au seul archétype `vine`, **conditionnels** (`dep:'feutrage'`, wrapper `.depf`, `syncDeps()`)
  — ils n'apparaissent que si le signe est coché, et se remasquent avec `markHealthy()`.
  `syncDeps()` bascule l'attribut `hidden` sans re-rendre le formulaire : re-rendre perdrait
  la saisie en cours.
- **Chiffrage** (`oidCull`) : `cap = max(1, ⌊tot/3⌋)`, `today = min(bad, cap)`, `rest` pour la
  semaine suivante. Renvoie **null** tant que les deux nombres manquent — l'app dit alors ce
  qui lui manque au lieu d'inventer un chiffre.
- ⚠️ **Les deux saisies se recoupent, elles ne doivent jamais se contredire à l'écran** :
  l'échelle porte sur la feuille LA PLUS atteinte, donc `cover ∈ {p75, sec}` impose
  `bad ≥ 1` ; symétriquement `bad > 0` impose une gravité ≥ 2 même si l'échelle est vide.
- **Gravité** (`oidGrade`) : 1 début · 2 installé · 3 avancé. Une seule feuille très atteinte
  n'est PAS un cas avancé : ce qui fait basculer en 3 est la **généralisation** (≥ 33 % du
  feuillage au-delà du seuil, ou feutrage monté jusqu'au sommet). Quatre règles `DIAG`
  mutuellement exclusives : `oidium` (étendue à préciser) · `oidium_debut` (traiter, **ne
  rien couper** — le dire explicitement) · `oidium_installe` · `oidium_avance` (sev 3 :
  protéger les fruits du coup de soleil, récolter, ne pas entretenir de faux espoir).
- **Effet programme** : `feedDelta:+3` sur installé/avancé (l'excès d'azote aggrave), **aucun**
  `waterDelta` — le problème est l'air confiné, pas le sol, et un plant assoiffé décroche plus
  vite. Non-action délibérée.
- **`oidCullBlock(p)`** (fiche plante, section Diagnostic) est rendu **en direct** et non figé
  dans `fix` : l'heure de pulvérisation (`actionTiming('foliar')`) et le vent (`windOK()`)
  changent dans la journée, le comptage non. Inversement `oidCullText()` **peut** vivre dans
  `fix` car il ne dépend que de l'inspection — donc il se propage automatiquement au
  Programme via `worst.fix[0]`.
- Tâche `effeuillage|<culture>|<ts>` : les feuilles laissées par le plafond du tiers.

## 4-0. MODÈLE DE DONNÉES (⚠️ lire en premier)

    JARDIN
      └── PARCELLE (state.beds[])           ← porte la CONFIGURATION PHYSIQUE
            ├── medium    : terre (m²) | bac (L) | pot (L)
            ├── cover     : aucune | paillis | geotextile
            ├── watering  : drainage | reservoir (+ reservoirL)
            ├── pH, date de test, matière organique, historique de rotation
            └── CULTURE (state.plantings[]) ← ce qui pousse dedans
                  ├── species  → state.species[] (agronomie, une seule fois)
                  ├── count, volL, label
                  ├── sowing   : direct | repique
                  ├── sowDate
                  └── PHASE : jamais stockée, toujours CALCULÉE

**Une culture appartient toujours à une parcelle.** La configuration physique n'est JAMAIS
portée par la culture : plusieurs cultures d'une même parcelle partagent forcément son
medium, sa couverture et son arrosage. Modifier la parcelle propage à toutes ses cultures.
Accesseurs : `mediumOf(p)`, `coverOf(p)`, `wateringOf(p)`, `reservoirL(p)`, `sowingOf(p)`,
`rainReaches(p)`, `coverProtects(p)`, `inGround(p)` — tous passent par `bedOf(p)`.

**Une même espèce peut être cultivée dans plusieurs parcelles** : autant de cultures
pointant vers la même espèce, sans dupliquer l'agronomie.

### ⚠️ PRINCIPE DIRECTEUR
**L'app ne demande à l'utilisateur QUE ce que lui seul peut savoir** : ce qu'il a planté, où,
quand, et ce qu'il observe. Tout le reste — agronomie, jours à maturité, durées de phase,
plages de pH, conventions de comptage — est une donnée du domaine, à embarquer dans l'app.
Avant d'ajouter un champ, se demander : « le jardinier est-il la seule source possible ? »
Si non, c'est une donnée à intégrer, pas une question à poser.

### Ajouter une culture que l'app ne connaît pas (⚠️ application directe du principe)
`makeSpecies()` fabrique une espèce complète à partir des **seules** réponses que le jardinier
est en mesure de donner. Deux chemins, du plus court au plus long :
- **`CROP_LIBRARY`** — 30 cultures courantes en zone 5b (haricot, concombre, poivron, laitue,
  betterave, oignon, basilic, fraisier…). Le jardinier choisit un nom, il ne renseigne **rien**
  d'autre : famille, architecture, jours à maturité et sensibilité au gel sont connus.
- **Culture libre** — nom, icône, **archétype**, **famille**, jours à maturité + convention,
  gélive ou non, vivace ou non. Rien de plus.

Tout le reste est **dérivé**, jamais demandé :
- `ARCH_MODEL[archétype]` → stades, poids des phases, durée de récolte, recette par phase,
  intervalle d'arrosage, ensoleillement, mode de pollinisation.
  ⚠️ **`stages` est aligné sur `MARKERS[archétype]`** : un marqueur désigne un INDICE de stade.
  Modifier l'un sans l'autre casse toute la déduction de phase.
- `ARCH_GUIDE[archétype]` → conseils par phase (eau / à surveiller / entretien). Génériques
  mais vrais pour toute culture partageant cette architecture — une fiche vide serait pire.
- `FAM_AGRO[famille]` → fréquence d'apport, plage de pH, cible d'azote. ⚠️ brassicacées : pH
  volontairement haut (au-dessus de 7 la hernie du chou est nettement moins agressive) ;
  fabacées : cible d'azote quasi nulle **et** la recette `vegetatif` est remplacée par `jeune`
  (elles fixent leur azote — le forcer donne du feuillage au lieu de gousses).
- `speciesCycle()` répartit les **jours à maturité du sachet** sur les phases qui précèdent la
  récolte : le modèle est ancré sur le seul chiffre réel dont dispose le jardinier.
- `resow` déduit de la sensibilité au gel et de l'archétype — aucune fenêtre de semis inventée
  culture par culture.

⚠️ Le modèle produit est **générique et l'app le dit** dans l'aperçu. C'est acceptable parce que
`curStage = observedStage ?? modelStage` : la première inspection corrige le calendrier.
L'aperçu (`renderSpeciesPreview`) montre EN DIRECT tout ce qui vient d'être déduit — c'est ce
qui rend légitime de ne pas poser les questions.

`newSpeciesId()` slugifie le nom et compte les collisions (jamais `Date.now()`, cf. `newBedId`).
`speciesInUse()` interdit de supprimer une espèce encore plantée : on effacerait l'agronomie
sous les pieds d'une culture suivie, journal et inspections compris.
Trois familles ont été ajoutées à `FAM` **et** à `CAT_ORDER` pour couvrir le catalogue :
`amaranthacees`, `asteracees`, `rosacees`. Toute nouvelle famille doit figurer dans les deux,
plus dans `FAM_AGRO`, sinon elle retombe silencieusement sur « autres ».
⚠️ La convention de comptage peut venir de l'ESPÈCE (`sp.dtmFrom`, exposé en `spDtmFrom` sur
l'objet résolu) : nom distinct obligatoire, fusionner espèce et plantation ferait écraser la
valeur par un null — même piège que `dtm` / `varDtm`.

### Variétés et jours à maturité
`VARIETIES[espèce]` = catalogue `{n, dtm, from, note}`. Choisir la variété renseigne les jours
à maturité : ils ne sont JAMAIS demandés, sauf variété absente du catalogue (option « Autre »,
qui révèle alors le champ manuel + la convention).

⚠️ **QUATRE CONVENTIONS de comptage**, les confondre fausse tout :
- `semis` — depuis le semis (maïs, carotte).
- `repiquage` — depuis la MISE EN TERRE du plant, pas depuis le semis intérieur (tomate,
  melon, pastèque). Ajouter 6–8 semaines pour le délai réel depuis la graine. (Burpee)
- `semis-14` — depuis le semis, moins 14 j si repiquée (courges, convention Johnny's).
  Appliqué par `dtmEffective()`.
- `plantation` — depuis la mise en terre du caïeu (ail, 8–10 mois).

**DEUX DATES sur la culture** : `sowDate` (semis, pilote le modèle de phases) et `plantDate`
(mise en terre, référence des jours à maturité pour les conventions `repiquage`/`plantation`).
`maturityRef(p)` choisit la bonne ; si `plantDate` manque alors qu'elle est requise,
`varietyOutlook().warn` est vrai et l'interface annonce que le calcul est optimiste plutôt que
de se tromper en silence.

### Où vit chaque donnée (⚠️ ne pas déplacer sans raison)
- **Ensoleillement → PARCELLE** (`bed.sun`, `bedSun(p)`, `sunVerdict()`). C'est une propriété
  de l'emplacement : le demander à chaque inspection et pour chaque culture d'une même
  parcelle était redondant et pouvait se contredire.
- **Espacement → CULTURE** (`planting.spacing`). C'est une décision de plantation, pas une
  observation.
- **Variété → CULTURE** (`planting.variety`, `planting.dtm`). `dtmOf(p)` fait primer la
  variété sur l'espèce. ⚠️ Sur l'objet résolu, la variété est `varDtm` et l'espèce `dtm` :
  les fusionner faisait écraser la valeur de l'espèce par un null.
  `varietyOutlook(p)` = date de semis + jours à maturité vs `frostInfo()` → marge ou retard.
- **Inspection = uniquement ce qui s'OBSERVE** : marqueurs, hauteur, couleur, signes, sol,
  racines, ravageurs. Tout fait déclaré (configuration) appartient à la parcelle ou à la culture.

### Contrôles de configuration (hors moteur de diagnostic)
`DIAG` ne s'exécute que sur une inspection. Or un emplacement à 3 h de soleil ou des plants à
5 cm d'écart sont connaissables **sans inspecter**. Ces contrôles vivent donc directement dans
`renderToday()` (clés `soleil|<parcelle>|<h>` et `espacement|<culture>|<niveau>`) et se
déclenchent dès la saisie de la configuration. Ne pas les réintégrer à `DIAG`.

### Durée dans la phase : DÉDUITE elle aussi
`phaseStart(p)` encadre la transition avec l'historique : la dernière inspection montrant un
stade antérieur = borne basse, la première montrant le stade courant = borne haute, on retient
le **milieu**. Une seule borne → croisement avec le calendrier. Aucune → calendrier, annoncé.
`daysInPhase(p)` en dérive, et `stageSince()` s'aligne dessus, donc `frostOutlook()` et le
bloc « temps par phase » en héritent.
⚠️ `stageOfRecord()` renvoie **0** pour une inspection dont `marks` est un tableau VIDE
(« rien n'était encore visible » est une information, utile comme borne basse) mais
`observedStage()` exige une preuve positive : une inspection vide ne fait jamais **régresser**
la phase courante.

### Conseils : clôturables par OCCURRENCE
`add(g,c,ic,titre,détail,pid,key)` — la `key` identifie l'occurrence, pas le type :
`gel|2026-09-20`, `mildiou|2026w38|élevé`, `soin|<culture>|<phase>|<semaine>`,
`diag|<culture>|<règle>|<ts inspection>`, `camg|<culture>|<mois>`, `rentrer|<culture>|<année>`.
`closeTask(key)` clôt CETTE occurrence ; une situation nouvelle produit une clé nouvelle,
donc un conseil neuf. `renderTaskArchive()` liste les conseils clos et permet de les rétablir.
⚠️ Tout nouveau conseil doit recevoir une clé, sinon il n'est pas clôturable.

### ⚠️ Pertinence temporelle du Programme — audit complet
Chaque entrée du Programme doit être vraie **au moment où elle s'affiche**. Sept défauts
corrigés, tous vérifiés en rejouant l'app à huit dates de l'année (mai → janvier) :

1. **Soins de phase sans condition de date.** « Étête ~1 mois avant le gel » sortait fin
   juillet, à 71 jours du gel. Un soin porte désormais un marqueur : `when` (fenêtre datée ou
   d'état, `CARE_WHEN`), `note` (un fait, jamais une tâche — « patience, la maturation est
   longue »), `auto` (un changement de régime que l'app applique DÉJÀ elle-même — « passe au
   P-K » : la recette a changé toute seule, il n'y a rien à faire). `careDue()` est la seule
   source des tâches ; la fiche plante, elle, montre tout et dit l'état de chacun (`careState`).
2. **Seul le PREMIER soin de la phase était émis.** Quand `care[0]` décrivait un régime, le
   vrai geste restait invisible : « coupe le scape » (ail) et « pince les gourmands » (tomate)
   n'ont jamais été proposés. Tous les soins dus sont émis, et le **geste est le titre** —
   trois lignes « Tomate · Végétatif » identiques ne disaient pas laquelle restait à faire.
3. **Les `structural` fuyaient en tâches.** `phaseInfo().care` retombe sur `p.structural` quand
   l'espèce n'a pas de soins pour ce stade : le buis sortait trois « tâches » par jour, toute
   l'année. `careList()` lit la phase **directement**, jamais le repli.
4. **Rien ne vérifiait que la culture était semée.** Une plantation à date de semis future
   était placée au stade 0 : l'app réclamait eau et engrais pour une graine pas encore en
   terre. `notYetSown()`, appliqué à l'arrosage, l'engrais, le Ca/Mg, les soins, l'espacement.
5. **La saison de plein air ne se terminait jamais.** En novembre l'app demandait encore
   d'arroser le thym, de récolter des herbes et calculait un déficit d'ET₀. `outdoorDormant()`
   (novembre–mars, ou gel meurtrier passé) coupe tout **pour la pleine terre seulement** : un
   pot rentré garde son programme. `lowLightRest()` arrête en plus les apports des pots de
   novembre à février — la lumière ne soutient plus de croissance et les sels s'accumulent.
6. **Un apport la veille d'un gel meurtrier.** Aucune fertilisation ni Ca/Mg tant qu'un gel est
   annoncé pour une plante encore dehors ; l'alerte gel le dit explicitement.
7. **Textes et listes codés en dur.** L'alerte gel énumérait « rentrer les pots gélifs » en
   citant un melon semé en pleine terre ; le plan 14 j affichait « protéger melon/pastèque/
   ananas, rentrer les citrons » même pour des cultures finies, retirées ou jamais plantées, et
   ignorait toute culture ajoutée depuis. Les deux partent maintenant de `plantsAtRisk()` et
   distinguent ce qui se **couvre** (en terre) de ce qui se **rentre** (en contenant) —
   `overwinterTasks` ne propose plus de rentrer un melon de pleine terre, ni un plant mort.
   Même correction pour `careTimingKind`, indexé sur les identifiants d'origine : aucune
   plantation créée dans l'app ne recevait sa fenêtre horaire de pollinisation ou de récolte.

Effets de bord corrigés au passage : le thym était marqué **annuel** (il est rustique en zone
5b) — « cycle terminé » sortait chaque hiver pour une plante bien vivante, et son arrosage
était coupé définitivement ; une migration corrige les catalogues déjà en `localStorage`.
Hors saison, les dix lignes « cycle terminé » sont regroupées en un seul renvoi vers le bilan
de saison, tant qu'il n'est pas fait.

### Pertinence temporelle (⚠️ règle de conception)
Un conseil ne s'affiche que dans sa fenêtre utile. Cas de référence : « rentrer les pots
gélifs » exige **septembre ou plus tard, OU un gel réellement annoncé**, et le seuil de la
plante SANS marge — une nuit isolée à 12 °C en juillet n'est pas un motif, et rentrer trop tôt
coûte de la lumière. Idem pour le bulletin météo, qui change de message selon le mois.
Les soins de phase ne sortent pas pour un cycle terminé. Les `structural` de la fiche sont
présentés comme **repères permanents**, pas comme des tâches du jour.

### La phase ne se saisit JAMAIS
`MARKERS[archétype]` = liste ordonnée de marqueurs phénologiques observables (« un plumet
est sorti au sommet », « des soies sortent des épis »). L'inspection ne demande QUE des
faits visibles ; `observedStage(p)` retient le stade le plus avancé dont le marqueur est
coché. `curStage(p)` = `observedStage(p)` ?? `modelStage(p)` (calendrier, annoncé comme tel).
`previewStage()` montre la déduction en direct pendant la saisie.
⚠️ **Ne jamais réintroduire de champ « stade » saisissable.** Pour couvrir une nouvelle
phase, ajouter un marqueur observable dans `MARKERS`.

`stateComparison(p)` / `stateBlock(p)` : état ATTENDU (calendrier + ce qui devrait être
visible) vs état RÉEL (phase déduite, hauteur, croissance mesurée) + écart en phases.

`newBedId()` compte les identifiants existants — `Date.now()` produisait des doublons pour
des parcelles créées dans la même milliseconde, et rattachait toutes les cultures à la première.

## 4quinquies. Volumes, saison, hivernage

- **Dose réelle** : `appliedLiters(p)` = demi-réservoir pour un pot à réserve, sinon
  `volL` de la plantation, sinon l'arrosoir. `nGramsPerFeed()` en dérive — le compteur
  supposait auparavant un arrosoir plein partout (facteur 6 d'erreur sur agrume).
- **Cible azote** : `nTargetOf(p)` met la fourchette à l'échelle de `planting.area`
  (bornée 0,3–6 m², on ajuste sans extrapoler).
- **Surface de parcelle** (`bed.area`) : convertit le déficit ET₀ en litres par parcelle.
- **Clôture de saison** : `archiveSeason()` verse les familles cultivées à
  `bed.history` — c'est ce qui fait vivre l'alerte de rotation d'une année sur l'autre.
  `seasonSummary()` dresse le bilan (récoltes, azote vs cible, apports, inspections).
- **Hiérarchie des conseils** : quand un diagnostic de sévérité ≥ 2 est actif, les
  `checks` génériques passent en `<details>` replié avec la mention « le diagnostic fait
  foi », et la plante est retirée de la carte « À vérifier » du Programme. Les deux
  systèmes ne peuvent plus se contredire à l'écran.
- **Hivernage** : `INDOOR_MIN` par espèce, `state.indoor[id]`, `overwinterTasks()` —
  rentrer à l'approche du seuil (dès août), ressortir progressivement au printemps.
  Une plante rentrée sort de `plantsAtRisk()` et n'alimente plus l'alerte gel.

## 4quater. Invariants métier (⚠️ à ne pas casser)

- **Fin de cycle** : `cycleOver(p)` = annuelle dont le modèle a dépassé la durée totale
  (+21 j de marge) ET qui est au dernier stade. Une inspation la situant plus tôt fait foi.
  Effets : `waterEvery()` → null, `curRecipe()` → aucun, `camgDue()` → null, tâche
  « cycle terminé » au Programme. Sans cela une tomate restait « en récolte » en janvier.
- **Un diagnostic ne crée jamais un apport** : `curRecipe()` refuse tout override de recette
  quand le régime de base est `isNoFeed` ou que la plante est `ornamental`. Le choc de
  transplantation prescrivait sinon de l'engrais au buis — le geste que sa propre source
  interdit.
- **Ancrage de phase** : `stageSince()` ne re-date la phase que si le stade observé
  **diffère** du modèle. Confirmer le calendrier ne doit pas remettre le compteur à zéro.
- **Azote** : `undoLast()` retranche `log.n` (valeur enregistrée), jamais une valeur
  recalculée — une inspection peut avoir changé la recette entre-temps.
- **Alertes météo cadrées** : `frostAlert()` exige avril–novembre ET `plantsAtRisk()`
  non vide ; `diseaseRisk()` exige au moins une culture sensible en végétation.
- **Une seule notion de gel** : `frostInfo()` — la prévision réelle prime sur la moyenne du
  7 oct ; `past:true` après le gel moyen. `daysToFrost()` en dérive.
- **Champs météo** : tester `== null`, jamais la falsy (`et0` ou `rhMax` peuvent valoir 0).
- **Aucun `prompt()`** : toute saisie passe par un formulaire en ligne.

## 4ter. Sol, nutrition saisonnière et météo dérivée

- **Parcelles** (`state.beds`) : `{id,name,ph,phDate,om,history[]}` ; rattachement
  `state.plantBed[plantId]`. **Éditables** (`renameBed`, `delBed`, `assignPlant` avec
  détachement) et **repliables** : la carte de parcelle est un `<details>` (repli mémorisé
  dans `state.bedFold`), avec 3 sous-sections repliables — Analyse du sol, Plantes,
  Historique & rotation — et un résumé en pastilles toujours visible. `phVerdict(ph)` = diagnostic + correctifs ; `PH_OPT` = plage
  idéale par culture, `phFitFor()` croise les deux (affiché fiche plante + Doseur).
- **Rotation** : `FAM` (familles botaniques + risques + gourmandise), `PLANT_FAM`,
  `rotWarnings(bed)` alerte si une famille revient à moins de 3 ans.
- **Amendements** : `AMEND` (test de sol, compost, paillis, engrais verts, feuilles,
  chaulage, planification) ; `state.amend[clé+année]` = fait/pas fait.
- **Budget azote** : `N_TARGET` (fourchette **indicative** g N/saison par entrée, dérivée
  de recommandations en g N/m² ramenées à l'emprise au sol), `nGramsPerFeed()` calcule
  l'azote réel de l'arrosoir, `addN()` cumule à chaque « ✓ Fertilisé » (`state.nlog`),
  `nBudgetLine()` affiche la jauge. But : détecter la dérive, pas prescrire.
- **Ca/Mg** (`CAMG`, `state.camg`, 30 j) : devient une tâche planifiée du Programme.
  ⚠️ Nuance factuelle codée dans les textes : le cul noir est un défaut de **transport**
  du calcium (arrosage irrégulier), pas un sol pauvre — l'apport ne remplace pas la régularité.
- **Météo dérivée** (champs open-meteo ajoutés : `soil_temperature_6cm`,
  `et0_fao_evapotranspiration`, humidité, vent) :
  `frostAlert()` (prévision réelle, seuil 2 °C car la station mesure à 1,5 m),
  `diseaseRisk()` (indice **indicatif** mildiou/oïdium, annoncé comme tel),
  `waterBalance()` (ET₀ − pluie = déficit en L/m²), `soilTempInfo()` (levée des semis),
  `windOK()` (pas de foliaire > 12 km/h). Le groupe **🚨 Urgent** du Programme les porte.
- **Pollinisation** : `POLLEN` par culture ; règles `polli_vent` (maïs hors bloc → épis
  mal remplis) et `polli_insectes` (cucurbitacées sans pollinisateurs → pollinisation
  manuelle 6–10 h).
- **Récolte** (`state.harvest`) : boucle de rétroaction, dans le Journal.
- **Photos** : IndexedDB `jardin-photos` (`PDB`), redimensionnées 1024 px / JPEG 0,72
  avant stockage. **Hors export JSON** (volume) — c'est dit à l'utilisateur.

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
2. **Incrémenter `CACHE` dans `sw.js`** (actuellement `jardin-v35`) — sinon les clients
   gardent l'ancienne version en cache.
3. `git -C "D:\KGW\Afronim\jardin-app" add -A && commit && push`. GitHub Pages se
   reconstruit en ~1 min.

> Note de déploiement initial (Claude Code) : fait sans `gh`, token GitHub récupéré via
> Git Credential Manager puis API REST (créer le repo + activer Pages). Bash sandbox sans
> réseau ; PowerShell a le réseau.
