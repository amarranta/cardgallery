## cardgallery
A small static postcard gallery built with **Astro**.  
I use it for my personal postcard collection, and it can also be useful for others who want a simple way to browse postcard sets with tags.  
Images are stored on **Cloudinary**, and the site fetches metadata to generate static JSON before build.

## Features
- Browse postcards with tags and basic filtering  
- Fully static website (deployed on GitHub Pages)  
- Metadata fetched from Cloudinary and converted into JSON  
- Utility scripts for validating and preparing data  
- Easy to update the gallery by re-fetching data

## Map page (/map)
Interactive world map powered by **Leaflet**.

### Auto-updating map points from Cloudinary (recommended)
If you don’t want to manually edit `src/data/travel-points.json`, you can generate/update it from Cloudinary based on postcard names.

**Convention** (Cloudinary `public_id` base name):
- `CC_City_<anything>` where `CC` is ISO A2 country code.
- Examples: `FR_Paris_ynppct`, `CZ_CeskyKrumlov_p9aycj`, `DE_Berlin_ooxagm`.

**Run locally** (updates `src/data/travel-points.json`):
```powershell
npm run sync:travel
```

Notes:
- The script geocodes missing coordinates via Nominatim (OpenStreetMap) and caches results in `src/data/geocode-cache.json`.
- If you already have a point with coordinates, the script won’t overwrite them.

### Install
Dependencies are already in `package.json`:
- `@astrojs/react`, `react`, `react-dom`
- `leaflet` (+ `@types/leaflet`)

### Travel points data
Edit `src/data/travel-points.json`.
- `countryCode` uses ISO-3166-1 alpha-2 (e.g. `NL`, `FR`).
- `postcardId` should be the Cloudinary `public_id` (same as `item.id` in `src/data/gallery.js`).

### Countries layer (GeoJSON)
Put a countries GeoJSON at `public/geo/countries.geojson`.
Recommended source: **Natural Earth** Admin 0 Countries (1:110m for small bundle size; 1:50m if you want more detail).

The styling expects ISO-2 codes (property usually `ISO_A2`). If your GeoJSON only has ISO-3 (`ISO_A3`), either:
- export a GeoJSON that includes `ISO_A2`, or
- add an `ISO_A2` property during conversion.

### Leaflet CSS
Leaflet CSS is imported in the React island: `src/components/map/WorldMap.tsx`.

### Run
Open `/map` in dev server.

## Image handling
The website is static.  
All images live in **Cloudinary**, which provides:
- storage for postcard scans  
- folders/tags metadata  
- the data used to generate JSON at build time

## Tech stack
- Astro  
- Cloudinary API  
- GitHub Pages  
- Node-based utility scripts

## Purpose
- Keep my postcard collection organized and easy to browse  
- Provide a simple viewer that requires no backend  
- Add lightweight automation for fetching and structuring image metadata

## backlog

Prio 0
- Investigate redesign options / design tokens / lightbox text layout

Prio 1
- Album sorting
- Update metadata for existing items
- Dark theme

Prio 2
- Homepage, ‘about me’ info
- Accessibility features
- Investigate sophisticated filtering
- Optimize tags
