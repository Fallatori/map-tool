# GeoGuessr Helper (Frontend-first MVP)

Static React app that highlights countries matching clue filters (hemisphere, driving side, include/exclude ISO, language/script).

## Stack

- React + Vite
- MapLibre GL JS
- Turf.js
- Natural Earth country geometry (demo subset)

## Quick start

1. Install dependencies:

   npm install

2. Validate and normalize data:

   npm run prepare:data

3. Start dev server:

   npm run dev

4. Run tests:

   npm run test:run

5. Run lint:

   npm run lint

## Data files

- [public/data/countries.geojson](public/data/countries.geojson): country polygons keyed by `ISO_A2`.
- [public/data/country_features.json](public/data/country_features.json): normalized country metadata keyed by `iso_a2`.
- [public/data/aux_points.json](public/data/aux_points.json): optional points for future constraints.

## Constraint engine

Core function: `applyConstraints(featuresArray, constraintsArray, options)` in [src/engine/constraintEngine.js](src/engine/constraintEngine.js).

Supported v1 types:

- `hemisphere`
- `driving_side`
- `language`
- `script`
- `country_include`
- `country_exclude`

Modes:

- **strict**: all constraints must pass.
- **weighted**: country score in $[0,1]$ with optional threshold.

## Deployment target

This project is ready for Vercel static hosting:

- Build command: `npm run build`
- Output directory: `dist`

## Data provenance and license

- Natural Earth Admin-0 Countries (public domain): https://www.naturalearthdata.com/
- Optional future OSM-derived data must include ODbL attribution.

## Future backend compatibility

Constraint objects are JSON-serializable and kept UI-decoupled from execution logic, enabling later swap to a server endpoint (`/api/constraints`) powered by PostgreSQL + PostGIS without frontend refactor.
