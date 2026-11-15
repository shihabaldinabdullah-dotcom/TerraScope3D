/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Interactive Leaflet Map (OpenStreetMap Standard & Satellite Imagery)
 * Renders synchronized Web Mercator NASA Climate Observation Layers on both Standard & Satellite maps,
 * displays searched geographic markers, auto-pans/zooms accurately, and supports Light/Dark UI theming.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Eye,
  EyeOff,
  Flame,
  Globe,
  Layers,
  Leaf,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Snowflake,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import { ClimateLayerId, Language, LatLonCoordinate, ThemeMode } from '../types';
import { CLIMATE_LAYERS } from '../data/nasaData';
import {
  buildWildfirePopupDom,
  ClimateMercatorGridLayer,
  getWildfireHotspotsForYear,
} from '../utils/leafletClimateLayer';

interface InteractiveMapViewProps {
  language: Language;
  theme: ThemeMode;
  mapTileMode: 'osm' | 'satellite';
  activeLayer: ClimateLayerId;
  currentYear: number;
  selectedLocation: LatLonCoordinate | null;
  isLocating?: boolean;
  onSelectLayer?: (layerId: ClimateLayerId) => void;
  onLocateMe: () => void;
  onSwitchTo3D: () => void;
  onClearLocation: () => void;
  onSelectMapPoint?: (coord: LatLonCoordinate) => void;
}

function getZoomForPlaceType(placeType?: string): number {
  const t = (placeType || '').toLowerCase();
  if (t.includes('country')) return 5;
  if (t.includes('state') || t.includes('region') || t.includes('province') || t.includes('governorate')) return 7;
  if (t.includes('county') || t.includes('district') || t.includes('administrative')) return 10;
  if (t.includes('city') || t.includes('municipality')) return 11;
  if (t.includes('town') || t.includes('suburb')) return 13;
  if (t.includes('village') || t.includes('neighbourhood') || t.includes('quarter')) return 14;
  return 11;
}

function createPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'terrascope-map-pin-wrapper',
    html: `
      <div class="terrascope-map-pin">
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42" fill="none">
          <path d="M17 1C8.71573 1 2 7.71573 2 16C2 26.8 17 41 17 41C17 41 32 26.8 32 16C32 7.71573 25.2843 1 17 1Z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5"/>
          <circle cx="17" cy="16" r="5.5" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 41],
    popupAnchor: [0, -38],
  });
}

function getLayerSmallIcon(id: ClimateLayerId) {
  switch (id) {
    case 'temp_anomaly':
      return <Thermometer className="w-3.5 h-3.5 text-orange-500" />;
    case 'vegetation_ndvi':
      return <Leaf className="w-3.5 h-3.5 text-emerald-500" />;
    case 'co2_distribution':
      return <Wind className="w-3.5 h-3.5 text-amber-500" />;
    case 'sea_ice':
      return <Snowflake className="w-3.5 h-3.5 text-cyan-500" />;
    case 'thermal_wildfires':
      return <Flame className="w-3.5 h-3.5 text-red-500" />;
    default:
      return <Layers className="w-3.5 h-3.5 text-blue-500" />;
  }
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  language,
  theme,
  mapTileMode,
  activeLayer,
  currentYear,
  selectedLocation,
  isLocating = false,
  onSelectLayer,
  onLocateMe,
  onSwitchTo3D,
  onClearLocation,
  onSelectMapPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const climateGridLayerRef = useRef<ClimateMercatorGridLayer | null>(null);
  const wildfireGroupRef = useRef<L.LayerGroup | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isOverlayVisible, setIsOverlayVisible] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.72);
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(false);

  const onSwitchTo3DRef = useRef(onSwitchTo3D);
  const onSelectMapPointRef = useRef(onSelectMapPoint);
  const languageRef = useRef(language);

  useEffect(() => {
    onSwitchTo3DRef.current = onSwitchTo3D;
    onSelectMapPointRef.current = onSelectMapPoint;
    languageRef.current = language;
  }, [onSwitchTo3D, onSelectMapPoint, language]);

  // Initialize Leaflet Map instance once
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const initialCenter: [number, number] = selectedLocation
      ? [selectedLocation.lat, selectedLocation.lon]
      : [26.8206, 30.8025];
    const initialZoom = selectedLocation ? getZoomForPlaceType(selectedLocation.placeType) : 3;

    const map = L.map(container, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      worldCopyJump: true,
    });

    // Dedicated non-blocking pane for NASA Web Mercator climate raster layer (above base tiles z=200, below pins/popups)
    const climatePane = map.createPane('climateOverlayPane');
    climatePane.style.zIndex = '250';
    climatePane.style.pointerEvents = 'none';

    const climateMarkersPane = map.createPane('climateMarkersPane');
    climateMarkersPane.style.zIndex = '430';

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!onSelectMapPointRef.current) return;
      const lat = parseFloat(e.latlng.lat.toFixed(4));
      const lon = parseFloat(e.latlng.lng.toFixed(4));
      const isAr = languageRef.current === 'ar';
      onSelectMapPointRef.current({
        lat,
        lon,
        name: isAr
          ? `موقع محدد (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
          : `Pinned Point (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
        display: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
        placeType: 'place',
      });
    });

    const gridLayer = new ClimateMercatorGridLayer({
      pane: 'climateOverlayPane',
      activeLayer,
      currentYear,
      isSatellite: mapTileMode === 'satellite',
      opacity: isOverlayVisible && activeLayer !== 'none' ? overlayOpacity : 0,
    });
    gridLayer.addTo(map);
    climateGridLayerRef.current = gridLayer;

    const fireGroup = L.layerGroup([], { pane: 'climateMarkersPane' });
    fireGroup.addTo(map);
    wildfireGroupRef.current = fireGroup;

    mapRef.current = map;

    const handleInvalidate = () => {
      map.invalidateSize();
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleInvalidate);
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', handleInvalidate);
    window.addEventListener('orientationchange', handleInvalidate);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleInvalidate);
      window.removeEventListener('orientationchange', handleInvalidate);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      climateGridLayerRef.current = null;
      wildfireGroupRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Swap OpenStreetMap Standard vs Satellite Tile Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const tileUrl =
      mapTileMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const attribution =
      mapTileMode === 'satellite'
        ? '&copy; Esri, Maxar, Earthstar Geographics'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const layer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      crossOrigin: true,
    });

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [mapTileMode]);

  // Synchronize Web Mercator Climate Grid Layer & NASA FIRMS Wildfire Beacons on Standard + Satellite Maps
  useEffect(() => {
    const grid = climateGridLayerRef.current;
    const fireGroup = wildfireGroupRef.current;
    if (!grid) return;

    const effectiveOpacity =
      !isOverlayVisible || activeLayer === 'none' ? 0 : overlayOpacity;

    grid.updateClimateState(
      activeLayer,
      currentYear,
      mapTileMode === 'satellite',
      effectiveOpacity
    );

    if (fireGroup) {
      fireGroup.clearLayers();
      if (isOverlayVisible && activeLayer === 'thermal_wildfires') {
        const hotspots = getWildfireHotspotsForYear(currentYear);
        hotspots.forEach((pt) => {
          const halo = L.circleMarker([pt.lat, pt.lon], {
            pane: 'climateMarkersPane',
            radius: 5 + pt.intensity * 6,
            color: '#f97316',
            weight: 1.5,
            opacity: Math.min(0.95, overlayOpacity + 0.15),
            fillColor: '#ef4444',
            fillOpacity: Math.min(0.85, overlayOpacity * 0.78),
          });

          const core = L.circleMarker([pt.lat, pt.lon], {
            pane: 'climateMarkersPane',
            radius: 2.5,
            color: '#fff7ed',
            weight: 1,
            opacity: Math.min(1, overlayOpacity + 0.2),
            fillColor: '#ffffff',
            fillOpacity: Math.min(0.95, overlayOpacity + 0.15),
          });

          const popupEl = buildWildfirePopupDom(pt, currentYear, language);
          halo.bindPopup(popupEl, { maxWidth: 250 });
          core.bindPopup(popupEl, { maxWidth: 250 });

          fireGroup.addLayer(halo);
          fireGroup.addLayer(core);
        });
      }
    }
  }, [activeLayer, currentYear, mapTileMode, isOverlayVisible, overlayOpacity, language]);

  // Update Marker, Popup & Fly/Zoom whenever selectedLocation or language changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedLocation) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const { lat, lon, name, display, placeType, boundingBox } = selectedLocation;
    const isAr = language === 'ar';

    map.invalidateSize({ animate: false });

    const popupRoot = document.createElement('div');
    popupRoot.dir = isAr ? 'rtl' : 'ltr';
    popupRoot.className = 'min-w-[210px] space-y-2 text-xs font-sans';

    const titleEl = document.createElement('div');
    titleEl.className = 'font-bold text-sm leading-snug';
    titleEl.textContent = name;
    popupRoot.appendChild(titleEl);

    if (display && display !== name) {
      const subEl = document.createElement('div');
      subEl.className = 'opacity-75 text-[11px] leading-snug';
      subEl.textContent = display;
      popupRoot.appendChild(subEl);
    }

    const coordsBox = document.createElement('div');
    coordsBox.className = 'grid grid-cols-2 gap-1.5 pt-1 border-t border-current/15 font-mono text-[11px] tabular-nums';

    const latSpan = document.createElement('div');
    latSpan.textContent = `${isAr ? 'خط العرض:' : 'Lat:'} ${lat.toFixed(4)}°`;

    const lonSpan = document.createElement('div');
    lonSpan.textContent = `${isAr ? 'خط الطول:' : 'Lon:'} ${lon.toFixed(4)}°`;

    coordsBox.appendChild(latSpan);
    coordsBox.appendChild(lonSpan);
    popupRoot.appendChild(coordsBox);

    const fly3dBtn = document.createElement('button');
    fly3dBtn.type = 'button';
    fly3dBtn.className =
      'w-full mt-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors';
    fly3dBtn.textContent = isAr ? 'عرض الموقع على الكرة 3D' : 'View on 3D Globe';
    fly3dBtn.addEventListener('click', () => {
      onSwitchTo3DRef.current();
    });
    popupRoot.appendChild(fly3dBtn);

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lon], { icon: createPinIcon() }).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lon]);
    }

    markerRef.current.bindPopup(popupRoot, {
      closeButton: true,
      maxWidth: 280,
      className: 'terrascope-leaflet-popup',
    });

    const targetZoom = getZoomForPlaceType(placeType);
    if (
      boundingBox &&
      Math.abs(boundingBox[1] - boundingBox[0]) > 0.005 &&
      Math.abs(boundingBox[3] - boundingBox[2]) > 0.005
    ) {
      map.flyToBounds(
        [
          [boundingBox[0], boundingBox[2]],
          [boundingBox[1], boundingBox[3]],
        ],
        {
          padding: [48, 48],
          maxZoom: Math.max(targetZoom, 12),
          duration: 1.0,
        }
      );
    } else {
      map.flyTo([lat, lon], targetZoom, { duration: 1.0 });
    }

    const openTimer = window.setTimeout(() => {
      markerRef.current?.openPopup();
    }, 450);

    return () => window.clearTimeout(openTimer);
  }, [selectedLocation, language]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const isAr = language === 'ar';
  const activeLayerInfo = CLIMATE_LAYERS.find((l) => l.id === activeLayer) || CLIMATE_LAYERS[0];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Leaflet Canvas Mount */}
      <div
        ref={containerRef}
        className="w-full h-full z-0"
        data-theme={theme}
      />

      {/* Custom Map Zoom (+/-) & My Location Controls */}
      <div
        className={`toolbar absolute top-14 lg:top-3 ${isAr ? 'left-3' : 'right-3'} z-[420] flex flex-col gap-1.5 select-none`}
      >
        <div
          className={`rounded-2xl border shadow-xl backdrop-blur-md p-1.5 flex flex-col gap-1 transition-colors ${
            theme === 'dark'
              ? 'bg-[#101827]/92 border-[#334155] text-slate-100'
              : 'bg-white/95 border-[#dddddd] text-[#172033]'
          }`}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] dark:hover:border-[#60a5fa] flex items-center justify-center transition-colors border border-[#dddddd] dark:border-[#334155]"
            title={isAr ? 'تكبير الخريطة (+)' : 'Zoom In (+)'}
            aria-label={isAr ? 'تكبير الخريطة' : 'Zoom In'}
          >
            <Plus className="w-4 h-4 icon" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] dark:hover:border-[#60a5fa] flex items-center justify-center transition-colors border border-[#dddddd] dark:border-[#334155]"
            title={isAr ? 'تصغير الخريطة (-)' : 'Zoom Out (-)'}
            aria-label={isAr ? 'تصغير الخريطة' : 'Zoom Out'}
          >
            <Minus className="w-4 h-4 icon" />
          </button>

          <div className="h-px bg-[#dddddd] dark:bg-[#334155] my-0.5" />

          <button
            type="button"
            onClick={onLocateMe}
            disabled={isLocating}
            className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#2563eb]/10 dark:bg-blue-500/20 text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb] hover:text-white flex items-center justify-center transition-colors border border-[#2563eb]/40 dark:border-[#60a5fa]/40 disabled:opacity-60"
            title={isAr ? 'تحديد موقعي الحالي' : 'Locate My Position'}
            aria-label={isAr ? 'تحديد موقعي' : 'My Location'}
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 icon animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4 icon" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsOverlayVisible((v) => !v)}
            className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-colors border ${
              isOverlayVisible && activeLayer !== 'none'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-400/60'
                : 'bg-[#f3f4f6] dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-[#dddddd] dark:border-[#334155]'
            }`}
            title={
              isOverlayVisible
                ? isAr
                  ? 'إخفاء تأثير طبقة المناخ'
                  : 'Hide Climate Layer Overlay'
                : isAr
                  ? 'إظهار تأثير طبقة المناخ'
                  : 'Show Climate Layer Overlay'
            }
            aria-label={isAr ? 'تبديل طبقة المناخ' : 'Toggle Climate Overlay'}
          >
            {isOverlayVisible && activeLayer !== 'none' ? (
              <Eye className="w-4 h-4 icon" />
            ) : (
              <EyeOff className="w-4 h-4 icon" />
            )}
          </button>
        </div>
      </div>

      {/* 2D Map Climate Layer Controls & Color Scale HUD */}
      <div
        className={`absolute bottom-3 md:bottom-auto md:top-3 ${
          isAr ? 'right-3' : 'left-3'
        } z-[422] max-w-[calc(100%-24px)] sm:max-w-[290px] select-none`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div
          className={`rounded-2xl border shadow-xl backdrop-blur-md text-xs transition-colors ${
            theme === 'dark'
              ? 'bg-[#101827]/92 border-[#334155] text-slate-100'
              : 'bg-white/95 border-[#dddddd] text-[#172033]'
          }`}
        >
          {/* Compact Summary Strip (Always visible, clickable to expand opacity/layer picker) */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-2">
            <button
              type="button"
              onClick={() => setIsHudExpanded((prev) => !prev)}
              className="flex items-center gap-2 min-w-0 text-start flex-1"
            >
              <span className="shrink-0">{getLayerSmallIcon(activeLayer)}</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[11px] truncate">
                  {isAr ? activeLayerInfo.nameAr : activeLayerInfo.nameEn}
                </div>
                <div className="text-[10px] opacity-70 font-mono tabular-nums truncate">
                  {currentYear} ·{' '}
                  {mapTileMode === 'satellite'
                    ? isAr
                      ? 'أقمار صناعية'
                      : 'Satellite'
                    : isAr
                      ? 'خريطة قياسية'
                      : 'Standard'}
                  {activeLayer !== 'none' && isOverlayVisible
                    ? ` · ${Math.round(overlayOpacity * 100)}%`
                    : ''}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsHudExpanded((prev) => !prev)}
              className="px-2 py-1 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] text-[10px] font-bold text-[#2563eb] dark:text-[#60a5fa] shrink-0"
            >
              {isHudExpanded
                ? isAr
                  ? 'إغلاق'
                  : 'Less'
                : isAr
                  ? 'تحكم'
                  : 'Tune'}
            </button>
          </div>

          {/* Expandable Layer Quick Switcher + Smooth Opacity Slider + Legend */}
          {isHudExpanded && (
            <div className="px-2.5 pb-2.5 pt-1.5 border-t border-[#dddddd] dark:border-[#334155] space-y-2.5">
              {/* Quick Layer Switcher inside Standard & Satellite Map */}
              {onSelectLayer && (
                <div className="grid grid-cols-2 gap-1">
                  {CLIMATE_LAYERS.map((layer) => {
                    const selected = activeLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => {
                          onSelectLayer(layer.id);
                          if (layer.id !== 'none') setIsOverlayVisible(true);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-colors text-start ${
                          selected
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-[#2563eb] dark:border-[#60a5fa] text-[#172033] dark:text-white'
                            : 'bg-[#f3f4f6] dark:bg-[#1e293b] border-[#dddddd] dark:border-[#334155] opacity-85 hover:opacity-100'
                        }`}
                      >
                        <span className="shrink-0">{getLayerSmallIcon(layer.id)}</span>
                        <span className="truncate">
                          {isAr ? layer.nameAr : layer.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Opacity Slider & Show/Hide Toggle */}
              {activeLayer !== 'none' && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOverlayVisible((v) => !v)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-semibold shrink-0 ${
                        isOverlayVisible
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-[#f3f4f6] dark:bg-[#1e293b] border-[#dddddd] dark:border-[#334155]'
                      }`}
                    >
                      {isOverlayVisible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                      <span>{isOverlayVisible ? (isAr ? 'ظاهر' : 'Visible') : isAr ? 'مخفي' : 'Hidden'}</span>
                    </button>

                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[10px] opacity-75 shrink-0">
                        {isAr ? 'الشفافية' : 'Opacity'}
                      </span>
                      <input
                        type="range"
                        min={20}
                        max={95}
                        step={5}
                        value={Math.round(overlayOpacity * 100)}
                        onChange={(e) => {
                          setOverlayOpacity(parseInt(e.target.value, 10) / 100);
                          if (!isOverlayVisible) setIsOverlayVisible(true);
                        }}
                        className="w-full h-1.5 bg-[#dddddd] dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                      />
                    </div>
                  </div>

                  {/* Gradient Color Legend */}
                  <div className="space-y-1">
                    <div
                      className="h-2 w-full rounded-full border border-[#dddddd] dark:border-[#334155]"
                      style={{ background: activeLayerInfo.legendGradient }}
                    />
                    <div className="flex justify-between text-[9px] opacity-75 font-mono">
                      <span>{activeLayerInfo.minScaleLabel}</span>
                      <span>{activeLayerInfo.maxScaleLabel}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Location Coordinates & Info Bar */}
      {selectedLocation && (
        <div
          className={`absolute top-14 sm:top-16 ${isAr ? 'right-3' : 'left-3'} z-[400] max-w-[min(290px,calc(100%-64px))] rounded-xl border p-2.5 sm:p-3 shadow-xl backdrop-blur-md text-xs space-y-2 transition-colors ${
            theme === 'dark'
              ? 'bg-[#101827]/92 border-[#334155] text-slate-100'
              : 'bg-white/95 border-[#dddddd] text-[#172033]'
          }`}
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0 mt-0.5 icon" />
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm truncate">{selectedLocation.name}</div>
                {selectedLocation.display && selectedLocation.display !== selectedLocation.name && (
                  <div className="text-[11px] opacity-75 truncate">{selectedLocation.display}</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearLocation}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
              title={isAr ? 'مسح العلامة' : 'Clear Marker'}
              aria-label={isAr ? 'مسح العلامة' : 'Clear Marker'}
            >
              <X className="w-3.5 h-3.5 icon" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] tabular-nums pt-1 border-t border-black/10 dark:border-white/10">
            <div>
              <span className="opacity-70 block text-[10px] font-sans">
                {isAr ? 'خط العرض (Lat)' : 'Latitude'}
              </span>
              <span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">
                {selectedLocation.lat.toFixed(4)}° {selectedLocation.lat >= 0 ? 'N' : 'S'}
              </span>
            </div>
            <div>
              <span className="opacity-70 block text-[10px] font-sans">
                {isAr ? 'خط الطول (Lon)' : 'Longitude'}
              </span>
              <span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">
                {selectedLocation.lon.toFixed(4)}° {selectedLocation.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => markerRef.current?.openPopup()}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-[#1e293b] border-[#334155] hover:border-[#60a5fa] text-slate-100'
                  : 'bg-[#f3f4f6] border-[#dddddd] hover:border-[#2563eb] text-[#172033]'
              }`}
            >
              <Navigation className="w-3 h-3 icon" />
              <span>{isAr ? 'تفاصيل العلامة' : 'Marker Info'}</span>
            </button>

            <button
              type="button"
              onClick={onSwitchTo3D}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
            >
              <Globe className="w-3 h-3 icon" />
              <span>{isAr ? 'الكرة 3D' : '3D Earth'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
