#!/usr/bin/env node
/**
 * Fetches postcard data from postcrossing.com and caches it locally.
 *
 * Usage:
 *   node scripts/fetch-travel-postcards.mjs
 *
 * Reads IDs from  src/data/travel-ids.txt  (one per line).
 * Writes results to  src/data/travel-postcards.json.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseHTML } from 'node-html-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const IDS_FILE = resolve(ROOT, 'src/data/travel-ids.txt');
const OUT_FILE = resolve(ROOT, 'src/data/travel-postcards.json');

const USER_AGENT = 'personal project amarranta.github.io/cardgallery';
const DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function loadCache() {
  if (!existsSync(OUT_FILE)) {
    return { home_country_code: 'NL', generated_at: '', postcards: {} };
  }
  try {
    return JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
  } catch {
    return { home_country_code: 'NL', generated_at: '', postcards: {} };
  }
}

function loadIds() {
  if (!existsSync(IDS_FILE)) {
    console.error(`[error] ID file not found: ${IDS_FILE}`);
    process.exit(1);
  }
  return readFileSync(IDS_FILE, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !l.startsWith('#'));
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a single postcard page from postcrossing.com.
 *
 * The page uses schema.org microdata:
 *   - .sender / .receiver blocks with a[itemprop="addressCountry"] for country
 *     (title attr = city, text = country name)
 *   - a[itemprop="url"] inside each block for username
 *   - time[itemprop="startTime"] / time[itemprop="endTime"] for dates
 *   - Plain text "N days" / "N km" near icons for transit info
 *   - img.postcard-image for the card image
 */
function parsePostcard(html, id) {
  const root = parseHTML(html);

  const country_code = id.split('-')[0];

  // --- Image ---
  const imgEl = root.querySelector('img.postcard-image')
    || root.querySelector('img[itemprop="image"]')
    || root.querySelector('img[alt*="postcard image"]');
  let image_url = imgEl?.getAttribute('src') || '';
  if (image_url.startsWith('//')) image_url = 'https:' + image_url;

  // --- Sender block ---
  const senderBlock = root.querySelector('.sender') || root.querySelector('.details-box');
  const senderCountryEl = senderBlock?.querySelector('a[itemprop="addressCountry"]')
    || root.querySelectorAll('a[itemprop="addressCountry"]')[0];
  const country_name = senderCountryEl?.text?.trim() || '';
  const city_sent = senderCountryEl?.getAttribute('title')?.trim() || '';

  const senderUserEl = senderBlock?.querySelector('a[itemprop="url"]')
    || root.querySelectorAll('a[itemprop="url"]')[0];
  const sender_username = senderUserEl?.text?.trim() || '';

  // --- Recipient block ---
  const receiverBlock = root.querySelector('.receiver');
  const recipientCountryEl = receiverBlock?.querySelector('a[itemprop="addressCountry"]')
    || root.querySelectorAll('a[itemprop="addressCountry"]')[1];
  const recipient_country = recipientCountryEl?.text?.trim() || '';
  const recipient_city = recipientCountryEl?.getAttribute('title')?.trim() || '';

  const recipientUserEl = receiverBlock?.querySelector('a[itemprop="url"]')
    || root.querySelectorAll('a[itemprop="url"]')[1];
  const recipient_username = recipientUserEl?.text?.trim() || '';

  // --- Dates via <time> elements ---
  const startTimeEl = root.querySelector('time[itemprop="startTime"]');
  const endTimeEl = root.querySelector('time[itemprop="endTime"]');
  const date_sent = startTimeEl?.text?.trim() || '';
  const received_date = endTimeEl?.text?.trim() || '';

  // --- Days in transit & distance from full text ---
  const fullText = root.text;

  const daysMatch = fullText.match(/(\d+)\s*days?/i);
  const days_in_transit = daysMatch ? parseInt(daysMatch[1], 10) : null;

  // Distance is in km on postcrossing.com
  const distMatch = fullText.match(/([\d,]+)\s*km/i);
  const distance_km = distMatch ? parseInt(distMatch[1].replace(/,/g, ''), 10) : null;

  return {
    id,
    country_code,
    country_name,
    city_sent,
    date_sent,
    days_in_transit,
    distance_km,
    sender_username,
    recipient_username,
    recipient_country,
    recipient_city,
    received_date,
    image_url
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const ids = loadIds();
  if (ids.length === 0) {
    console.log('[info] No IDs to process.');
    return;
  }

  const cache = loadCache();
  let fetched = 0;
  let skipped = 0;

  for (const id of ids) {
    if (cache.postcards[id]) {
      console.log(`[skip] ${id} (already cached)`);
      skipped++;
      continue;
    }

    console.log(`[fetch] ${id} ...`);
    try {
      const res = await fetch(`https://www.postcrossing.com/postcards/${id}`, {
        headers: { 'User-Agent': USER_AGENT }
      });

      if (!res.ok) {
        console.error(`[error] ${id} — HTTP ${res.status}`);
        continue;
      }

      const html = await res.text();
      const parsed = parsePostcard(html, id);
      cache.postcards[id] = parsed;
      fetched++;

      console.log(`  -> ${parsed.country_name || '?'}, ${parsed.city_sent || '?'}`);
    } catch (err) {
      console.error(`[error] ${id} — ${err.message}`);
    }

    // Polite delay between requests
    if (ids.indexOf(id) < ids.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  cache.generated_at = new Date().toISOString();
  writeFileSync(OUT_FILE, JSON.stringify(cache, null, 2) + '\n');

  console.log(`\n[done] Fetched: ${fetched}, Skipped: ${skipped}, Total: ${Object.keys(cache.postcards).length}`);
  console.log(`[done] Written to ${OUT_FILE}`);
}

main();
