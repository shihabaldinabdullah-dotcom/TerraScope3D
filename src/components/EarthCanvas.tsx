/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Photorealistic Three.js Earth Simulation Canvas
 * Powered by high-resolution NASA Blue Marble satellite textures, atmospheric Rayleigh scattering,
 * dynamic weather cloud systems, night city lights terminator, and smooth camera choreography.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ClimateLayerId, Satellite, CameraPreset, LatLonCoordinate } from '../types';
import { SATELLITES } from '../data/nasaData';
import { CLIMATE_HOTSPOTS } from '../data/nasaOfficialData';
import { createClimateLayerTexture } from '../utils/textureGenerator';
import { buildProceduralSatellite } from '../utils/satelliteModelBuilder';

import earthDayMapUrl from '../assets/images/earth_satellite_map_1793774372002.jpg';
import earthCloudsUrl from '../assets/images/earth_clouds_realistic_1793774388668.jpg';
import earthNightUrl from '../assets/images/earth_night_lights_1793774388032.jpg';

const DAY_TEXTURE_PATH = earthDayMapUrl;
const CLOUDS_TEXTURE_PATH = earthCloudsUrl;
const NIGHT_TEXTURE_PATH = earthNightUrl;

interface EarthCanvasProps {
  activeLayer: ClimateLayerId;
  currentYear: number;
  selectedSatelliteId: string | null;
  cameraPreset: CameraPreset;
  targetCoordinate: LatLonCoordinate | null;
  simulationSpeed: number;
  isAutoRotating: boolean;
  onSelectSatellite: (id: string | null) => void;
  onSelectHotspot?: (id: string) => void;
  zoomAction?: number; // timestamp trigger to zoom in or out
  zoomDelta?: number;
  resetTrigger?: number;
  language?: 'ar' | 'en';
  onFallbackTo2DMap?: () => void;
}

/**
 * Converts Latitude & Longitude to 3D Cartesian coordinates on sphere
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

export const EarthCanvas: React.FC<EarthCanvasProps> = ({
  activeLayer,
  currentYear,
  selectedSatelliteId,
  cameraPreset,
  targetCoordinate,
  simulationSpeed,
  isAutoRotating,
  onSelectSatellite,
  onSelectHotspot,
  zoomAction,
  zoomDelta,
  resetTrigger,
  language = 'ar',
  onFallbackTo2DMap,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState<boolean>(false);

  // Mutable state refs to allow animation tick without React teardown
  const stateRef = useRef({
    activeLayer,
    currentYear,
    selectedSatelliteId,
    cameraPreset,
    targetCoordinate,
    simulationSpeed,
    isAutoRotating,
    onSelectSatellite,
    onSelectHotspot,
  });

  useEffect(() => {
    stateRef.current = {
      activeLayer,
      currentYear,
      selectedSatelliteId,
      cameraPreset,
      targetCoordinate,
      simulationSpeed,
      isAutoRotating,
      onSelectSatellite,
      onSelectHotspot,
    };
  }, [
    activeLayer,
    currentYear,
    selectedSatelliteId,
    cameraPreset,
    targetCoordinate,
    simulationSpeed,
    isAutoRotating,
    onSelectSatellite,
    onSelectHotspot,
  ]);

  // Imperative zoom ref triggers
  const zoomControlsRef = useRef<{ zoomBy: (delta: number) => void; resetCamera: () => void } | null>(null);

  useEffect(() => {
    if (zoomAction && zoomDelta && zoomControlsRef.current) {
      zoomControlsRef.current.zoomBy(zoomDelta);
    }
  }, [zoomAction, zoomDelta]);

  useEffect(() => {
    if (resetTrigger && zoomControlsRef.current) {
      zoomControlsRef.current.resetCamera();
    }
  }, [resetTrigger]);

  // Climate texture dynamic update ref
  const climateMeshRef = useRef<THREE.Mesh | null>(null);
  const climateTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Update climate overlay texture when activeLayer or currentYear changes
  useEffect(() => {
    if (!climateMeshRef.current) return;

    if (climateTextureRef.current) {
      climateTextureRef.current.dispose();
      climateTextureRef.current = null;
    }

    if (activeLayer === 'none') {
      climateMeshRef.current.visible = false;
    } else {
      const newTexture = createClimateLayerTexture(activeLayer, currentYear);
      if (newTexture) {
        climateTextureRef.current = newTexture;
        const mat = climateMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.map = newTexture;
        mat.needsUpdate = true;
        climateMeshRef.current.visible = true;
      } else {
        climateMeshRef.current.visible = false;
      }
    }
  }, [activeLayer, currentYear]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let frameId = 0;
    let isDisposed = false;

    // 1. Detect Software WebGL & WebGL1/experimental fallback
    const glProbeResult = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl =
          probeCanvas.getContext('webgl2') ||
          probeCanvas.getContext('webgl') ||
          (probeCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
        if (!gl) return { supported: false, isSoftware: true };
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        const isSoftware = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        return { supported: true, isSoftware };
      } catch {
        return { supported: false, isSoftware: true };
      }
    })();

    if (!glProbeResult.supported) {
      setWebglError(true);
      return;
    }

    const isSoftwareGl = glProbeResult.isSoftware;
    const isLowPowerViewport = (container.clientWidth || window.innerWidth) <= 768;

    // 2. Setup Three.js Scene, Camera, and WebGLRenderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408); // Deep space cosmic black

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 5.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: isLowPowerViewport ? 'default' : 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    const maxDpr = isSoftwareGl ? 1 : isLowPowerViewport ? 1.5 : 2;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !isSoftwareGl && !isLowPowerViewport;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'none';

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored, false);

    container.appendChild(renderer.domElement);

    // 3. Studio Sunlight & Cosmic Space Lighting
    // Directional Sun Light placed at angle to create realistic day/night terminator
    const sunLight = new THREE.DirectionalLight(0xfffbf2, 2.6);
    sunLight.position.set(8, 3, 6);
    sunLight.castShadow = !isSoftwareGl;
    scene.add(sunLight);

    // Subtle ambient light so night side remains visible with dark oceanic depth
    const ambientLight = new THREE.AmbientLight(0x08101e, 0.35);
    scene.add(ambientLight);

    // Cool celestial rim light from space
    const rimLight = new THREE.DirectionalLight(0x1e3a8a, 0.5);
    rimLight.position.set(-8, -2, -6);
    scene.add(rimLight);

    // 4. Photorealistic Starfield Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = isSoftwareGl ? 1000 : 2600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 30 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const starType = Math.random();
      if (starType > 0.85) {
        starColors[i * 3] = 0.65; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0; // Blue star
      } else if (starType > 0.7) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 0.75; // Yellow star
      } else {
        starColors[i * 3] = 0.95; starColors[i * 3 + 1] = 0.95; starColors[i * 3 + 2] = 1.0; // White star
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Earth Parent Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthRadius = 2.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Load High-Resolution NASA Satellite Blue Marble Texture with instant non-black fallback
    const createFallbackDayTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, '#dbeafe');
        grad.addColorStop(0.14, '#0c3b6e');
        grad.addColorStop(0.5, '#0b4a8b');
        grad.addColorStop(0.86, '#0c3b6e');
        grad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 256);
        // Subtle schematic landmass contours only for initial load frame
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.ellipse(290, 95, 55, 30, 0.1, 0, Math.PI * 2); // Eurasia
        ctx.ellipse(265, 132, 24, 34, -0.1, 0, Math.PI * 2); // Africa
        ctx.ellipse(125, 85, 36, 26, -0.2, 0, Math.PI * 2); // N America
        ctx.ellipse(160, 155, 22, 34, 0.2, 0, Math.PI * 2); // S America
        ctx.ellipse(400, 165, 22, 16, 0, 0, Math.PI * 2); // Australia
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const createFallbackNightTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#071124';
        ctx.fillRect(0, 0, 256, 128);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const fallbackDayTex = createFallbackDayTexture();
    const fallbackNightTex = createFallbackNightTexture();

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    // Custom Shader Material for Day/Night Terminator + Ocean Specular Sun Glint
    const earthCustomMat = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: fallbackDayTex },
        nightTexture: { value: fallbackNightTex },
        sunDirection: { value: sunLight.position.clone().normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 sunDir = normalize(sunDirection);

          // Sunlight dot product
          float cosTheta = dot(normal, sunDir);

          // Sample day satellite imagery & night lights
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);

          // Smooth terminator transition across twilight zone (-0.15 to +0.15)
          float dayWeight = smoothstep(-0.15, 0.20, cosTheta);
          float nightWeight = 1.0 - smoothstep(-0.05, 0.15, cosTheta);

          // Ocean detection for sun glint specular reflection
          // Blue marble oceans are dominated by blue channel with low red channel
          bool isOcean = (dayColor.b > dayColor.r * 1.35) && (dayColor.g > dayColor.r * 1.05);
          float specular = 0.0;

          if (isOcean && cosTheta > 0.0) {
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            vec3 halfVector = normalize(sunDir + viewDir);
            float specAngle = max(0.0, dot(normal, halfVector));
            specular = pow(specAngle, 32.0) * 1.2 * dayWeight;
          }

          // Combine Day + Night city lights + Ocean sun glint
          vec3 finalColor = dayColor.rgb * dayWeight + nightColor.rgb * 1.6 * nightWeight;
          finalColor += vec3(1.0, 0.95, 0.85) * specular;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    const earthDayTex = textureLoader.load(
      DAY_TEXTURE_PATH,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;
        earthCustomMat.uniforms.dayTexture.value = tex;
        earthCustomMat.uniformsNeedUpdate = true;
      },
      undefined,
      (err) => {
        console.error('Earth day texture failed to load:', DAY_TEXTURE_PATH, err);
      }
    );

    const earthNightTex = textureLoader.load(
      NIGHT_TEXTURE_PATH,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.needsUpdate = true;
        earthCustomMat.uniforms.nightTexture.value = tex;
        earthCustomMat.uniformsNeedUpdate = true;
      },
      undefined,
      (err) => {
        console.error('Earth night texture failed to load:', NIGHT_TEXTURE_PATH, err);
      }
    );

    const earthMesh = new THREE.Mesh(earthGeo, earthCustomMat);
    earthMesh.receiveShadow = true;
    earthMesh.castShadow = true;
    earthGroup.add(earthMesh);

    // 6. Dynamic Climate Layer Mesh (Layered on top of Earth: radius 2.012)
    const climateGeo = new THREE.SphereGeometry(2.012, 64, 64);
    const climateMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      roughness: 0.5,
      metalness: 0.1,
    });
    climateMat.polygonOffset = true;
    climateMat.polygonOffsetFactor = -1;
    climateMat.polygonOffsetUnits = -1;

    const climateMesh = new THREE.Mesh(climateGeo, climateMat);
    climateMesh.visible = false;
    earthGroup.add(climateMesh);
    climateMeshRef.current = climateMesh;

    // 7. Realistic Meteorological Clouds Layer (Radius 2.035)
    const createFallbackCloudsTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 32;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 64, 32);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };
    const fallbackCloudsTex = createFallbackCloudsTexture();

    const cloudsGeo = new THREE.SphereGeometry(2.035, 64, 64);
    // Custom cloud shader: uses luminance of cloud texture for alpha transparency
    const cloudsCustomMat = new THREE.ShaderMaterial({
      uniforms: {
        cloudTexture: { value: fallbackCloudsTex },
        sunDirection: { value: sunLight.position.clone().normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D cloudTexture;
        uniform vec3 sunDirection;

        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 sunDir = normalize(sunDirection);
          float cosTheta = max(0.0, dot(normal, sunDir));

          vec4 tex = texture2D(cloudTexture, vUv);
          // Luminance calculation
          float cloudDensity = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

          // Day side clouds are bright white; night side are darkened
          float illumination = 0.15 + 0.85 * cosTheta;
          vec3 cloudColor = vec3(0.95, 0.97, 1.0) * illumination;

          gl_FragColor = vec4(cloudColor, cloudDensity * 0.75);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const cloudsTex = textureLoader.load(
      CLOUDS_TEXTURE_PATH,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        cloudsCustomMat.uniforms.cloudTexture.value = tex;
        cloudsCustomMat.uniformsNeedUpdate = true;
      },
      undefined,
      (err) => {
        console.error('Earth clouds texture failed to load:', CLOUDS_TEXTURE_PATH, err);
      }
    );

    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsCustomMat);
    earthGroup.add(cloudsMesh);

    // 8. Realistic Rayleigh Atmosphere Scattering Rim
    const atmosGeo = new THREE.SphereGeometry(2.13, 48, 48);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) },
        sunDirection: { value: sunLight.position.clone().normalize() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldNormal;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 sunDirection;

        varying vec3 vNormal;
        varying vec3 vWorldNormal;

        void main() {
          // Fresnel rim calculation
          float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.6);

          // Atmosphere is illuminated primarily on sunlit hemisphere
          float sunDot = max(0.0, dot(normalize(vWorldNormal), normalize(sunDirection)));
          float intensity = fresnel * (0.25 + 0.75 * sunDot);

          gl_FragColor = vec4(glowColor, intensity * 0.85);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);

    // 9. 3D Climate Hotspots Markers (Glowing Beacon Pins attached to Earth)
    const hotspotMarkersGroup = new THREE.Group();
    earthGroup.add(hotspotMarkersGroup);

    CLIMATE_HOTSPOTS.forEach((hotspot) => {
      const pos = latLonToVector3(hotspot.lat, hotspot.lon, earthRadius + 0.02);

      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      pinGroup.lookAt(0, 0, 0);

      // Glowing circular beacon disk
      const beaconGeo = new THREE.CircleGeometry(0.045, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: hotspot.riskRating === 'Critical' ? 0xef4444 : 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      pinGroup.add(beaconMesh);

      // Stalk needle
      const stalkGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.08, 6);
      const stalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
      stalkMesh.rotation.x = Math.PI / 2;
      stalkMesh.position.z = 0.04;
      pinGroup.add(stalkMesh);

      pinGroup.userData = { hotspotId: hotspot.id, hotspotName: hotspot.nameEn };
      hotspotMarkersGroup.add(pinGroup);
    });

    // 9b. Active Searched Location 3D Marker Pin
    const targetPinGroup = new THREE.Group();
    targetPinGroup.visible = false;
    earthGroup.add(targetPinGroup);

    const targetRingGeo = new THREE.RingGeometry(0.035, 0.065, 24);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const targetRingMesh = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetPinGroup.add(targetRingMesh);

    const targetStalkGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8);
    const targetStalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const targetStalkMesh = new THREE.Mesh(targetStalkGeo, targetStalkMat);
    targetStalkMesh.rotation.x = Math.PI / 2;
    targetStalkMesh.position.z = 0.07;
    targetPinGroup.add(targetStalkMesh);

    const targetHeadGeo = new THREE.SphereGeometry(0.032, 16, 16);
    const targetHeadMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const targetHeadMesh = new THREE.Mesh(targetHeadGeo, targetHeadMat);
    targetHeadMesh.position.z = 0.145;
    targetPinGroup.add(targetHeadMesh);

    // 10. Satellites & Orbital Planes
    interface SatelliteInstance {
      data: Satellite;
      group: THREE.Group;
      orbitLine: THREE.Line;
      angle: number;
    }

    const satelliteInstances: SatelliteInstance[] = [];

    SATELLITES.forEach((sat, index) => {
      const segments = 96;
      const orbitPoints: THREE.Vector3[] = [];
      const r = sat.orbitRadius;
      const inc = sat.orbitInclination;

      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta) * Math.sin(inc);
        const z = r * Math.sin(theta) * Math.cos(inc);
        orbitPoints.push(new THREE.Vector3(x, y, z));
      }

      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(sat.color),
        transparent: true,
        opacity: 0.35,
        linewidth: 1,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      scene.add(orbitLine);

      const satGroup = buildProceduralSatellite(sat);
      satGroup.userData = { satelliteId: sat.id };
      scene.add(satGroup);

      const initialAngle = (index / SATELLITES.length) * Math.PI * 2;
      satelliteInstances.push({
        data: sat,
        group: satGroup,
        orbitLine,
        angle: initialAngle,
      });
    });

    // 11. Mouse & Touch Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetRotationX = 0.2;
    let targetRotationY = 0.5;
    let currentRotationX = targetRotationX;
    let currentRotationY = targetRotationY;

    let targetDistance = 5.2;
    let currentDistance = targetDistance;

    // Connect imperative zoom controls
    zoomControlsRef.current = {
      zoomBy: (delta: number) => {
        targetDistance += delta;
        targetDistance = Math.max(2.6, Math.min(8.5, targetDistance));
      },
      resetCamera: () => {
        targetRotationX = 0.2;
        targetRotationY = 0.5;
        targetDistance = 5.2;
      },
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Check satellite click
      const satCandidates = satelliteInstances.map(s => s.group);
      const satIntersects = raycaster.intersectObjects(satCandidates, true);

      if (satIntersects.length > 0) {
        let parent = satIntersects[0].object.parent;
        while (parent && !parent.userData.satelliteId) {
          parent = parent.parent;
        }
        if (parent && parent.userData.satelliteId) {
          stateRef.current.onSelectSatellite(parent.userData.satelliteId);
          return;
        }
      }

      // Check hotspot beacon click
      const hotspotIntersects = raycaster.intersectObjects(hotspotMarkersGroup.children, true);
      if (hotspotIntersects.length > 0) {
        let parent = hotspotIntersects[0].object.parent;
        while (parent && !parent.userData.hotspotId) {
          parent = parent.parent;
        }
        if (parent && parent.userData.hotspotId && stateRef.current.onSelectHotspot) {
          stateRef.current.onSelectHotspot(parent.userData.hotspotId);
          return;
        }
      }

      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      targetRotationY += deltaX * 0.005;
      targetRotationX += deltaY * 0.005;
      targetRotationX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotationX));
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDistance += e.deltaY * 0.003;
      targetDistance = Math.max(2.6, Math.min(8.5, targetDistance));
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(container);
    }

    // 12. Paced Render Loop with Smooth Camera Fly-to
    const clock = new THREE.Clock();
    const cameraTarget = new THREE.Vector3(0, 0, 0);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (!sync) {
          frameId = window.setTimeout(cb, 60);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 6);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 60);
        }
      };
      frameId = window.setTimeout(poll, 6);
    }

    function tick() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const {
        simulationSpeed,
        cameraPreset,
        selectedSatelliteId,
        targetCoordinate,
        isAutoRotating,
      } = stateRef.current;

      // Rotate Earth (Natural day cycle) when auto-rotating
      if (isAutoRotating && !targetCoordinate && !selectedSatelliteId && !isDragging) {
        earthGroup.rotation.y += delta * 0.04 * simulationSpeed;
      }

      // Rotate clouds at gentle differential velocity for dynamic weather motion
      cloudsMesh.rotation.y += delta * 0.015 * simulationSpeed;

      // Animate Satellites
      satelliteInstances.forEach((inst) => {
        inst.angle += delta * inst.data.orbitSpeed * simulationSpeed * 0.4;
        const r = inst.data.orbitRadius;
        const inc = inst.data.orbitInclination;

        const x = r * Math.cos(inst.angle);
        const y = r * Math.sin(inst.angle) * Math.sin(inc);
        const z = r * Math.sin(inst.angle) * Math.cos(inc);

        inst.group.position.set(x, y, z);
        inst.group.lookAt(0, 0, 0);
        inst.group.rotateX(Math.PI / 2);

        const isSelected = selectedSatelliteId === inst.data.id;
        const lineMat = inst.orbitLine.material as THREE.LineBasicMaterial;
        lineMat.opacity = isSelected ? 0.95 : 0.28;
        inst.group.scale.setScalar(isSelected ? 1.15 : 0.7);
      });

      // Camera Choreography
      let desiredTarget = new THREE.Vector3(0, 0, 0);
      let desiredCamDist = targetDistance;

      if (targetCoordinate) {
        const pinPos = latLonToVector3(targetCoordinate.lat, targetCoordinate.lon, earthRadius + 0.025);
        targetPinGroup.position.copy(pinPos);
        targetPinGroup.lookAt(0, 0, 0);
        targetPinGroup.visible = true;
        const pulse = 1 + 0.18 * Math.sin(clock.elapsedTime * 4);
        targetRingMesh.scale.set(pulse, pulse, 1);

        // Fly directly to specified Lat/Lon on Earth globe!
        const latRad = (targetCoordinate.lat * Math.PI) / 180;
        const lonRad = (targetCoordinate.lon * Math.PI) / 180;

        targetRotationX = THREE.MathUtils.damp(targetRotationX, latRad, 5, delta);
        targetRotationY = THREE.MathUtils.damp(
          targetRotationY,
          -lonRad - earthGroup.rotation.y + Math.PI / 2,
          5,
          delta
        );
        desiredCamDist = 3.4;
      } else {
        targetPinGroup.visible = false;
        if (selectedSatelliteId) {
          const found = satelliteInstances.find(s => s.data.id === selectedSatelliteId);
          if (found) {
            desiredTarget.copy(found.group.position);
            desiredCamDist = 3.6;
          }
        } else if (cameraPreset === 'poles') {
          targetRotationX = THREE.MathUtils.damp(targetRotationX, Math.PI * 0.42, 4, delta);
          desiredCamDist = 4.2;
        } else if (cameraPreset === 'equator') {
          targetRotationX = THREE.MathUtils.damp(targetRotationX, 0.0, 4, delta);
          desiredCamDist = 4.5;
        }
      }

      currentRotationX = THREE.MathUtils.damp(currentRotationX, targetRotationX, 8, delta);
      currentRotationY = THREE.MathUtils.damp(currentRotationY, targetRotationY, 8, delta);
      currentDistance = THREE.MathUtils.damp(currentDistance, desiredCamDist, 6, delta);
      cameraTarget.lerp(desiredTarget, delta * 4);

      const camX =
        cameraTarget.x + currentDistance * Math.cos(currentRotationX) * Math.sin(currentRotationY);
      const camY = cameraTarget.y + currentDistance * Math.sin(currentRotationX);
      const camZ =
        cameraTarget.z + currentDistance * Math.cos(currentRotationX) * Math.cos(currentRotationY);

      camera.position.set(camX, camY, camZ);
      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 13. Disposal
    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      fallbackDayTex.dispose();
      fallbackNightTex.dispose();
      fallbackCloudsTex.dispose();
      earthDayTex.dispose();
      earthNightTex.dispose();
      earthCustomMat.dispose();
      climateGeo.dispose();
      climateMat.dispose();
      if (climateTextureRef.current) {
        climateTextureRef.current.dispose();
      }
      cloudsGeo.dispose();
      cloudsTex.dispose();
      cloudsCustomMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      targetRingGeo.dispose();
      targetRingMat.dispose();
      targetStalkGeo.dispose();
      targetStalkMat.dispose();
      targetHeadGeo.dispose();
      targetHeadMat.dispose();

      satelliteInstances.forEach(inst => {
        inst.orbitLine.geometry.dispose();
        (inst.orbitLine.material as THREE.Material).dispose();
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      />
      {webglError && (
        <div
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-[#07111f] text-slate-100 gap-3"
        >
          <p className="text-sm font-bold text-sky-300">
            {language === 'ar'
              ? 'تعذّر تشغيل العرض ثلاثي الأبعاد (WebGL) على هذا الجهاز'
              : '3D WebGL view is unavailable on this device'}
          </p>
          <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
            {language === 'ar'
              ? 'يمكنك متابعة استعراض جميع طبقات المناخ والبحث بوضوح وسلاسة على الخريطة القياسية أو خريطة الأقمار الصناعية.'
              : 'You can inspect all climate layers, search, and timelines smoothly on the Standard Map or Satellite Map.'}
          </p>
          {onFallbackTo2DMap && (
            <button
              type="button"
              onClick={onFallbackTo2DMap}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg"
            >
              {language === 'ar' ? 'الانتقال إلى الخريطة التفاعلية' : 'Open Interactive 2D Map'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
