import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUserLocale, t, tPlural } from '../../i18n';

type MapPostcard = {
  id: string;
  title?: string | null;
  description?: string | null;
  metadataDesc?: string | null;
  thumbUrl: string;
  previewUrl: string;
};

export type TravelPoint = {
  id: string;
  city: string;
  countryCode: string; // ISO-3166-1 alpha-2
  countryName?: string | null;
  lat: number;
  lng: number;
  postcardId?: string | null; // Cloudinary public_id, matches `item.id`
  description?: string | null; // optional override for popup
};

type Props = {
  baseUrl: string;
  points: TravelPoint[];
  postcards: MapPostcard[];
};

type MarkerEntry = {
  point: TravelPoint;
  marker: L.Marker;
  hasPostcard: boolean;
  countryCode: string;
};

function normalizeCountryName(value: string): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';

  // Remove diacritics, punctuation, and normalize whitespace.
  const withoutDiacritics = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return withoutDiacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCityKey(value: string): string {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  const withoutDiacritics = raw.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const normalized = withoutDiacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Minimal aliasing for common local spellings.
  if (normalized === 'lisboa') return 'lisbon';

  return normalized;
}

function clampBaseUrl(baseUrl: string) {
  if (!baseUrl) return '/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function makeMarkerIcon(kind: 'filled' | 'outline') {
  const className = kind === 'filled' ? 'map-marker map-marker--filled' : 'map-marker map-marker--outline';
  return L.divIcon({
    className: 'map-marker-icon',
    html: `<span class="${className}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
    tooltipAnchor: [0, -7]
  });
}

function getCountryA2FromFeature(feature: any): string | null {
  const props = feature?.properties;
  if (!props || typeof props !== 'object') return null;

  const candidates = [props.ISO_A2, props.iso_a2, props.ISO2, props['ISO-3166-1-Alpha-2'], props['country_code']];
  for (const candidate of candidates) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    if (!value || value === '-99') continue;
    const upper = value.toUpperCase();
    if (upper.length === 2) return upper;
  }

  return null;
}

function getCountryA3FromFeature(feature: any): string | null {
  const props = feature?.properties;
  if (!props || typeof props !== 'object') return null;

  const candidates = [props.ADM0_A3, props.ISO_A3, props.iso_a3, props.SOV_A3, props.SU_A3];
  for (const candidate of candidates) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    if (!value || value === '-99') continue;
    const upper = value.toUpperCase();
    if (upper.length === 3) return upper;
  }

  // Some datasets keep ISO-3166-1 alpha-3 on the top-level feature id.
  const featureId = typeof feature?.id === 'string' ? feature.id.trim().toUpperCase() : '';
  if (featureId && featureId.length === 3) return featureId;

  return null;
}

function isAntarcticaFeature(feature: any): boolean {
  const props = feature?.properties;
  if (!props || typeof props !== 'object') return false;

  const nameCandidates = [props.ADMIN, props.admin, props.NAME, props.name, props.SOVEREIGNT, props.sovereignt];
  for (const candidate of nameCandidates) {
    const value = typeof candidate === 'string' ? candidate.trim().toLowerCase() : '';
    if (value === 'antarctica') return true;
  }

  const codeCandidates = [props.ADM0_A3, props.ISO_A3, props.iso_a3];
  for (const candidate of codeCandidates) {
    const value = typeof candidate === 'string' ? candidate.trim().toUpperCase() : '';
    if (value === 'ATA') return true;
  }

  return false;
}

function buildPopupContent(
  point: TravelPoint,
  postcard: MapPostcard | null,
  locale: 'en' | 'ru'
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'map-popup';

  const title = document.createElement('div');
  title.className = 'map-popup__title';
  title.textContent = point.city;
  root.appendChild(title);

  const sub = document.createElement('div');
  sub.className = 'map-popup__sub';
  const subParts = [point.countryName, point.countryCode].filter(Boolean);
  // Use point.description override, or fall back to postcard metadata/description
  const desc = (point.description || postcard?.metadataDesc || postcard?.description || '').trim();
  if (desc) subParts.push(desc);
  sub.textContent = subParts.join(' • ');
  root.appendChild(sub);

  if (!postcard) {
    const empty = document.createElement('div');
    empty.className = 'map-popup__empty';
    empty.textContent = t(locale, 'map.popup.noPostcard');
    root.appendChild(empty);
    return root;
  }

  const img = document.createElement('img');
  img.className = 'map-popup__img';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = postcard.title ? `${postcard.title}` : point.city;
  img.src = postcard.previewUrl || postcard.thumbUrl;
  root.appendChild(img);

  return root;
}

export default function WorldMap(props: Props) {
  const locale = useMemo(() => getUserLocale(), []);
  const baseUrl = useMemo(() => clampBaseUrl(props.baseUrl), [props.baseUrl]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const countriesLayerRef = useRef<L.GeoJSON | null>(null);
  const countryA2ToA3Ref = useRef<Map<string, string>>(new Map());

  const markersRef = useRef<MarkerEntry[]>([]);
  const withPostcardsLayerRef = useRef<L.LayerGroup | null>(null);
  const missingPostcardsLayerRef = useRef<L.LayerGroup | null>(null);

  const [showVisitedPoints, setShowVisitedPoints] = useState(true);
  const [showWithPostcards, setShowWithPostcards] = useState(true);
  const [showMissingPostcards, setShowMissingPostcards] = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [countriesStatus, setCountriesStatus] = useState<'idle' | 'loading' | 'ready' | 'missing'>('idle');
  const [panelOpen, setPanelOpen] = useState(false);
  const [placesListOpen, setPlacesListOpen] = useState(false);
  const hoverTooltipRef = useRef<L.Tooltip | null>(null);

  const postcardsById = useMemo(() => {
    const map = new Map<string, MapPostcard>();
    for (const card of props.postcards || []) {
      if (card?.id) map.set(card.id, card);
    }
    return map;
  }, [props.postcards]);

  const visitedCountries = useMemo(() => {
    const set = new Set<string>();
    for (const p of props.points || []) {
      if (p?.countryCode) set.add(p.countryCode.toUpperCase());
    }
    return set;
  }, [props.points]);

  const visitedCountryNames = useMemo(() => {
    const set = new Set<string>();
    for (const p of props.points || []) {
      const name = normalizeCountryName(p?.countryName || '');
      if (!name) continue;
      set.add(name);

      // Common aliases (GeoJSON datasets vary a lot in naming).
      if (name === 'czechia') set.add('czech republic');
      if (name === 'united states') set.add('united states of america');
      if (name === 'serbia') set.add('republic of serbia');
    }
    return set;
  }, [props.points]);

  function getFeatureCountryName(feature: any): string | null {
    const props = feature?.properties;
    if (!props || typeof props !== 'object') return null;

    const candidates = [
      props.ADMIN,
      props.admin,
      props.NAME,
      props.name,
      props.NAME_LONG,
      props.name_long,
      // Current `public/geo/countries.geojson` uses a minimal schema.
      props.name
    ];
    for (const candidate of candidates) {
      const value = typeof candidate === 'string' ? candidate.trim() : '';
      if (value) return value;
    }

    return null;
  }

  function isVisitedFeature(feature: any): boolean {
    const a2 = getCountryA2FromFeature(feature);
    if (a2 && visitedCountries.has(a2)) return true;

    // Fallback for datasets without ISO fields: compare country names.
    const name = normalizeCountryName(getFeatureCountryName(feature) || '');
    if (name && visitedCountryNames.has(name)) return true;

    const a3 = getCountryA3FromFeature(feature);
    if (!a3) return false;

    // Some Natural Earth features have ISO_A2='-99' but do have A3.
    // Derive visited A3 set using the GeoJSON mapping.
    const mapA2toA3 = countryA2ToA3Ref.current;
    for (const visitedA2 of visitedCountries) {
      const mappedA3 = mapA2toA3.get(visitedA2) || manualA2ToA3[visitedA2];
      if (mappedA3 === a3) return true;
    }

    return false;
  }

  const availableCountries = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of props.points || []) {
      const code = (p.countryCode || '').toUpperCase();
      if (!code) continue;
      const name = (p.countryName || '').trim();
      if (!map.has(code)) map.set(code, name || code);
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [props.points]);

  // Stats for the UI
  const stats = useMemo(() => {
    const points = props.points || [];
    const countriesSet = new Set<string>();
    let withPostcards = 0;
    let total = 0;

    for (const p of points) {
      if (!Number.isFinite(p?.lat) || !Number.isFinite(p?.lng)) continue;
      total++;
      if (p.countryCode) countriesSet.add(p.countryCode.toUpperCase());
      if (p.postcardId) withPostcards++;
    }

    return {
      countries: countriesSet.size,
      places: total,
      postcards: withPostcards
    };
  }, [props.points]);

  // Places grouped by country for the list panel
  const placesGrouped = useMemo(() => {
    const points = props.points || [];
    const withPostcards: Record<string, Array<{city: string; postcardId: string | null}>> = {};
    const withoutPostcards: Record<string, Array<{city: string; postcardId: string | null}>> = {};

    for (const p of points) {
      if (!Number.isFinite(p?.lat) || !Number.isFinite(p?.lng)) continue;
      const country = p.countryName || p.countryCode || 'Unknown';
      const item = { city: p.city || 'Unknown', postcardId: p.postcardId || null };
      if (p.postcardId) {
        if (!withPostcards[country]) withPostcards[country] = [];
        withPostcards[country].push(item);
      } else {
        if (!withoutPostcards[country]) withoutPostcards[country] = [];
        withoutPostcards[country].push(item);
      }
    }

    // Sort countries and cities
    const sortCountries = (obj: typeof withPostcards) => {
      return Object.keys(obj)
        .sort((a, b) => a.localeCompare(b))
        .map(country => ({
          country,
          cities: obj[country].sort((a, b) => a.city.localeCompare(b.city))
        }));
    };

    return {
      withPostcards: sortCountries(withPostcards),
      withoutPostcards: sortCountries(withoutPostcards)
    };
  }, [props.points]);

  // Zoom to country bounds when filter changes
  const zoomToCountry = useCallback((countryCode: string) => {
    const map = mapRef.current;
    if (!map || !countryCode) {
      // Reset to world view
      map?.setView([20, 0], 2);
      return;
    }

    const markers = markersRef.current.filter(e => e.countryCode === countryCode);
    if (markers.length === 0) return;

    const bounds = L.latLngBounds(markers.map(e => [e.point.lat, e.point.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
  }, []);

  const resetView = useCallback(() => {
    setCountryFilter('');
    mapRef.current?.setView([20, 0], 2);
    setPanelOpen(false);
  }, []);

  // Hard-coded A2->A3 for countries with -99 in Natural Earth
  const manualA2ToA3: Record<string, string> = {
    RS: 'SRB', // Serbia
    XK: 'XKX', // Kosovo (not in all datasets)
    TW: 'TWN', // Taiwan
    PS: 'PSE', // Palestine
    EH: 'ESH', // Western Sahara
    SS: 'SSD', // South Sudan
  };

  function applyMarkerVisibility() {
    const map = mapRef.current;
    const withLayer = withPostcardsLayerRef.current;
    const missingLayer = missingPostcardsLayerRef.current;
    if (!map || !withLayer || !missingLayer) return;

    // If entire points are hidden, detach both layers.
    if (!showVisitedPoints) {
      if (map.hasLayer(withLayer)) map.removeLayer(withLayer);
      if (map.hasLayer(missingLayer)) map.removeLayer(missingLayer);
      return;
    }

    // Ensure layers are attached (then we can selectively populate them).
    if (showWithPostcards) {
      if (!map.hasLayer(withLayer)) map.addLayer(withLayer);
    } else if (map.hasLayer(withLayer)) {
      map.removeLayer(withLayer);
    }

    if (showMissingPostcards) {
      if (!map.hasLayer(missingLayer)) map.addLayer(missingLayer);
    } else if (map.hasLayer(missingLayer)) {
      map.removeLayer(missingLayer);
    }

    // Re-populate without recreating markers.
    withLayer.clearLayers();
    missingLayer.clearLayers();

    for (const entry of markersRef.current) {
      if (countryFilter && entry.countryCode !== countryFilter) continue;
      if (entry.hasPostcard) {
        if (showWithPostcards) withLayer.addLayer(entry.marker);
      } else {
        if (showMissingPostcards) missingLayer.addLayer(entry.marker);
      }
    }
  }

  async function loadCountriesLayer() {
    const map = mapRef.current;
    if (!map) return;

    // Cache-bust for GitHub Pages / CDN: keeps GeoJSON swaps visible without hard reload.
    const url = `${baseUrl}geo/countries.geojson?v=1`;

    try {
      setCountriesStatus('loading');
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`GeoJSON request failed: ${res.status}`);
      const geojson = await res.json();

      // Build A2->A3 mapping from the file itself.
      try {
        const a2ToA3Map = new Map<string, string>();
        const features: any[] = Array.isArray(geojson?.features) ? geojson.features : [];
        for (const f of features) {
          const a2 = getCountryA2FromFeature(f);
          const a3 = getCountryA3FromFeature(f);
          if (a2 && a3 && !a2ToA3Map.has(a2)) a2ToA3Map.set(a2, a3);
        }
        countryA2ToA3Ref.current = a2ToA3Map;
      } catch {
        countryA2ToA3Ref.current = new Map();
      }

      if (countriesLayerRef.current) {
        countriesLayerRef.current.remove();
        countriesLayerRef.current = null;
      }

      const layer = L.geoJSON(geojson, {
        filter: feature => !isAntarcticaFeature(feature),
        style: feature => {
          const visited = isVisitedFeature(feature);
          return {
            color: 'rgba(67, 83, 57, 0.55)',
            weight: 1,
            opacity: 1,
            fillColor: visited ? 'rgba(67, 83, 57, 0.22)' : 'rgba(255, 255, 255, 0)',
            fillOpacity: visited ? 1 : 0
          };
        }
      });

      layer.addTo(map);
      countriesLayerRef.current = layer;
      setCountriesStatus('ready');
    } catch (err) {
      // Still allow markers to work if GeoJSON isn't present yet.
      console.warn('[map] Countries GeoJSON missing or invalid:', err);
      setCountriesStatus('missing');
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true,
      minZoom: 1,
      maxZoom: 7
    });

    // Minimalist: no raster tiles by default (only borders + markers).
    map.setView([20, 0], 2);

    mapRef.current = map;

    // Ensure correct rendering if container sizing/CSS resolves after hydration.
    setTimeout(() => {
      map.invalidateSize();
    }, 0);

    withPostcardsLayerRef.current = L.layerGroup().addTo(map);
    missingPostcardsLayerRef.current = L.layerGroup().addTo(map);

    // Create markers once.
    const filledIcon = makeMarkerIcon('filled');
    const outlineIcon = makeMarkerIcon('outline');

    const points = Array.isArray(props.points) ? props.points : [];
    const hasPostcardForKey = new Set<string>();
    for (const p of points) {
      const cc = String(p?.countryCode || '').toUpperCase();
      const cityKey = normalizeCityKey(p?.city);
      if (!cc || !cityKey) continue;
      const key = `${cc}:${cityKey}`;
      if (p?.postcardId) hasPostcardForKey.add(key);
    }

    const visiblePoints = points
      .filter(p => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
      // If we have a postcard-based point for the same city/country,
      // hide the duplicate placeholder "missing" point (no postcard + no description).
      .filter(p => {
        const cc = String(p?.countryCode || '').toUpperCase();
        const cityKey = normalizeCityKey(p?.city);
        if (!cc || !cityKey) return true;
        const key = `${cc}:${cityKey}`;
        const hasPostcard = Boolean((p?.postcardId || '').trim());
        if (hasPostcard) return true;
        const hasDesc = Boolean(String(p?.description || '').trim());
        if (hasDesc) return true;
        return !hasPostcardForKey.has(key);
      });

    const entries: MarkerEntry[] = visiblePoints.map(point => {
        const postcardId = (point.postcardId || '').trim();
        const postcard = postcardId ? postcardsById.get(postcardId) || null : null;
        const hasPostcard = Boolean(postcard);

        const marker = L.marker([point.lat, point.lng], {
          icon: hasPostcard ? filledIcon : outlineIcon,
          keyboard: true
        });

        // Bind once so markers remain clickable across opens/closes.
        const content = buildPopupContent(point, postcard, locale);
        marker.bindPopup(content, {
          closeButton: true,
          autoPan: true,
          minWidth: 380,
          maxWidth: 520,
          className: 'map-leaflet-popup'
        });

        // Hover tooltip with thumbnail preview - show below marker so it doesn't cover it
        // Only on non-touch devices (hover doesn't work well on mobile)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isTouchDevice && hasPostcard && postcard) {
          const tooltipContent = `
            <div class="map-hover-tooltip">
              <img src="${postcard.thumbUrl}" alt="${point.city}" class="map-hover-tooltip__img" />
              <div class="map-hover-tooltip__city">${point.city}</div>
            </div>
          `;
          marker.bindTooltip(tooltipContent, {
            direction: 'bottom',
            offset: [0, 10],
            opacity: 1,
            className: 'map-hover-tooltip-container'
          });
        } else if (!isTouchDevice) {
          marker.bindTooltip(point.city, {
            direction: 'bottom',
            offset: [0, 6],
            opacity: 1,
            className: 'map-hover-tooltip-simple'
          });
        }

        return {
          point,
          marker,
          hasPostcard,
          countryCode: (point.countryCode || '').toUpperCase()
        };
      });

    markersRef.current = entries;

    loadCountriesLayer();
    applyMarkerVisibility();

    return () => {
      map.remove();
      mapRef.current = null;
      countriesLayerRef.current = null;
      markersRef.current = [];
      withPostcardsLayerRef.current = null;
      missingPostcardsLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyMarkerVisibility();
    zoomToCountry(countryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVisitedPoints, showWithPostcards, showMissingPostcards, countryFilter]);

  useEffect(() => {
    // Re-style countries if visited countries set changed.
    if (countriesLayerRef.current) {
      countriesLayerRef.current.setStyle(feature => {
        const visited = isVisitedFeature(feature);
        return {
          color: 'rgba(67, 83, 57, 0.55)',
          weight: 1,
          opacity: 1,
          fillColor: visited ? 'rgba(67, 83, 57, 0.22)' : 'rgba(255, 255, 255, 0)',
          fillOpacity: visited ? 1 : 0
        };
      });
    }
  }, [visitedCountries]);

  return (
    <section className="relative h-full w-full">
      {/* Loading indicator */}
      {countriesStatus === 'loading' && (
        <div className="absolute inset-0 z-[1300] flex items-center justify-center bg-[rgba(253,251,245,0.8)]">
          <div className="flex flex-col items-center gap-3">
            <div className="map-spinner" />
            <span className="text-sm text-muted">{t(locale, 'map.loading')}</span>
          </div>
        </div>
      )}

      {/* Home button - always visible */}
      <a
        href={baseUrl}
        className="absolute right-4 top-4 z-[1201] flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-white/90 text-primary backdrop-blur hover:bg-white"
        aria-label={t(locale, 'map.backToSite')}
        title={t(locale, 'map.backToSite')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </a>

      {/* Reset view button - shows when filtered or zoomed */}
      {countryFilter && (
        <button
          type="button"
          onClick={resetView}
          className="absolute right-16 top-4 z-[1201] flex h-10 items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-white/90 px-3 text-sm text-primary backdrop-blur hover:bg-white"
          aria-label={t(locale, 'map.resetView')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="22" y1="12" x2="18" y2="12" /><line x1="6" y1="12" x2="2" y2="12" /><line x1="12" y1="6" x2="12" y2="2" /><line x1="12" y1="22" x2="12" y2="18" />
          </svg>
          <span className="hidden sm:inline">{t(locale, 'map.resetView')}</span>
        </button>
      )}

      {/* Mobile toggle button - positioned below zoom controls */}
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute left-2 top-24 z-[1201] flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-white/90 text-primary backdrop-blur md:hidden"
        aria-label="Toggle filters"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      </button>

      {/* Filter panel - responsive, positioned below zoom controls */}
      <div className={`
        absolute z-[1200] rounded-lg border border-[var(--border-panel)] bg-white/95 text-primary backdrop-blur transition-all
        ${panelOpen ? 'left-4 top-36' : '-left-full top-36'}
        w-[calc(100%-2rem)] max-w-[320px] p-3
        md:left-14 md:top-4 md:w-auto md:max-w-[560px] md:p-3
      `}>
        {/* Stats row */}
        <div className="mb-3 flex items-center gap-2 text-xs text-muted">
          <span>{tPlural(locale, 'map.stats.countries', stats.countries)}</span>
          <span>•</span>
          <span>{tPlural(locale, 'map.stats.places', stats.places)}</span>
          <span>•</span>
          <span>{tPlural(locale, 'map.stats.postcards', stats.postcards)}</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 text-sm md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showVisitedPoints}
              onChange={e => setShowVisitedPoints(e.currentTarget.checked)}
            />
            <span>{t(locale, 'map.filters.showVisited')}</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showWithPostcards}
              onChange={e => setShowWithPostcards(e.currentTarget.checked)}
              disabled={!showVisitedPoints}
            />
            <span>{t(locale, 'map.filters.showWithPostcards')}</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMissingPostcards}
              onChange={e => setShowMissingPostcards(e.currentTarget.checked)}
              disabled={!showVisitedPoints}
            />
            <span>{t(locale, 'map.filters.showMissingPostcards')}</span>
          </label>

          <label className="inline-flex items-center gap-2 md:ml-auto">
            <span className="text-muted">{t(locale, 'map.filters.country')}</span>
            <select
              className="rounded-md border border-[var(--border-panel)] bg-white/70 px-2 py-1"
              value={countryFilter}
              onChange={e => setCountryFilter(e.currentTarget.value)}
              disabled={!showVisitedPoints}
            >
              <option value="">{t(locale, 'map.filters.allCountries')}</option>
              {availableCountries.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 border-t border-[var(--border-panel)] pt-3 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="map-marker map-marker--filled inline-block" />
            <span>{t(locale, 'map.legend.hasPostcard')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="map-marker map-marker--outline inline-block" />
            <span>{t(locale, 'map.legend.noPostcard')}</span>
          </div>
        </div>

        {countriesStatus === 'missing' && (
          <div className="mt-2 text-xs text-muted">
            Countries layer missing: place <code>public/geo/countries.geojson</code>
          </div>
        )}
      </div>

      {/* Backdrop for mobile panel */}
      {panelOpen && (
        <div
          className="absolute inset-0 z-[1199] bg-black/20 md:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* Places list toggle button */}
      <button
        type="button"
        onClick={() => setPlacesListOpen(!placesListOpen)}
        className="absolute bottom-4 right-4 z-[1201] flex h-10 items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-white/90 px-3 text-sm text-primary backdrop-blur hover:bg-white"
        aria-label={t(locale, 'map.placesList.toggle')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        <span className="hidden sm:inline">{t(locale, 'map.placesList.toggle')}</span>
      </button>

      {/* Places list panel */}
      <div className={`
        absolute z-[1202] transition-all duration-300 ease-in-out
        ${placesListOpen ? 'right-0' : '-right-full'}
        bottom-0 top-0 w-80 max-w-[85vw]
        border-l border-[var(--border-panel)] bg-white/98 backdrop-blur
        flex flex-col shadow-lg
      `}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-panel)] p-3">
          <h3 className="font-semibold text-primary">{t(locale, 'map.placesList.title')}</h3>
          <button
            type="button"
            onClick={() => setPlacesListOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 text-sm">
          {/* With postcards */}
          <details open className="mb-4">
            <summary className="mb-2 cursor-pointer font-medium text-primary">
              {t(locale, 'map.placesList.withPostcards')} ({stats.postcards})
            </summary>
            <div className="space-y-3 pl-2">
              {placesGrouped.withPostcards.map(group => (
                <div key={group.country}>
                  <div className="text-xs font-semibold text-muted">{group.country}</div>
                  <ul className="mt-1 space-y-0.5">
                    {group.cities.map((place, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-primary">
                        <span className="map-marker map-marker--filled inline-block flex-shrink-0" style={{width: '8px', height: '8px'}} />
                        <span>{place.city}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>

          {/* Without postcards */}
          <details className="mb-4">
            <summary className="mb-2 cursor-pointer font-medium text-primary">
              {t(locale, 'map.placesList.withoutPostcards')} ({stats.places - stats.postcards})
            </summary>
            <div className="space-y-3 pl-2">
              {placesGrouped.withoutPostcards.map(group => (
                <div key={group.country}>
                  <div className="text-xs font-semibold text-muted">{group.country}</div>
                  <ul className="mt-1 space-y-0.5">
                    {group.cities.map((place, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-primary">
                        <span className="map-marker map-marker--outline inline-block flex-shrink-0" style={{width: '8px', height: '8px'}} />
                        <span>{place.city}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Backdrop for places list on mobile */}
      {placesListOpen && (
        <div
          className="absolute inset-0 z-[1201] bg-black/30 md:bg-black/10"
          onClick={() => setPlacesListOpen(false)}
        />
      )}

      <div ref={containerRef} className="map-canvas h-full w-full" />

      <style>{`
        .map-canvas {
          background: linear-gradient(180deg, rgba(253, 251, 245, 0.9), rgba(237, 228, 210, 0.92));
        }

        .map-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(67, 83, 57, 0.2);
          border-top-color: rgba(67, 83, 57, 0.8);
          border-radius: 50%;
          animation: map-spin 0.8s linear infinite;
        }
        @keyframes map-spin {
          to { transform: rotate(360deg); }
        }

        .map-marker-icon { background: transparent; border: 0; }
        .map-marker {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
        }
        .map-marker--filled {
          background: rgba(49, 68, 39, 0.95);
          border: 1px solid rgba(49, 68, 39, 1);
        }
        .map-marker--outline {
          background: rgba(253, 251, 245, 0.8);
          border: 2px solid rgba(49, 68, 39, 0.95);
        }

        .map-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          background: rgba(253, 251, 245, 0.98);
          border: 1px solid rgba(79, 91, 68, 0.25);
          box-shadow: 0 10px 22px rgba(23, 30, 22, 0.18);
        }
        .map-leaflet-popup .leaflet-popup-content {
          margin: 12px 12px 10px;
          width: 420px !important;
          max-width: min(520px, calc(100vw - 64px)) !important;
        }
        .map-popup__title {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
        }
        .map-popup__sub {
          margin-top: 2px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .map-popup__img {
          width: 100%;
          height: auto;
          margin-top: 10px;
          border-radius: 10px;
          border: 1px solid rgba(79, 91, 68, 0.25);
          background: rgba(255, 255, 255, 0.6);
        }
        .map-popup__desc {
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-primary);
          line-height: 1.35;
        }
        .map-popup__empty {
          margin-top: 10px;
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Hover tooltip with thumbnail */
        .map-hover-tooltip-container {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          margin-bottom: 12px !important;
        }
        .map-hover-tooltip-container::before {
          display: none !important;
        }
        .map-hover-tooltip {
          background: rgba(253, 251, 245, 0.98);
          border: 1px solid rgba(79, 91, 68, 0.25);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(23, 30, 22, 0.15);
          padding: 6px;
          text-align: center;
          pointer-events: none;
        }
        .map-hover-tooltip__img {
          width: auto;
          height: auto;
          max-width: 160px;
          max-height: 200px;
          border-radius: 6px;
          display: block;
        }
        .map-hover-tooltip__city {
          margin-top: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
        }

        /* Simple tooltip (no postcard) */
        .map-hover-tooltip-simple {
          background: rgba(253, 251, 245, 0.98) !important;
          border: 1px solid rgba(79, 91, 68, 0.25) !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(23, 30, 22, 0.12) !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: var(--text-primary) !important;
        }
        .map-hover-tooltip-simple::before {
          border-top-color: rgba(253, 251, 245, 0.98) !important;
        }
      `}</style>
    </section>
  );
}
