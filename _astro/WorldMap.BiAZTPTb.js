import{j as e}from"./jsx-runtime.TBa3i5EZ.js";import{r as c}from"./index.CVf8TyFT.js";import{L as N}from"./leaflet-src.MYkDrVhZ.js";/* empty css                        */import{g as le,t as f,a as E}from"./index.CJgWp_iR.js";function G(s){const t=String(s||"").trim().toLowerCase();return t?t.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim():""}function H(s){const t=String(s||"").trim().toLowerCase();if(!t)return"";const l=t.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();return l==="lisboa"?"lisbon":l}function pe(s){return s?s.endsWith("/")?s:`${s}/`:"/"}function J(){if(typeof window>"u")return{borderColor:"rgba(158, 181, 137, 0.55)",visitedFill:"rgba(158, 181, 137, 0.22)"};const t=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()||"#a8c99b",h=(l,d)=>{const m=parseInt(l.slice(1,3),16),g=parseInt(l.slice(3,5),16),k=parseInt(l.slice(5,7),16);return`rgba(${m}, ${g}, ${k}, ${d})`};return{borderColor:h(t,.55),visitedFill:h(t,.22)}}function X(s){const t=s==="filled"?"map-marker map-marker--filled":"map-marker map-marker--outline";return N.divIcon({className:"map-marker-icon",html:`<span class="${t}"></span>`,iconSize:[14,14],iconAnchor:[7,7],popupAnchor:[0,-8],tooltipAnchor:[0,-7]})}function Z(s){const t=s?.properties;if(!t||typeof t!="object")return null;const h=[t.ISO_A2,t.iso_a2,t.ISO2,t["ISO-3166-1-Alpha-2"],t.country_code];for(const l of h){const d=typeof l=="string"?l.trim():"";if(!d||d==="-99")continue;const m=d.toUpperCase();if(m.length===2)return m}return null}function q(s){const t=s?.properties;if(!t||typeof t!="object")return null;const h=[t.ADM0_A3,t.ISO_A3,t.iso_a3,t.SOV_A3,t.SU_A3];for(const d of h){const m=typeof d=="string"?d.trim():"";if(!m||m==="-99")continue;const g=m.toUpperCase();if(g.length===3)return g}const l=typeof s?.id=="string"?s.id.trim().toUpperCase():"";return l&&l.length===3?l:null}function de(s){const t=s?.properties;if(!t||typeof t!="object")return!1;const h=[t.ADMIN,t.admin,t.NAME,t.name,t.SOVEREIGNT,t.sovereignt];for(const d of h)if((typeof d=="string"?d.trim().toLowerCase():"")==="antarctica")return!0;const l=[t.ADM0_A3,t.ISO_A3,t.iso_a3];for(const d of l)if((typeof d=="string"?d.trim().toUpperCase():"")==="ATA")return!0;return!1}function me(s,t,h){const l=document.createElement("div");l.className="map-popup";const d=document.createElement("div");d.className="map-popup__title",d.textContent=s.city,l.appendChild(d);const m=document.createElement("div");m.className="map-popup__sub";const g=[s.countryName,s.countryCode].filter(Boolean),k=(s.description||t?.metadataDesc||t?.description||"").trim();if(k&&g.push(k),m.textContent=g.join(" • "),l.appendChild(m),!t){const w=document.createElement("div");return w.className="map-popup__empty",w.textContent=f(h,"map.popup.noPostcard"),l.appendChild(w),l}const y=document.createElement("img");y.className="map-popup__img",y.loading="lazy",y.decoding="async",y.alt=t.title?`${t.title}`:s.city;const S=typeof window<"u"&&window.matchMedia("(max-width: 640px)").matches,C=t.mapCompactUrl||t.mapUrl||t.thumbUrl||t.previewUrl||"",z=t.previewUrl||t.mapUrl||t.thumbUrl||"";if(y.src=S?C:z,!S&&(t.mapCompactUrl||t.mapUrl)&&t.previewUrl){const w=[t.mapCompactUrl?`${t.mapCompactUrl} 400w`:null,t.mapUrl?`${t.mapUrl} 800w`:null,`${t.previewUrl} 1200w`].filter(Boolean);y.srcset=w.join(", "),y.sizes="min(520px, 45vw)"}return l.appendChild(y),l}function ye(s){const t=c.useMemo(()=>le(),[]),h=c.useMemo(()=>pe(s.baseUrl),[s.baseUrl]),l=c.useRef(null),d=c.useRef(null),m=c.useRef(null),g=c.useRef(new Map),k=c.useRef([]),y=c.useRef(null),S=c.useRef(null),[C,z]=c.useState(!0),[w,Q]=c.useState(!0),[A,Y]=c.useState(!0),[L,R]=c.useState(""),[O,U]=c.useState("idle"),[M,I]=c.useState(!1),[T,F]=c.useState(!1);c.useRef(null);const ee=c.useMemo(()=>{const r=new Map;for(const o of s.postcards||[])o?.id&&r.set(o.id,o);return r},[s.postcards]),$=c.useMemo(()=>{const r=new Set;for(const o of s.points||[])o?.countryCode&&r.add(o.countryCode.toUpperCase());return r},[s.points]),te=c.useMemo(()=>{const r=new Set;for(const o of s.points||[]){const a=G(o?.countryName||"");a&&(r.add(a),a==="czechia"&&r.add("czech republic"),a==="united states"&&r.add("united states of america"),a==="serbia"&&r.add("republic of serbia"))}return r},[s.points]);function re(r){const o=r?.properties;if(!o||typeof o!="object")return null;const a=[o.ADMIN,o.admin,o.NAME,o.name,o.NAME_LONG,o.name_long,o.name];for(const p of a){const n=typeof p=="string"?p.trim():"";if(n)return n}return null}function B(r){const o=Z(r);if(o&&$.has(o))return!0;const a=G(re(r)||"");if(a&&te.has(a))return!0;const p=q(r);if(!p)return!1;const n=g.current;for(const u of $)if((n.get(u)||ne[u])===p)return!0;return!1}const oe=c.useMemo(()=>{const r=new Map;for(const o of s.points||[]){const a=(o.countryCode||"").toUpperCase();if(!a)continue;const p=(o.countryName||"").trim();r.has(a)||r.set(a,p||a)}return Array.from(r.entries()).map(([o,a])=>({code:o,name:a})).sort((o,a)=>o.name.localeCompare(a.name,void 0,{sensitivity:"base"}))},[s.points]),P=c.useMemo(()=>{const r=s.points||[],o=new Set;let a=0,p=0;for(const n of r)!Number.isFinite(n?.lat)||!Number.isFinite(n?.lng)||(p++,n.countryCode&&o.add(n.countryCode.toUpperCase()),n.postcardId&&a++);return{countries:o.size,places:p,postcards:a}},[s.points]),D=c.useMemo(()=>{const r=s.points||[],o={},a={};for(const n of r){if(!Number.isFinite(n?.lat)||!Number.isFinite(n?.lng))continue;const u=n.countryName||n.countryCode||"Unknown",x={city:n.city||"Unknown",postcardId:n.postcardId||null};n.postcardId?(o[u]||(o[u]=[]),o[u].push(x)):(a[u]||(a[u]=[]),a[u].push(x))}const p=n=>Object.keys(n).sort((u,x)=>u.localeCompare(x)).map(u=>({country:u,cities:n[u].sort((x,i)=>x.city.localeCompare(i.city))}));return{withPostcards:p(o),withoutPostcards:p(a)}},[s.points]),ae=c.useCallback(r=>{const o=d.current;if(!o||!r){o?.setView([20,0],2);return}const a=k.current.filter(n=>n.countryCode===r);if(a.length===0)return;const p=N.latLngBounds(a.map(n=>[n.point.lat,n.point.lng]));o.fitBounds(p,{padding:[50,50],maxZoom:6})},[]),se=c.useCallback(()=>{R(""),d.current?.setView([20,0],2),I(!1)},[]),ne={RS:"SRB",XK:"XKX",TW:"TWN",PS:"PSE",EH:"ESH",SS:"SSD"};function V(){const r=d.current,o=y.current,a=S.current;if(!(!r||!o||!a)){if(!C){r.hasLayer(o)&&r.removeLayer(o),r.hasLayer(a)&&r.removeLayer(a);return}w?r.hasLayer(o)||r.addLayer(o):r.hasLayer(o)&&r.removeLayer(o),A?r.hasLayer(a)||r.addLayer(a):r.hasLayer(a)&&r.removeLayer(a),o.clearLayers(),a.clearLayers();for(const p of k.current)L&&p.countryCode!==L||(p.hasPostcard?w&&o.addLayer(p.marker):A&&a.addLayer(p.marker))}}async function ie(){const r=d.current;if(!r)return;const o=`${h}geo/countries.geojson?v=1`;try{U("loading");const a=await fetch(o,{credentials:"same-origin"});if(!a.ok)throw new Error(`GeoJSON request failed: ${a.status}`);const p=await a.json();try{const x=new Map,i=Array.isArray(p?.features)?p.features:[];for(const v of i){const b=Z(v),j=q(v);b&&j&&!x.has(b)&&x.set(b,j)}g.current=x}catch{g.current=new Map}m.current&&(m.current.remove(),m.current=null);const n=J(),u=N.geoJSON(p,{filter:x=>!de(x),style:x=>{const i=B(x);return{color:n.borderColor,weight:1,opacity:1,fillColor:i?n.visitedFill:"rgba(255, 255, 255, 0)",fillOpacity:i?1:0}}});u.addTo(r),m.current=u,U("ready")}catch(a){console.warn("[map] Countries GeoJSON missing or invalid:",a),U("missing")}}return c.useEffect(()=>{if(!l.current||d.current)return;const r=N.map(l.current,{zoomControl:!0,attributionControl:!1,worldCopyJump:!0,minZoom:1,maxZoom:7});r.setView([20,0],2),d.current=r,setTimeout(()=>{r.invalidateSize()},0),y.current=N.layerGroup().addTo(r),S.current=N.layerGroup().addTo(r);const o=X("filled"),a=X("outline"),p=Array.isArray(s.points)?s.points:[],n=new Set;for(const i of p){const v=String(i?.countryCode||"").toUpperCase(),b=H(i?.city);if(!v||!b)continue;const j=`${v}:${b}`;i?.postcardId&&n.add(j)}const x=p.filter(i=>Number.isFinite(i?.lat)&&Number.isFinite(i?.lng)).filter(i=>{const v=String(i?.countryCode||"").toUpperCase(),b=H(i?.city);if(!v||!b)return!0;const j=`${v}:${b}`;return!!(i?.postcardId||"").trim()||!!String(i?.description||"").trim()?!0:!n.has(j)}).map(i=>{const v=(i.postcardId||"").trim(),b=v&&ee.get(v)||null,j=!!b,_=N.marker([i.lat,i.lng],{icon:j?o:a,keyboard:!0}),W=me(i,b,t);_.bindPopup(W,{closeButton:!0,autoPan:!0,minWidth:380,maxWidth:520,className:"map-leaflet-popup"});const K="ontouchstart"in window||navigator.maxTouchPoints>0;if(!K&&j&&b){const ce=`
            <div class="map-hover-tooltip">
              <img src="${b.thumbUrl}" alt="${i.city}" class="map-hover-tooltip__img" />
              <div class="map-hover-tooltip__city">${i.city}</div>
            </div>
          `;_.bindTooltip(ce,{direction:"bottom",offset:[0,10],opacity:1,className:"map-hover-tooltip-container"})}else K||_.bindTooltip(i.city,{direction:"bottom",offset:[0,6],opacity:1,className:"map-hover-tooltip-simple"});return{point:i,marker:_,hasPostcard:j,countryCode:(i.countryCode||"").toUpperCase()}});return k.current=x,ie(),V(),()=>{r.remove(),d.current=null,m.current=null,k.current=[],y.current=null,S.current=null}},[]),c.useEffect(()=>{V(),ae(L)},[C,w,A,L]),c.useEffect(()=>{if(m.current){const r=J();m.current.setStyle(o=>{const a=B(o);return{color:r.borderColor,weight:1,opacity:1,fillColor:a?r.visitedFill:"rgba(255, 255, 255, 0)",fillOpacity:a?1:0}})}},[$]),e.jsxs("section",{className:"relative h-full w-full",children:[O==="loading"&&e.jsx("div",{className:"absolute inset-0 z-[1300] flex items-center justify-center bg-paper/80",children:e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[e.jsx("div",{className:"map-spinner"}),e.jsx("span",{className:"text-sm text-muted",children:f(t,"map.loading")})]})}),e.jsx("a",{href:h,className:"absolute right-4 top-4 z-[1201] flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-[var(--surface-header)] text-primary backdrop-blur hover:bg-[var(--surface-tonal)]","aria-label":f(t,"map.backToSite"),title:f(t,"map.backToSite"),children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}),e.jsx("polyline",{points:"9 22 9 12 15 12 15 22"})]})}),L&&e.jsxs("button",{type:"button",onClick:se,className:"absolute right-16 top-4 z-[1201] flex h-10 items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--surface-header)] px-3 text-sm text-primary backdrop-blur hover:bg-[var(--surface-tonal)]","aria-label":f(t,"map.resetView"),children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("circle",{cx:"12",cy:"12",r:"10"}),e.jsx("line",{x1:"22",y1:"12",x2:"18",y2:"12"}),e.jsx("line",{x1:"6",y1:"12",x2:"2",y2:"12"}),e.jsx("line",{x1:"12",y1:"6",x2:"12",y2:"2"}),e.jsx("line",{x1:"12",y1:"22",x2:"12",y2:"18"})]}),e.jsx("span",{className:"hidden sm:inline",children:f(t,"map.resetView")})]}),e.jsx("button",{type:"button",onClick:()=>I(!M),className:"absolute left-2 top-24 z-[1201] flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-panel)] bg-[var(--surface-header)] text-primary backdrop-blur md:hidden","aria-label":"Toggle filters",children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"4",y1:"21",x2:"4",y2:"14"}),e.jsx("line",{x1:"4",y1:"10",x2:"4",y2:"3"}),e.jsx("line",{x1:"12",y1:"21",x2:"12",y2:"12"}),e.jsx("line",{x1:"12",y1:"8",x2:"12",y2:"3"}),e.jsx("line",{x1:"20",y1:"21",x2:"20",y2:"16"}),e.jsx("line",{x1:"20",y1:"12",x2:"20",y2:"3"}),e.jsx("line",{x1:"1",y1:"14",x2:"7",y2:"14"}),e.jsx("line",{x1:"9",y1:"8",x2:"15",y2:"8"}),e.jsx("line",{x1:"17",y1:"16",x2:"23",y2:"16"})]})}),e.jsxs("div",{className:`
        absolute z-[1200] rounded-lg border border-[var(--border-panel)] bg-[var(--surface-header)] text-primary backdrop-blur transition-all
        ${M?"left-4 top-36":"-left-full top-36"}
        w-[calc(100%-2rem)] max-w-[320px] p-3
        md:left-14 md:top-4 md:w-auto md:max-w-[560px] md:p-3
      `,children:[e.jsxs("div",{className:"mb-3 flex items-center gap-2 text-xs text-muted",children:[e.jsx("span",{children:E(t,"map.stats.countries",P.countries)}),e.jsx("span",{children:"•"}),e.jsx("span",{children:E(t,"map.stats.places",P.places)}),e.jsx("span",{children:"•"}),e.jsx("span",{children:E(t,"map.stats.postcards",P.postcards)})]}),e.jsxs("div",{className:"flex flex-col gap-2 text-sm md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-2",children:[e.jsxs("label",{className:"inline-flex items-center gap-2",children:[e.jsx("input",{type:"checkbox",checked:C,onChange:r=>z(r.currentTarget.checked)}),e.jsx("span",{children:f(t,"map.filters.showVisited")})]}),e.jsxs("label",{className:"inline-flex items-center gap-2",children:[e.jsx("input",{type:"checkbox",checked:w,onChange:r=>Q(r.currentTarget.checked),disabled:!C}),e.jsx("span",{children:f(t,"map.filters.showWithPostcards")})]}),e.jsxs("label",{className:"inline-flex items-center gap-2",children:[e.jsx("input",{type:"checkbox",checked:A,onChange:r=>Y(r.currentTarget.checked),disabled:!C}),e.jsx("span",{children:f(t,"map.filters.showMissingPostcards")})]}),e.jsxs("label",{className:"inline-flex items-center gap-2 md:ml-auto",children:[e.jsx("span",{className:"text-muted",children:f(t,"map.filters.country")}),e.jsxs("select",{className:"rounded-md border border-[var(--border-panel)] bg-[var(--surface-tonal)] px-2 py-1",value:L,onChange:r=>R(r.currentTarget.value),disabled:!C,children:[e.jsx("option",{value:"",children:f(t,"map.filters.allCountries")}),oe.map(r=>e.jsx("option",{value:r.code,children:r.name},r.code))]})]})]}),e.jsxs("div",{className:"mt-3 flex items-center gap-4 border-t border-[var(--border-panel)] pt-3 text-xs text-muted",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"map-marker map-marker--filled inline-block"}),e.jsx("span",{children:f(t,"map.legend.hasPostcard")})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("span",{className:"map-marker map-marker--outline inline-block"}),e.jsx("span",{children:f(t,"map.legend.noPostcard")})]})]}),O==="missing"&&e.jsxs("div",{className:"mt-2 text-xs text-muted",children:["Countries layer missing: place ",e.jsx("code",{children:"public/geo/countries.geojson"})]})]}),M&&e.jsx("div",{className:"absolute inset-0 z-[1199] bg-black/20 md:hidden",onClick:()=>I(!1)}),e.jsxs("button",{type:"button",onClick:()=>F(!T),className:"absolute bottom-4 right-4 z-[1201] flex h-10 items-center gap-2 rounded-lg border border-[var(--border-panel)] bg-[var(--surface-header)] px-3 text-sm text-primary backdrop-blur hover:bg-[var(--surface-tonal)]","aria-label":f(t,"map.placesList.toggle"),children:[e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"8",y1:"6",x2:"21",y2:"6"}),e.jsx("line",{x1:"8",y1:"12",x2:"21",y2:"12"}),e.jsx("line",{x1:"8",y1:"18",x2:"21",y2:"18"}),e.jsx("line",{x1:"3",y1:"6",x2:"3.01",y2:"6"}),e.jsx("line",{x1:"3",y1:"12",x2:"3.01",y2:"12"}),e.jsx("line",{x1:"3",y1:"18",x2:"3.01",y2:"18"})]}),e.jsx("span",{className:"hidden sm:inline",children:f(t,"map.placesList.toggle")})]}),e.jsxs("div",{className:`
        absolute z-[1202] transition-all duration-300 ease-in-out
        ${T?"right-0":"-right-full"}
        bottom-0 top-0 w-80 max-w-[85vw]
        border-l border-[var(--border-panel)] bg-[var(--surface-sidebar)] backdrop-blur
        flex flex-col shadow-lg
      `,children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-[var(--border-panel)] p-3",children:[e.jsx("h3",{className:"font-semibold text-primary",children:f(t,"map.placesList.title")}),e.jsx("button",{type:"button",onClick:()=>F(!1),className:"flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--surface-sidebar-hover)]",children:e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),e.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 text-sm",children:[e.jsxs("details",{open:!0,className:"mb-4",children:[e.jsxs("summary",{className:"mb-2 cursor-pointer font-medium text-primary",children:[f(t,"map.placesList.withPostcards")," (",P.postcards,")"]}),e.jsx("div",{className:"space-y-3 pl-2",children:D.withPostcards.map(r=>e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-semibold text-muted",children:r.country}),e.jsx("ul",{className:"mt-1 space-y-0.5",children:r.cities.map((o,a)=>e.jsxs("li",{className:"flex items-center gap-1.5 text-primary",children:[e.jsx("span",{className:"map-marker map-marker--filled inline-block flex-shrink-0",style:{width:"8px",height:"8px"}}),e.jsx("span",{children:o.city})]},a))})]},r.country))})]}),e.jsxs("details",{className:"mb-4",children:[e.jsxs("summary",{className:"mb-2 cursor-pointer font-medium text-primary",children:[f(t,"map.placesList.withoutPostcards")," (",P.places-P.postcards,")"]}),e.jsx("div",{className:"space-y-3 pl-2",children:D.withoutPostcards.map(r=>e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-semibold text-muted",children:r.country}),e.jsx("ul",{className:"mt-1 space-y-0.5",children:r.cities.map((o,a)=>e.jsxs("li",{className:"flex items-center gap-1.5 text-primary",children:[e.jsx("span",{className:"map-marker map-marker--outline inline-block flex-shrink-0",style:{width:"8px",height:"8px"}}),e.jsx("span",{children:o.city})]},a))})]},r.country))})]})]})]}),T&&e.jsx("div",{className:"absolute inset-0 z-[1201] bg-black/30 md:bg-black/10",onClick:()=>F(!1)}),e.jsx("div",{ref:l,className:"map-canvas h-full w-full"}),e.jsx("style",{children:`
        .map-canvas {
          background: var(--paper);
        }

        .map-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border-panel);
          border-top-color: var(--accent);
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
          background: var(--accent);
          border: 1px solid var(--accent);
        }
        .map-marker--outline {
          background: var(--paper);
          border: 2px solid var(--accent);
        }

        .map-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          background: var(--surface-header);
          border: 1px solid var(--border-panel);
          box-shadow: var(--shadow-surface);
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
          border: 1px solid var(--border-panel);
          background: var(--surface-tonal);
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
          background: var(--surface-header);
          border: 1px solid var(--border-panel);
          border-radius: 8px;
          box-shadow: var(--shadow-surface);
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
          background: var(--surface-header) !important;
          border: 1px solid var(--border-panel) !important;
          border-radius: 6px !important;
          box-shadow: var(--shadow-surface) !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: var(--text-primary) !important;
        }
        .map-hover-tooltip-simple::before {
          border-bottom-color: var(--surface-header) !important;
        }

        /* Leaflet zoom controls */
        .leaflet-control-zoom {
          border: 1px solid var(--border-panel) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          background: var(--surface-header) !important;
          color: var(--text-primary) !important;
          border-bottom: 1px solid var(--border-panel) !important;
        }
        .leaflet-control-zoom a:hover {
          background: var(--surface-tonal) !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }

        /* Popup close button */
        .map-leaflet-popup .leaflet-popup-close-button {
          color: var(--text-muted) !important;
        }
        .map-leaflet-popup .leaflet-popup-close-button:hover {
          color: var(--text-primary) !important;
        }
        .map-leaflet-popup .leaflet-popup-tip {
          background: var(--surface-header) !important;
        }
      `})]})}export{ye as default};
