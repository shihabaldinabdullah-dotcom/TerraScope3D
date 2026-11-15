/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Algorithmic Procedural Texture Generation Pipeline
 * Generates Earth landmasses, night lights, clouds, and dynamic climate heatmaps
 * directly in code (Zero-external 404 dependencies, 100% offline resilient).
 */

import * as THREE from 'three';
import { ClimateLayerId } from '../types';

const WIDTH = 1024;
const HEIGHT = 512;

/**
 * Procedural Earth Base Albedo Texture (Continents, Oceans, Polar Caps)
 */
export function createEarthBaseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Background
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  oceanGradient.addColorStop(0, '#0a1d37');
  oceanGradient.addColorStop(0.5, '#0b2545');
  oceanGradient.addColorStop(1, '#0a1d37');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Helper to draw continent landmass blobs
  const drawLandmass = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    baseColor: string,
    vegetationColor?: string
  ) => {
    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    // Rough polygonal blob for organic continent look
    const points = 16;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const noise = 0.8 + 0.4 * Math.sin(i * 3.7) * Math.cos(i * 2.1);
      const x = cx + Math.cos(angle) * rx * noise;
      const y = cy + Math.sin(angle) * ry * noise;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Vegetation inner shade
    if (vegetationColor) {
      ctx.fillStyle = vegetationColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Eurasia & Europe
  drawLandmass(WIDTH * 0.65, HEIGHT * 0.32, WIDTH * 0.22, HEIGHT * 0.18, '#2d5a27', '#1b4332');
  drawLandmass(WIDTH * 0.52, HEIGHT * 0.30, WIDTH * 0.08, HEIGHT * 0.10, '#386641', '#2d5a27'); // Western Europe
  drawLandmass(WIDTH * 0.58, HEIGHT * 0.45, WIDTH * 0.09, HEIGHT * 0.10, '#d4a373'); // Middle East / Arabia (Desert)
  drawLandmass(WIDTH * 0.72, HEIGHT * 0.42, WIDTH * 0.08, HEIGHT * 0.12, '#2d6a4f', '#1b4332'); // East Asia / China
  drawLandmass(WIDTH * 0.68, HEIGHT * 0.48, WIDTH * 0.06, HEIGHT * 0.08, '#40916c'); // India subcontinent

  // Africa
  drawLandmass(WIDTH * 0.53, HEIGHT * 0.56, WIDTH * 0.10, HEIGHT * 0.20, '#d4a373'); // Sahara Desert
  drawLandmass(WIDTH * 0.54, HEIGHT * 0.65, WIDTH * 0.08, HEIGHT * 0.14, '#2d5a27', '#1b4332'); // Sub-Saharan green

  // North America
  drawLandmass(WIDTH * 0.25, HEIGHT * 0.32, WIDTH * 0.15, HEIGHT * 0.16, '#2d5a27', '#1b4332');
  drawLandmass(WIDTH * 0.20, HEIGHT * 0.24, WIDTH * 0.10, HEIGHT * 0.10, '#40916c'); // Canada / Alaska
  drawLandmass(WIDTH * 0.38, HEIGHT * 0.18, WIDTH * 0.07, HEIGHT * 0.08, '#f8f9fa'); // Greenland Ice Sheet

  // South America
  drawLandmass(WIDTH * 0.32, HEIGHT * 0.68, WIDTH * 0.08, HEIGHT * 0.19, '#1b4332', '#081c15'); // Amazon rainforest

  // Australia & Indonesia
  drawLandmass(WIDTH * 0.82, HEIGHT * 0.72, WIDTH * 0.08, HEIGHT * 0.11, '#bc6c25', '#dda15e'); // Australian Outback
  drawLandmass(WIDTH * 0.76, HEIGHT * 0.58, WIDTH * 0.06, HEIGHT * 0.04, '#1b4332'); // Indonesia

  // Polar Ice Caps
  // Arctic
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.ellipse(WIDTH * 0.5, 0, WIDTH * 0.5, HEIGHT * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Antarctica
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.ellipse(WIDTH * 0.5, HEIGHT, WIDTH * 0.5, HEIGHT * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Elevation / Bump Texture (Grayscale)
 */
export function createEarthBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Oceans: dark (low elevation)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Land: lighter (higher elevation)
  const drawElevation = (cx: number, cy: number, rx: number, ry: number, gray: string) => {
    ctx.fillStyle = gray;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };

  // Mountain ranges (Himalayas, Rockies, Andes, Alps)
  drawElevation(WIDTH * 0.65, HEIGHT * 0.35, WIDTH * 0.18, HEIGHT * 0.14, '#777777');
  drawElevation(WIDTH * 0.67, HEIGHT * 0.40, WIDTH * 0.07, HEIGHT * 0.04, '#ffffff'); // Himalayas peak
  drawElevation(WIDTH * 0.22, HEIGHT * 0.32, WIDTH * 0.04, HEIGHT * 0.14, '#cccccc'); // Rockies
  drawElevation(WIDTH * 0.28, HEIGHT * 0.70, WIDTH * 0.03, HEIGHT * 0.16, '#cccccc'); // Andes
  drawElevation(WIDTH * 0.54, HEIGHT * 0.62, WIDTH * 0.08, HEIGHT * 0.15, '#666666'); // Africa plateau
  drawElevation(WIDTH * 0.5, HEIGHT * 0.04, WIDTH * 0.4, HEIGHT * 0.05, '#999999'); // Arctic
  drawElevation(WIDTH * 0.5, HEIGHT * 0.96, WIDTH * 0.4, HEIGHT * 0.06, '#bbbbbb'); // Antarctica

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Night City Lights Texture
 */
export function createEarthNightLightsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Unpopulated / Oceans: black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Clustered city light points with warm incandescent golden glow
  const drawCityCluster = (cx: number, cy: number, count: number, radius: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 1.5) * radius;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const intensity = 0.5 + Math.random() * 0.5;

      ctx.fillStyle = `rgba(255, 215, 120, ${intensity})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // North America East & West coasts
  drawCityCluster(WIDTH * 0.28, HEIGHT * 0.34, 180, 45);
  drawCityCluster(WIDTH * 0.20, HEIGHT * 0.35, 120, 35);

  // Western Europe & Nile Delta
  drawCityCluster(WIDTH * 0.53, HEIGHT * 0.32, 220, 40);
  drawCityCluster(WIDTH * 0.56, HEIGHT * 0.43, 60, 15); // Nile River ribbon

  // East Asia (Japan, Eastern China, South Korea)
  drawCityCluster(WIDTH * 0.74, HEIGHT * 0.38, 200, 50);
  drawCityCluster(WIDTH * 0.78, HEIGHT * 0.35, 80, 20); // Tokyo cluster

  // India
  drawCityCluster(WIDTH * 0.68, HEIGHT * 0.46, 140, 35);

  // South America coastal (Sao Paulo / Rio)
  drawCityCluster(WIDTH * 0.35, HEIGHT * 0.72, 80, 25);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Dynamic Clouds Texture (Semi-Transparent)
 */
export function createEarthCloudsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw organic swirling cloud bands
  const drawCloudSwirl = (cx: number, cy: number, w: number, h: number, alpha: number) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h, 0.15, 0, Math.PI * 2);
    ctx.fill();
  };

  // Equatorial cloud band (ITCZ)
  for (let i = 0; i < 20; i++) {
    const x = (i / 20) * WIDTH + (Math.random() - 0.5) * 40;
    const y = HEIGHT * 0.50 + Math.sin(i * 0.8) * 20;
    drawCloudSwirl(x, y, 45, 12, 0.35);
  }

  // Mid-latitude storm spirals (Northern Hemisphere)
  drawCloudSwirl(WIDTH * 0.30, HEIGHT * 0.28, 70, 30, 0.45);
  drawCloudSwirl(WIDTH * 0.60, HEIGHT * 0.25, 80, 35, 0.40);
  drawCloudSwirl(WIDTH * 0.85, HEIGHT * 0.30, 60, 25, 0.45);

  // Southern Ocean cyclonic swirls
  drawCloudSwirl(WIDTH * 0.25, HEIGHT * 0.78, 90, 25, 0.40);
  drawCloudSwirl(WIDTH * 0.65, HEIGHT * 0.80, 100, 30, 0.45);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Dynamic Climate Observation Layer Texture
 * Re-renders on year or layer changes to reflect authentic NASA indicators
 */
export function createClimateLayerTexture(
  layerId: ClimateLayerId,
  year: number
): THREE.CanvasTexture | null {
  if (layerId === 'none') return null;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Transparent baseline
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Calculate year factor (0 at 1990, 1 at 2026)
  const yearFactor = Math.max(0, Math.min(1, (year - 1990) / (2026 - 1990)));

  if (layerId === 'temp_anomaly') {
    // Surface Temperature Anomaly
    // Intensifies from gentle yellow (+0.4°C in 1990) to fierce red/purple (+1.5°C in 2026)
    // Especially pronounced in Arctic polar amplification
    const baseAlpha = 0.55 + yearFactor * 0.25;

    // Arctic Amplification (Northern polar cap warms 3-4x global rate)
    const arcticAnomaly = ctx.createRadialGradient(
      WIDTH * 0.5, HEIGHT * 0.1, 10,
      WIDTH * 0.5, HEIGHT * 0.1, WIDTH * 0.4
    );
    arcticAnomaly.addColorStop(0, `rgba(220, 38, 38, ${baseAlpha})`); // Crimson red
    arcticAnomaly.addColorStop(0.5, `rgba(249, 115, 22, ${baseAlpha * 0.8})`); // Orange
    arcticAnomaly.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = arcticAnomaly;
    ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.4);

    // Mid-latitude continental heat belts (North America, Europe, Siberia)
    const drawHeatSpot = (cx: number, cy: number, r: number) => {
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, `rgba(239, 68, 68, ${0.45 + yearFactor * 0.35})`);
      grad.addColorStop(0.6, `rgba(245, 158, 11, ${0.35 + yearFactor * 0.25})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    drawHeatSpot(WIDTH * 0.28, HEIGHT * 0.32, 90 + yearFactor * 40);
    drawHeatSpot(WIDTH * 0.58, HEIGHT * 0.30, 110 + yearFactor * 50);
    drawHeatSpot(WIDTH * 0.75, HEIGHT * 0.28, 130 + yearFactor * 60);
    drawHeatSpot(WIDTH * 0.34, HEIGHT * 0.65, 80 + yearFactor * 30);
    drawHeatSpot(WIDTH * 0.82, HEIGHT * 0.72, 70 + yearFactor * 35);
  } 
  else if (layerId === 'vegetation_ndvi') {
    // Normalized Difference Vegetation Index
    // Dense green in tropical rain forests, paler green in boreal, amber in deserts
    const drawBiome = (cx: number, cy: number, rx: number, ry: number, color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    // Amazon Basin (High NDVI 0.85)
    drawBiome(WIDTH * 0.32, HEIGHT * 0.65, 70, 50, '#10b981', 0.80);
    // Congo Basin (Central Africa)
    drawBiome(WIDTH * 0.56, HEIGHT * 0.62, 50, 40, '#059669', 0.80);
    // Southeast Asia & Indonesia
    drawBiome(WIDTH * 0.76, HEIGHT * 0.55, 60, 30, '#10b981', 0.85);
    // Northern Boreal Forests (Taiga)
    drawBiome(WIDTH * 0.65, HEIGHT * 0.24, 180, 25, '#34d399', 0.65);
    drawBiome(WIDTH * 0.25, HEIGHT * 0.25, 100, 20, '#34d399', 0.65);

    // Arid / Desert Regions (Low NDVI 0.10)
    drawBiome(WIDTH * 0.54, HEIGHT * 0.44, 80, 30, '#d97706', 0.75); // Sahara
    drawBiome(WIDTH * 0.82, HEIGHT * 0.72, 60, 35, '#d97706', 0.70); // Australia

    ctx.globalAlpha = 1.0;
  }
  else if (layerId === 'co2_distribution') {
    // Atmospheric CO2 Concentration
    // High plume across northern industrial latitudes, intensifying steadily from 354ppm (1990) to 426ppm+ (2026)
    const plumeAlpha = 0.40 + yearFactor * 0.40;
    const bandGradient = ctx.createLinearGradient(0, HEIGHT * 0.15, 0, HEIGHT * 0.85);
    bandGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bandGradient.addColorStop(0.25, `rgba(220, 38, 38, ${plumeAlpha})`); // High emissions belt
    bandGradient.addColorStop(0.50, `rgba(245, 158, 11, ${plumeAlpha * 0.7})`); // Mid latitude
    bandGradient.addColorStop(0.85, `rgba(234, 88, 12, ${plumeAlpha * 0.5})`);
    bandGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = bandGradient;
    ctx.fillRect(0, HEIGHT * 0.1, WIDTH, HEIGHT * 0.8);
  }
  else if (layerId === 'sea_ice') {
    // Polar Sea Ice Extent
    // Shows Arctic ice footprint visibly shrinking as year progresses
    const iceRadius = Math.max(30, 95 - yearFactor * 45); // shrinks from 95px in 1990 to 50px in 2026

    const iceGrad = ctx.createRadialGradient(
      WIDTH * 0.5, 0, 5,
      WIDTH * 0.5, 0, iceRadius * 2
    );
    iceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    iceGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.85)');
    iceGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT * 0.25);

    // Antarctic Sea Ice
    const antarcticRadius = Math.max(35, 80 - yearFactor * 25);
    const antarcticGrad = ctx.createRadialGradient(
      WIDTH * 0.5, HEIGHT, 5,
      WIDTH * 0.5, HEIGHT, antarcticRadius * 2
    );
    antarcticGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    antarcticGrad.addColorStop(0.7, 'rgba(186, 230, 253, 0.80)');
    antarcticGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = antarcticGrad;
    ctx.fillRect(0, HEIGHT * 0.75, WIDTH, HEIGHT * 0.25);
  }
  else if (layerId === 'thermal_wildfires') {
    // Active Wildfire Hotspots
    // Radiative thermal anomalies represented as incandescent dots
    const firePointsCount = Math.floor(150 + yearFactor * 250);

    const fireClusters = [
      { cx: WIDTH * 0.32, cy: HEIGHT * 0.65, r: 60 }, // Amazon
      { cx: WIDTH * 0.54, cy: HEIGHT * 0.62, r: 50 }, // Central Africa savanna
      { cx: WIDTH * 0.24, cy: HEIGHT * 0.35, r: 40 }, // West US / Canada
      { cx: WIDTH * 0.70, cy: HEIGHT * 0.22, r: 70 }, // Siberia
      { cx: WIDTH * 0.84, cy: HEIGHT * 0.75, r: 35 }, // SE Australia
    ];

    for (let i = 0; i < firePointsCount; i++) {
      const cluster = fireClusters[i % fireClusters.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.8) * cluster.r;
      const x = cluster.cx + Math.cos(angle) * dist;
      const y = cluster.cy + Math.sin(angle) * dist;

      // Glow halo
      ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Incandescent core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
