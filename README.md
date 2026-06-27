# Jardin — assistant de terrain (PWA)

Application web installable (PWA) d'aide à l'entretien du jardin selon la météo et la
saison, pour Montréal (zone 5b). Un seul écran, 5 onglets : Programme, Plantes, Semis,
Doseur d'engrais, Journal. Fonctionne hors-ligne après la première ouverture.

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
