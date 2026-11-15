/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Real Bilingual Global Location Search & Geocoding Service
 * Combines OpenStreetMap Nominatim (native Arabic + English + bounding boxes)
 * and Open-Meteo Geocoding API without any synthetic/mock coordinates.
 */

export interface GeocodedLocation {
  id: number | string;
  name: string;
  admin1: string;
  admin2: string;
  country: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
  display: string;
  formattedLabel: string;
  placeType?: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
  source?: 'nominatim' | 'open-meteo';
}

export interface SearchLocationResponse {
  results: GeocodedLocation[];
  error?: 'network_error';
}

export function normalizeText(text: string): string {
  if (!text) return '';
  return text.normalize('NFKC').trim().toLowerCase();
}

export function formatLocationDisplay(item: {
  name?: string;
  admin2?: string;
  admin1?: string;
  country?: string;
}): string {
  const parts = [
    item.name || 'Unknown',
    item.admin2 || '',
    item.admin1 || '',
    item.country || ''
  ].filter(Boolean);

  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.join(', ');
}

function mapOpenMeteoFeatureType(featureCode?: string): string {
  if (!featureCode) return 'city';
  if (featureCode.startsWith('PCLI') || featureCode.startsWith('PCL')) return 'country';
  if (featureCode === 'ADM1') return 'state';
  if (featureCode === 'ADM2' || featureCode === 'ADM3') return 'county';
  if (featureCode === 'PPLC' || featureCode === 'PPLA' || featureCode === 'PPL') return 'city';
  if (featureCode === 'PPLX') return 'suburb';
  return 'place';
}

// 1-Hour TTL Cache Store
interface CacheEntry {
  data: GeocodedLocation[];
  timestamp: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3600 * 1000;

async function queryNominatim(query: string, lang: 'ar' | 'en'): Promise<GeocodedLocation[]> {
  const encoded = encodeURIComponent(query.trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=jsonv2&addressdetails=1&limit=12&accept-language=${lang},en`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) return [];

    return items
      .filter((item: any) => item.lat !== undefined && item.lon !== undefined)
      .map((item: any) => {
        const addr = item.address || {};
        const name =
          item.name ||
          addr.city ||
          addr.town ||
          addr.village ||
          addr.state ||
          addr.country ||
          (typeof item.display_name === 'string' ? item.display_name.split(',')[0].trim() : 'Unknown');

        const admin2 = addr.county || addr.city_district || addr.suburb || '';
        const admin1 = addr.state || addr.region || addr.province || addr.governorate || '';
        const country = addr.country || '';
        const display = formatLocationDisplay({ name, admin2, admin1, country }) || item.display_name || name;

        let boundingBox: [number, number, number, number] | undefined;
        if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
          const parsed = item.boundingbox.map((v: string) => parseFloat(v));
          if (parsed.every((n: number) => !Number.isNaN(n))) {
            boundingBox = [parsed[0], parsed[1], parsed[2], parsed[3]];
          }
        }

        const placeType = item.addresstype || item.type || item.category || 'place';

        return {
          id: `nom_${item.place_id || `${item.lat}_${item.lon}`}`,
          name,
          admin1,
          admin2,
          country,
          latitude: parseFloat(parseFloat(item.lat).toFixed(4)),
          longitude: parseFloat(parseFloat(item.lon).toFixed(4)),
          countryCode: (addr.country_code || '').toUpperCase(),
          display,
          formattedLabel: display,
          placeType,
          boundingBox,
          source: 'nominatim' as const,
        };
      });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function queryOpenMeteo(query: string, lang: 'ar' | 'en'): Promise<GeocodedLocation[]> {
  const encoded = encodeURIComponent(query.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=50&language=${lang}&format=json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo Geocoding HTTP ${response.status}`);
    }

    const json = await response.json();
    const rawResults = json?.results || [];

    return rawResults.map((item: any) => {
      const name = item.name || 'Unknown';
      const admin1 = item.admin1 || '';
      const admin2 = item.admin2 || '';
      const country = item.country || '';
      const display = formatLocationDisplay({ name, admin2, admin1, country });

      return {
        id: `om_${item.id || `${item.latitude}_${item.longitude}_${name}`}`,
        name,
        admin1,
        admin2,
        country,
        latitude: parseFloat(item.latitude.toFixed(4)),
        longitude: parseFloat(item.longitude.toFixed(4)),
        countryCode: item.country_code || '',
        display,
        formattedLabel: display,
        placeType: mapOpenMeteoFeatureType(item.feature_code),
        source: 'open-meteo' as const,
      };
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function deduplicateLocations(items: GeocodedLocation[]): GeocodedLocation[] {
  const unique: GeocodedLocation[] = [];
  for (const item of items) {
    const duplicate = unique.find(
      (existing) =>
        Math.abs(existing.latitude - item.latitude) < 0.04 &&
        Math.abs(existing.longitude - item.longitude) < 0.04 &&
        normalizeText(existing.name) === normalizeText(item.name)
    );
    if (!duplicate) {
      unique.push(item);
    }
  }
  return unique;
}

/**
 * Executes real global geographic search returning exact results or explicit empty/error state.
 * Never returns dummy or fabricated fallback coordinates.
 */
export async function searchLocationDetailed(
  query: string,
  lang: 'ar' | 'en' = 'en'
): Promise<SearchLocationResponse> {
  const normalized = normalizeText(query);
  if (!normalized) return { results: [] };

  const cacheKey = `${normalized}_${lang}`;
  const now = Date.now();
  const cached = searchCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { results: cached.data };
  }

  const trimmed = query.trim();
  const [nomRes, omRes] = await Promise.allSettled([
    queryNominatim(trimmed, lang),
    queryOpenMeteo(trimmed, lang),
  ]);

  const nomSucceeded = nomRes.status === 'fulfilled';
  const omSucceeded = omRes.status === 'fulfilled';

  if (!nomSucceeded && !omSucceeded) {
    console.warn(`Global location search failed for "${query}"`);
    return { results: [], error: 'network_error' };
  }

  const nomList = nomSucceeded ? nomRes.value : [];
  const omList = omSucceeded ? omRes.value : [];

  // Prioritize Nominatim results (native bilingual + bounding boxes) followed by Open-Meteo
  const merged = deduplicateLocations([...nomList, ...omList]);

  searchCache.set(cacheKey, { data: merged, timestamp: now });
  return { results: merged };
}

/**
 * Compatibility wrapper returning GeocodedLocation[] for existing consumers.
 */
export async function searchLocation(
  query: string,
  lang: 'ar' | 'en' = 'en'
): Promise<GeocodedLocation[]> {
  const res = await searchLocationDetailed(query, lang);
  return res.results;
}
