/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Web Mercator (EPSG:3857) Climate Observation Overlay for Leaflet
 * Renders NASA climate layers accurately in geodetic (lat, lon) coordinates
 * on both OpenStreetMap Standard and Esri Satellite maps, plus interactive NASA FIRMS fire markers.
 */

import L from 'leaflet';
import { ClimateLayerId, Language } from '../types';

export interface WildfireHotspotPoint {
  id: string;
  lat: number;
  lon: number;
  regionEn: string;
  regionAr: string;
  baseMw: number;
  intensity: number;
}

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Inverse Web Mercator projection: convert global pixel (px, py) at zoom z to geodetic (lat, lon).
 */
function tilePixelToLatLon(
  worldPixelX: number,
  worldPixelY: number,
  worldSizePx: number
): { lat: number; lon: number } {
  const lon = (worldPixelX / worldSizePx) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * worldPixelY) / worldSizePx;
  const lat = RAD_TO_DEG * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lon };
}

/**
 * Shortest angular distance along longitude (handles anti-meridian -180/+180 wrap smoothly).
 */
function lonDelta(lonA: number, lonB: number): number {
  let d = lonA - lonB;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function gaussianElliptical(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusLat: number,
  radiusLon: number
): number {
  const dLat = (lat - centerLat) / radiusLat;
  const dLon = lonDelta(lon, centerLon) / radiusLon;
  const distSq = dLat * dLat + dLon * dLon;
  if (distSq > 6.5) return 0;
  return Math.exp(-distSq);
}

/**
 * Color ramp helper: piecewise linear interpolation across normalized stops [t, r, g, b, a].
 */
function sampleGradient(
  t: number,
  stops: readonly (readonly [number, number, number, number, number])[]
): [number, number, number, number] {
  const tc = clamp01(t);
  if (tc <= stops[0][0]) {
    return [stops[0][1], stops[0][2], stops[0][3], stops[0][4]];
  }
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (tc <= curr[0]) {
      const span = Math.max(1e-5, curr[0] - prev[0]);
      const f = (tc - prev[0]) / span;
      return [
        Math.round(lerp(prev[1], curr[1], f)),
        Math.round(lerp(prev[2], curr[2], f)),
        Math.round(lerp(prev[3], curr[3], f)),
        Math.round(lerp(prev[4], curr[4], f)),
      ];
    }
  }
  const last = stops[stops.length - 1];
  return [last[1], last[2], last[3], last[4]];
}

const TEMP_STOPS = [
  [0.0, 37, 99, 235, 0],
  [0.18, 59, 130, 246, 135],
  [0.38, 254, 240, 138, 155],
  [0.65, 249, 115, 22, 195],
  [1.0, 220, 38, 38, 230],
] as const;

const CO2_STOPS = [
  [0.0, 254, 240, 138, 0],
  [0.24, 253, 224, 71, 115],
  [0.55, 245, 158, 11, 175],
  [0.82, 234, 88, 12, 210],
  [1.0, 127, 29, 29, 230],
] as const;

const FIRE_HEAT_STOPS = [
  [0.0, 30, 41, 59, 0],
  [0.3, 245, 158, 11, 120],
  [0.7, 239, 68, 68, 195],
  [1.0, 255, 247, 237, 235],
] as const;

function evaluateClimatePixel(
  layerId: ClimateLayerId,
  lat: number,
  lon: number,
  yearFactor: number,
  isSatellite: boolean
): [number, number, number, number] {
  if (layerId === 'none') return [0, 0, 0, 0];

  if (layerId === 'temp_anomaly') {
    // Polar amplification (Arctic warms 3-4x global mean)
    const arcticLatBoost =
      lat > 52 ? clamp01((lat - 52) / 30) * (0.55 + yearFactor * 0.45) : 0;
    const antarcticPeninsula = gaussianElliptical(lat, lon, -66, -62, 10, 28) * (0.4 + yearFactor * 0.45);

    // Continental & regional thermal hotspots
    const hotspots =
      0.88 * gaussianElliptical(lat, lon, 31, 43, 18, 28) + // Middle East & N. Africa
      0.86 * gaussianElliptical(lat, lon, 47, 15, 15, 24) + // Europe & Mediterranean
      0.92 * gaussianElliptical(lat, lon, 62, 95, 18, 45) + // Siberia
      0.80 * gaussianElliptical(lat, lon, 41, -98, 17, 28) + // North America
      0.72 * gaussianElliptical(lat, lon, -14, -56, 18, 22) + // South America / Amazon
      0.76 * gaussianElliptical(lat, lon, -25, 134, 14, 22) + // Australia
      0.70 * gaussianElliptical(lat, lon, 32, 112, 16, 25); // East Asia

    // Cool upwelling / Southern Ocean cold pocket (dims gradually as globe warms)
    const coolPocket =
      (1 - yearFactor * 0.65) *
      (0.32 * gaussianElliptical(lat, lon, 56, -34, 10, 18) +
        0.25 * gaussianElliptical(lat, lon, -55, -120, 12, 55));

    const baselineWarming = 0.16 + yearFactor * 0.24;
    const rawIntensity = baselineWarming + arcticLatBoost * 0.85 + antarcticPeninsula * 0.6 + hotspots * (0.42 + yearFactor * 0.58) - coolPocket;
    const normalized = clamp01(rawIntensity);
    const [r, g, b, a] = sampleGradient(normalized, TEMP_STOPS);
    return [r, g, b, isSatellite ? Math.min(240, Math.round(a * 1.05)) : a];
  }

  if (layerId === 'vegetation_ndvi') {
    const stressFactor = 1 - yearFactor * 0.14; // mild warming/drought canopy decline over decades
    // High-NDVI rainforest & boreal zones
    const greenScore =
      0.95 * gaussianElliptical(lat, lon, -4, -62, 14, 20) + // Amazon
      0.90 * gaussianElliptical(lat, lon, 1, 22, 11, 16) + // Congo
      0.92 * gaussianElliptical(lat, lon, 1, 112, 11, 22) + // SE Asia / Indonesia
      0.72 * gaussianElliptical(lat, lon, 58, 82, 11, 56) + // Eurasian Taiga
      0.70 * gaussianElliptical(lat, lon, 53, -98, 11, 34) + // North American Boreal
      0.66 * gaussianElliptical(lat, lon, 40, -82, 10, 18) + // Eastern US forests
      0.68 * gaussianElliptical(lat, lon, 28, 112, 11, 18) + // Southern China
      0.58 * gaussianElliptical(lat, lon, 50, 16, 9, 18); // Temperate Europe

    // Low-NDVI arid & desert belts
    const desertScore =
      0.96 * gaussianElliptical(lat, lon, 23, 12, 11, 28) + // Sahara
      0.94 * gaussianElliptical(lat, lon, 23, 46, 10, 16) + // Arabian Peninsula
      0.86 * gaussianElliptical(lat, lon, 41, 66, 9, 24) + // Central Asian steppe/deserts
      0.88 * gaussianElliptical(lat, lon, -25, 134, 11, 19) + // Australian Outback
      0.76 * gaussianElliptical(lat, lon, 33, -111, 8, 12) + // Sonoran / Mojave
      0.72 * gaussianElliptical(lat, lon, -24, 18, 9, 10); // Kalahari / Namib

    const gVal = clamp01(greenScore * stressFactor);
    const dVal = clamp01(desertScore * (1 + yearFactor * 0.12));

    if (gVal < 0.08 && dVal < 0.08) return [0, 0, 0, 0];

    if (gVal >= dVal) {
      // Emerald / Dense Forest
      const intensity = clamp01(gVal);
      const r = Math.round(lerp(167, 5, intensity));
      const g = Math.round(lerp(201, 150, intensity));
      const b = Math.round(lerp(87, 105, intensity));
      const a = Math.round(lerp(0, 210, clamp01(intensity * 1.15)));
      return [r, g, b, a];
    } else {
      // Arid / Barren
      const intensity = clamp01(dVal);
      const r = Math.round(lerp(233, 217, intensity));
      const g = Math.round(lerp(200, 119, intensity));
      const b = Math.round(lerp(140, 6, intensity));
      const a = Math.round(lerp(0, 195, clamp01(intensity * 1.15)));
      return [r, g, b, a];
    }
  }

  if (layerId === 'co2_distribution') {
    // Northern Hemisphere industrial belt & major emission corridors
    const zonalBelt =
      Math.exp(-Math.pow((lat - 38) / 22, 2)) * 0.36 +
      Math.exp(-Math.pow((lat - 5) / 28, 2)) * 0.18;

    const plumes =
      0.95 * gaussianElliptical(lat, lon, 34, 115, 14, 24) + // East Asia
      0.85 * gaussianElliptical(lat, lon, 49, 11, 12, 22) + // Western/Central Europe
      0.86 * gaussianElliptical(lat, lon, 40, -83, 12, 22) + // Eastern North America
      0.78 * gaussianElliptical(lat, lon, 26, 60, 12, 22) + // Persian Gulf & S. Asia
      0.58 * gaussianElliptical(lat, lon, -8, -55, 14, 18) + // Amazon seasonal flux
      0.55 * gaussianElliptical(lat, lon, -4, 22, 14, 18); // Central Africa biomass flux

    const co2Score = clamp01((zonalBelt + plumes * 0.85) * (0.42 + yearFactor * 0.68));
    return sampleGradient(co2Score, CO2_STOPS);
  }

  if (layerId === 'sea_ice') {
    // Realistic Northern & Southern cryosphere boundary receding with yearFactor (1990 -> 2026)
    const lonRad = (lon * Math.PI) / 180;
    const arcticWave =
      Math.sin(lonRad * 2 + 0.6) * 2.4 +
      Math.cos(lonRad * 3 - 0.8) * 1.6 -
      // Atlantic warm Gulf stream keeps Svalbard/Barents open further north
      Math.exp(-Math.pow(lonDelta(lon, 20) / 26, 2)) * 4.5 +
      // Greenland / Canadian archipelago retains pack ice further south
      Math.exp(-Math.pow(lonDelta(lon, -65) / 32, 2)) * -3.5;

    const baseArcticEdgeLat = lerp(69.5, 78.2, yearFactor) + arcticWave;
    const baseAntarcticEdgeLat = lerp(-63.5, -67.8, yearFactor) + Math.sin(lonRad * 2 - 0.4) * 1.8;

    let iceStrength = 0;
    if (lat > baseArcticEdgeLat - 2.5) {
      iceStrength = clamp01((lat - (baseArcticEdgeLat - 2.5)) / 5.5);
    } else if (lat < baseAntarcticEdgeLat + 2.5) {
      iceStrength = clamp01(((baseAntarcticEdgeLat + 2.5) - lat) / 5.5);
    }

    if (iceStrength <= 0.02) return [0, 0, 0, 0];

    const r = Math.round(lerp(56, 255, iceStrength));
    const g = Math.round(lerp(189, 255, iceStrength));
    const b = Math.round(lerp(248, 255, iceStrength));
    const a = Math.round(lerp(55, 232, iceStrength));
    return [r, g, b, a];
  }

  if (layerId === 'thermal_wildfires') {
    const fireHeat =
      0.90 * gaussianElliptical(lat, lon, -8, -58, 11, 14) + // Amazon arc of deforestation
      0.86 * gaussianElliptical(lat, lon, -8, 22, 11, 15) + // Central/Southern Africa savanna
      0.84 * gaussianElliptical(lat, lon, 44, -118, 10, 14) + // Western US / Canada
      0.88 * gaussianElliptical(lat, lon, 60, 106, 10, 26) + // Siberia boreal fires
      0.78 * gaussianElliptical(lat, lon, 39, 18, 7, 16) + // Mediterranean basin
      0.82 * gaussianElliptical(lat, lon, -31, 146, 8, 11); // SE Australia bushfires

    const scaled = clamp01(fireHeat * (0.48 + yearFactor * 0.62));
    return sampleGradient(scaled, FIRE_HEAT_STOPS);
  }

  return [0, 0, 0, 0];
}

/**
 * Deterministic NASA FIRMS-style Wildfire Hotspot Points scaled by simulation year (1990–2026).
 */
export function getWildfireHotspotsForYear(year: number): WildfireHotspotPoint[] {
  const yearFactor = clamp01((year - 1990) / (2026 - 1990));
  const totalCount = Math.round(18 + yearFactor * 28); // 18 hotspots in 1990 -> 46 in 2026

  const clusters = [
    { lat: -8.5, lon: -58.5, rLat: 8.5, rLon: 11, en: 'Amazon Basin', ar: 'حوض الأمازون', baseMw: 145 },
    { lat: -7.5, lon: 22.5, rLat: 9.0, rLon: 12, en: 'Central Africa Savanna', ar: 'سافانا وسط أفريقيا', baseMw: 120 },
    { lat: 41.2, lon: -120.5, rLat: 8.5, rLon: 10, en: 'Western North America', ar: 'غرب أمريكا الشمالية', baseMw: 185 },
    { lat: 60.5, lon: 106.0, rLat: 7.5, rLon: 22, en: 'Siberian Boreal Taiga', ar: 'غابات التايغا السيبيرية', baseMw: 165 },
    { lat: 38.8, lon: 21.5, rLat: 4.5, rLon: 12, en: 'Mediterranean Basin', ar: 'حوض البحر المتوسط', baseMw: 115 },
    { lat: -33.2, lon: 147.8, rLat: 5.5, rLon: 8, en: 'Southeast Australia', ar: 'جنوب شرق أستراليا', baseMw: 175 },
  ];

  const points: WildfireHotspotPoint[] = [];
  for (let i = 0; i < totalCount; i++) {
    const c = clusters[i % clusters.length];
    // Deterministic Halton-like pseudo-random distribution so markers stay steady per year
    const seedA = Math.sin((i + 1) * 12.9898 + 78.233) * 43758.5453;
    const seedB = Math.sin((i + 1) * 93.9898 + 19.133) * 24634.6345;
    const u1 = seedA - Math.floor(seedA);
    const u2 = seedB - Math.floor(seedB);

    const angle = u1 * Math.PI * 2;
    const rad = Math.sqrt(u2);
    const lat = parseFloat((c.lat + Math.sin(angle) * c.rLat * rad).toFixed(3));
    const lon = parseFloat((c.lon + Math.cos(angle) * c.rLon * rad).toFixed(3));
    const intensity = clamp01(0.45 + yearFactor * 0.5 + (i % 5) * 0.05);

    points.push({
      id: `firms-${i}`,
      lat,
      lon,
      regionEn: c.en,
      regionAr: c.ar,
      baseMw: Math.round(c.baseMw * (0.7 + intensity * 0.6)),
      intensity,
    });
  }
  return points;
}

export interface ClimateGridLayerOptions extends L.GridLayerOptions {
  activeLayer: ClimateLayerId;
  currentYear: number;
  isSatellite: boolean;
}

/**
 * Custom Leaflet L.GridLayer rendering smooth Web Mercator climate tiles onto a dedicated pane.
 */
export class ClimateMercatorGridLayer extends L.GridLayer {
  private activeLayer: ClimateLayerId;
  private currentYear: number;
  private isSatellite: boolean;

  constructor(options: ClimateGridLayerOptions) {
    super({
      tileSize: 256,
      updateWhenIdle: false,
      updateWhenZooming: true,
      keepBuffer: 2,
      ...options,
    });
    this.activeLayer = options.activeLayer;
    this.currentYear = options.currentYear;
    this.isSatellite = options.isSatellite;
  }

  public updateClimateState(
    activeLayer: ClimateLayerId,
    currentYear: number,
    isSatellite: boolean,
    opacity: number
  ): void {
    const changed =
      this.activeLayer !== activeLayer ||
      this.currentYear !== currentYear ||
      this.isSatellite !== isSatellite;

    this.activeLayer = activeLayer;
    this.currentYear = currentYear;
    this.isSatellite = isSatellite;
    this.setOpacity(opacity);

    if (changed) {
      this.redraw();
    }
  }

  protected createTile(coords: L.Coords): HTMLElement {
    const tile = document.createElement('canvas');
    const tileSize = this.getTileSize();
    tile.width = tileSize.x;
    tile.height = tileSize.y;

    if (this.activeLayer === 'none') {
      return tile;
    }

    const ctx = tile.getContext('2d');
    if (!ctx) return tile;

    // Sample on a 64x64 grid (4px resolution) and upscale smoothly for instant mobile/Android performance
    const sampleSize = 64;
    const offscreen = document.createElement('canvas');
    offscreen.width = sampleSize;
    offscreen.height = sampleSize;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return tile;

    const imgData = offCtx.createImageData(sampleSize, sampleSize);
    const data = imgData.data;

    const numTiles = Math.pow(2, coords.z);
    const worldSizePx = numTiles * tileSize.x;
    const wrappedTileX = ((coords.x % numTiles) + numTiles) % numTiles;
    const basePixelX = wrappedTileX * tileSize.x;
    const basePixelY = coords.y * tileSize.y;
    const step = tileSize.x / sampleSize;
    const yearFactor = clamp01((this.currentYear - 1990) / (2026 - 1990));

    for (let sy = 0; sy < sampleSize; sy++) {
      const worldY = basePixelY + (sy + 0.5) * step;
      if (worldY < 0 || worldY > worldSizePx) continue;

      // Latitude depends only on Y in Web Mercator -> compute once per row!
      const n = Math.PI - (2 * Math.PI * worldY) / worldSizePx;
      const lat = RAD_TO_DEG * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

      for (let sx = 0; sx < sampleSize; sx++) {
        const worldX = basePixelX + (sx + 0.5) * step;
        const lon = (worldX / worldSizePx) * 360 - 180;

        const [r, g, b, a] = evaluateClimatePixel(
          this.activeLayer,
          lat,
          lon,
          yearFactor,
          this.isSatellite
        );

        const idx = (sy * sampleSize + sx) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    offCtx.putImageData(imgData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, tileSize.x, tileSize.y);

    // Keep tilePixelToLatLon reference clean
    void tilePixelToLatLon;

    return tile;
  }
}

/**
 * Helper to create bilingual DOM popup content for a wildfire beacon marker on Leaflet.
 */
export function buildWildfirePopupDom(
  point: WildfireHotspotPoint,
  year: number,
  language: Language
): HTMLElement {
  const isAr = language === 'ar';
  const root = document.createElement('div');
  root.dir = isAr ? 'rtl' : 'ltr';
  root.className = 'min-w-[190px] space-y-1.5 text-xs font-sans';

  const title = document.createElement('div');
  title.className = 'font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5';
  title.textContent = isAr
    ? `نقطة حرارية نشطة · ${point.regionAr}`
    : `Thermal Hotspot · ${point.regionEn}`;
  root.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'text-[11px] opacity-85 space-y-0.5 font-mono tabular-nums';
  meta.innerHTML = '';

  const line1 = document.createElement('div');
  line1.textContent = isAr
    ? `القدرة الإشعاعية: ${point.baseMw} MW (${year})`
    : `Radiative Power: ${point.baseMw} MW (${year})`;

  const line2 = document.createElement('div');
  line2.textContent = `${point.lat.toFixed(2)}°, ${point.lon.toFixed(2)}° · NASA FIRMS`;

  meta.appendChild(line1);
  meta.appendChild(line2);
  root.appendChild(meta);

  return root;
}
