# Jardin — assistant de terrain (PWA)

Application web installable (PWA) d'aide à l'entretien du jardin selon la météo et la
saison, pour Montréal (zone 5b). Un seul écran, 6 onglets : Programme, Plantes,
Inspection, Saison, Doseur d'engrais, Journal. Fonctionne hors-ligne après la première
ouverture.

L'onglet **Inspection** permet de saisir l'état réel d'une plante (hauteur, stade observé,
couleur du feuillage, signes visibles, sol, racines…). L'app en déduit les causes probables
— chacune avec sa source — et **recale automatiquement le programme** de cette plante :
phase, recette d'engrais, intervalle d'arrosage, fréquence des apports. L'observation de
terrain prime toujours sur le calendrier de semis.

Thème recalé sur [kgw.afronim.com](https://kgw.afronim.com) : navy `#1c2341` + cyan
`#6ec6d8`, police Montserrat, icônes Bootstrap Icons.

## Installer sur Android
Ouvrir l'URL dans Chrome → menu ⋮ → **Ajouter à l'écran d'accueil**.

## Fichiers
- `index.html` — l'application (HTML/CSS/JS, sans build)
- `sw.js` — service worker (cache hors-ligne ; incrémenter `CACHE` à chaque déploiement)
- `manifest.webmanifest`, `icon-192.png`, `icon-512.png` — métadonnées + icône
- `bootstrap-icons.woff2` — police d'icônes embarquée
- `make-icons.js` — script Node qui régénère les icônes (`node make-icons.js`)

Météo : API open-meteo (sans clé). Données utilisateur : `localStorage`.

L'onglet **Saison** regroupe les semis, le **sol** (température du sol, pH par parcelle avec
diagnostic et correctifs, calendrier d'amendements) et la **rotation** des familles
botaniques. Le Programme intègre les alertes de gel calculées sur les prévisions réelles,
un indice de risque de maladie foliaire, et le besoin en eau chiffré par évapotranspiration
(ET₀). Le Journal tient le registre de **récolte**, et chaque plante suit son **budget
azote** de la saison.
