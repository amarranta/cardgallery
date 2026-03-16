import { useState, useRef, useEffect } from 'react';

interface PostcardData {
  id: string;
  country_code: string;
  country_name: string;
  city_sent: string;
  date_sent: string;
  days_in_transit: number | null;
  distance_km: number | null;
  sender_username: string;
  recipient_country: string;
  received_date: string;
  image_url: string;
}

interface CountryGroup {
  code: string;
  name: string;
  cards: PostcardData[];
}

interface MapPoint {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  count: number;
}

interface Props {
  countries: CountryGroup[];
  mapPoints?: MapPoint[];
}

const FLAG_URL = (code: string) =>
  `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;

function hasImage(card: PostcardData): boolean {
  return !!card.image_url && !card.image_url.includes('/avatars/');
}

/* ── Inline map (Leaflet, lazy-loaded) ── */
function TravelMap({ points }: { points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 10,
      }).setView([30, 10], 2);

      // Schematic light tile layer (CartoDB Voyager — clean & minimal)
      const isDark = document.documentElement.classList.contains('dark') ||
        !document.documentElement.classList.contains('light');

      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Airplane SVG icon
      const planeIcon = (count: number) => L.divIcon({
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
        html: `<div style="
          width:28px;height:28px;display:flex;align-items:center;justify-content:center;
          background:var(--accent);border-radius:999px;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);position:relative;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--paper)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
          </svg>
          ${count > 1 ? `<span style="
            position:absolute;top:-4px;right:-4px;
            background:var(--paper);color:var(--accent);
            font-size:9px;font-weight:700;line-height:1;
            min-width:14px;height:14px;border-radius:999px;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 1px 3px rgba(0,0,0,0.2);
          ">${count}</span>` : ''}
        </div>`,
      });

      for (const pt of points) {
        L.marker([pt.lat, pt.lng], { icon: planeIcon(pt.count) })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:var(--font-body,'Work Sans',sans-serif);text-align:center;min-width:100px">
              <strong style="font-size:13px">${pt.city}</strong><br/>
              <span style="font-size:11px;opacity:0.7">${pt.country}</span><br/>
              <span style="font-size:11px;color:var(--accent)">${pt.count} ${pt.count === 1 ? 'postcard' : 'postcards'}</span>
            </div>
          `);
      }

      // Fit bounds to markers with padding
      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 });
      }

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="h-[350px] w-full rounded-lg border border-[var(--border-card)] overflow-hidden"
      style={{ background: 'var(--surface-card-grid)' }}
    />
  );
}

export default function TravelAlbum({ countries, mapPoints = [] }: Props) {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<PostcardData | null>(null);
  const [showMap, setShowMap] = useState(false);

  const totalCards = countries.reduce((s, c) => s + c.cards.length, 0);

  const visibleCountries = activeCountry
    ? countries.filter(c => c.code === activeCountry)
    : countries;

  return (
    <div className="px-6 py-8 md:px-9 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-[Cormorant_Garamond,serif]">
            Travel Album
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Postcards received through Postcrossing
          </p>
          <div className="mt-3 flex gap-4 text-sm text-[var(--text-muted)]">
            <span>{totalCards} {totalCards === 1 ? 'postcard' : 'postcards'}</span>
            <span>&middot;</span>
            <span>{countries.length} {countries.length === 1 ? 'country' : 'countries'}</span>
          </div>
        </header>

        {/* Map toggle */}
        {mapPoints.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowMap(v => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow-surface)] transition hover:border-[var(--border-card-strong)]"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1L11 12l-2 3H6l-1 1 3 2 2 3 1-1v-3l3-2 3.7 7.3c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/>
              </svg>
              {showMap ? 'Hide map' : 'Show on map'}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform ${showMap ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showMap && (
              <div className="mt-4">
                <TravelMap points={mapPoints} />
              </div>
            )}
          </div>
        )}

        {/* Country filter pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCountry(null)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeCountry === null
                ? 'border-[var(--border-chip-accent)] bg-[var(--surface-card-tile)] text-[var(--accent)]'
                : 'border-[var(--border-chip-muted)] bg-[var(--surface-chip)] text-[var(--text-muted)] hover:text-[var(--accent)]'
            }`}
          >
            All
          </button>
          {countries.map(c => (
            <button
              key={c.code}
              onClick={() => setActiveCountry(c.code === activeCountry ? null : c.code)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wider transition ${
                activeCountry === c.code
                  ? 'border-[var(--border-chip-accent)] bg-[var(--surface-card-tile)] text-[var(--accent)]'
                  : 'border-[var(--border-chip-muted)] bg-[var(--surface-chip)] text-[var(--text-muted)] hover:text-[var(--accent)]'
              }`}
            >
              <img
                src={FLAG_URL(c.code)}
                alt=""
                width={16}
                height={12}
                className="rounded-[2px]"
                loading="lazy"
              />
              {c.name}
              <span className="opacity-60">{c.cards.length}</span>
            </button>
          ))}
        </div>

        {/* Country sections */}
        {visibleCountries.map(country => (
          <section key={country.code} className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={FLAG_URL(country.code)}
                alt=""
                width={24}
                height={18}
                className="rounded-[2px]"
              />
              <h2 className="text-2xl font-bold font-[Cormorant_Garamond,serif]">
                {country.name}
              </h2>
              <span className="text-sm text-[var(--text-muted)]">
                {country.cards.length} {country.cards.length === 1 ? 'postcard' : 'postcards'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {country.cards.map(card => (
                <article
                  key={card.id}
                  className="group overflow-hidden rounded-lg border border-[var(--border-card)] bg-[var(--surface-card)] shadow-[var(--shadow-surface)] transition hover:border-[var(--border-card-strong)]"
                >
                  {/* Card image */}
                  {hasImage(card) ? (
                    <button
                      onClick={() => setLightbox(card)}
                      className="flex h-52 w-full cursor-pointer items-center justify-center overflow-hidden bg-[var(--surface-card-grid)]"
                      type="button"
                    >
                      <img
                        src={card.image_url}
                        alt={`Postcard ${card.id}`}
                        loading="lazy"
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                      />
                    </button>
                  ) : (
                    <div className="flex h-52 w-full items-center justify-center bg-[var(--surface-card-grid)]">
                      <span className="text-xs text-[var(--text-muted)] opacity-60">No image</span>
                    </div>
                  )}

                  {/* Card info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--accent)]">
                        {card.id}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {card.city_sent}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                      <span>{card.date_sent}</span>
                      {card.days_in_transit != null && (
                        <span>{card.days_in_transit}d in transit</span>
                      )}
                      {card.distance_km != null && (
                        <span>{card.distance_km.toLocaleString()} km</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                      <span className="opacity-70">to</span>{' '}
                      {card.recipient_country}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-backdrop)] p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-lg border border-[var(--border-lightbox)] bg-[var(--surface-card)] shadow-overlay"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-[var(--surface-backdrop-compact)] px-3 py-1 text-sm text-[var(--text-primary)] transition hover:bg-[var(--surface-backdrop-compact-hover)]"
                type="button"
              >
                &times;
              </button>
              {hasImage(lightbox) ? (
                <img
                  src={lightbox.image_url}
                  alt={`Postcard ${lightbox.id}`}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-[var(--surface-card-grid)]">
                  <span className="text-sm text-[var(--text-muted)]">No image uploaded</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold">{lightbox.id}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {lightbox.city_sent}, {lightbox.country_name}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                  <span>Sent: {lightbox.date_sent}</span>
                  <span>Received: {lightbox.received_date}</span>
                  {lightbox.days_in_transit != null && (
                    <span>{lightbox.days_in_transit} days in transit</span>
                  )}
                  {lightbox.distance_km != null && (
                    <span>{lightbox.distance_km.toLocaleString()} km</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  To: {lightbox.recipient_country}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
