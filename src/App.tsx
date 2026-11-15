/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Root Application Controller
 * NASA Space Apps Challenge Earth Observation & Climate Simulator
 */

import React, { useState, useEffect } from 'react';
import { Globe, Layers, Satellite as SatelliteIcon } from 'lucide-react';
import { EarthCanvas } from './components/EarthCanvas';
import { InteractiveMapView } from './components/InteractiveMapView';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { ClimateLayersSidePanel } from './components/ClimateLayersSidePanel';
import { ViewportControls } from './components/ViewportControls';
import { SatelliteInfoCard } from './components/SatelliteInfoCard';
import { ClimateAnalyticsDashboard } from './components/ClimateAnalyticsDashboard';
import { ClimateAnalyticsPage } from './components/ClimateAnalyticsPage';
import { EarthTrendDetectiveModal } from './components/EarthTrendDetectiveModal';
import { CodeExplainerModal } from './components/CodeExplainerModal';
import { CityExplorerModal } from './components/CityExplorerModal';
import { HotspotsModal } from './components/HotspotsModal';
import { ClimateChartsModal } from './components/ClimateChartsModal';
import { BaselineComparisonModal } from './components/BaselineComparisonModal';
import { ClimateImpactGuideModal } from './components/ClimateImpactGuideModal';
import { OfficialSourcesModal } from './components/OfficialSourcesModal';
import { MobileBottomNav, MobileSheetTab } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Language, ClimateLayerId, CameraPreset, LatLonCoordinate, ThemeMode, MapViewMode } from './types';
import { SATELLITES, CLIMATE_TIMELINE } from './data/nasaData';
import { translations } from './i18n';

function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('terrascope-theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Ignore storage access errors
  }
  return 'light';
}

export default function App() {
  const [currentView, setCurrentView] = useState<'simulator' | 'analytics'>('simulator');
  const [language, setLanguage] = useState<Language>('ar');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('3d');
  const [activeLayer, setActiveLayer] = useState<ClimateLayerId>('temp_anomaly');
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('global');
  const [targetCoordinate, setTargetCoordinate] = useState<LatLonCoordinate | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Zoom, Geolocation & Reset triggers
  const [zoomAction, setZoomAction] = useState<number>(0);
  const [zoomDelta, setZoomDelta] = useState<number>(0);
  const [resetTrigger, setResetTrigger] = useState<number>(0);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // UI Navigation & Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheetTab>('map');

  // Modals state
  const [isTrendDetectiveOpen, setIsTrendDetectiveOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [isCodeGuideOpen, setIsCodeGuideOpen] = useState<boolean>(false);
  const [isCitiesOpen, setIsCitiesOpen] = useState<boolean>(false);
  const [isHotspotsOpen, setIsHotspotsOpen] = useState<boolean>(false);
  const [isChartsOpen, setIsChartsOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isImpactOpen, setIsImpactOpen] = useState<boolean>(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState<boolean>(false);

  const t = translations[language];

  // Sync HTML lang and dir attributes dynamically
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Sync Dark / Light theme attribute, Tailwind dark class, PWA theme-color, and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#101827' : '#ffffff');
    }
    try {
      localStorage.setItem('terrascope-theme', theme);
    } catch {
      // Ignore storage access errors
    }
  }, [theme]);

  // Historical Timeline Auto-playback effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(300, 1400 / simulationSpeed);
    const timer = setInterval(() => {
      setCurrentYear((prev) => {
        if (prev >= 2026) return 1990;
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, simulationSpeed]);

  const handleToggleLanguage = () => {
    setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSelectSatellite = (id: string | null) => {
    setSelectedSatelliteId(id);
    if (id) {
      setMapViewMode('3d');
      setCameraPreset('satellite');
      setTargetCoordinate(null);
    } else {
      setCameraPreset('global');
    }
  };

  const handleSetCameraPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    setTargetCoordinate(null);
    if (preset !== 'satellite') {
      setSelectedSatelliteId(null);
    }
  };

  // Used by modals & explicit "Fly to on 3D Globe" actions
  const handleFlyToLocation = (coord: LatLonCoordinate) => {
    setTargetCoordinate(coord);
    setSelectedSatelliteId(null);
    setCameraPreset('coordinate');
    setMapViewMode('3d');
  };

  // Used by geographic search: places a real map marker, auto-zooms OSM/Satellite, and syncs 3D target
  const handleSearchLocation = (coord: LatLonCoordinate) => {
    setTargetCoordinate(coord);
    setSelectedSatelliteId(null);
    setCameraPreset('coordinate');
    setCurrentView('simulator');
    setMapViewMode(prev => (prev === 'satellite' ? 'satellite' : 'osm'));
  };

  const handleZoomIn = () => {
    setZoomDelta(-0.6);
    setZoomAction(Date.now());
  };

  const handleZoomOut = () => {
    setZoomDelta(0.6);
    setZoomAction(Date.now());
  };

  const handleResetCamera = () => {
    setTargetCoordinate(null);
    setSelectedSatelliteId(null);
    setCameraPreset('global');
    setResetTrigger(Date.now());
  };

  const handleLocateMe = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoNotice(
        language === 'ar'
          ? 'خدمة تحديد الموقع غير مدعومة في هذا المتصفح.'
          : 'Geolocation is not supported by this browser.'
      );
      window.setTimeout(() => setGeoNotice(null), 4000);
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lon = parseFloat(position.coords.longitude.toFixed(5));
        const isAr = language === 'ar';
        const coord: LatLonCoordinate = {
          lat,
          lon,
          name: isAr ? 'موقعي الحالي' : 'My Current Location',
          display: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
          placeType: 'town',
        };
        setTargetCoordinate(coord);
        setSelectedSatelliteId(null);
        setCameraPreset('coordinate');
        setCurrentView('simulator');
        setMapViewMode((prev) => (prev === 'satellite' ? 'satellite' : 'osm'));
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        const isAr = language === 'ar';
        const message =
          err.code === err.PERMISSION_DENIED
            ? isAr
              ? 'تم رفض إذن الوصول للموقع الجغرافي. يرجى السماح بالوصول من إعدادات المتصفح.'
              : 'Location permission denied. Please enable location access in browser settings.'
            : isAr
              ? 'تعذّر تحديد موقعك الحالي. حاول مرة أخرى أو ابحث يدوياً عن مدينتك.'
              : 'Unable to retrieve your current location. Please try again or search manually.';
        setGeoNotice(message);
        window.setTimeout(() => setGeoNotice(null), 4500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const selectedSatellite = SATELLITES.find(s => s.id === selectedSatelliteId) || null;
  const currentYearData = CLIMATE_TIMELINE.find(item => item.year === currentYear) || CLIMATE_TIMELINE[CLIMATE_TIMELINE.length - 1];

  return (
    <div className="app-shell relative bg-[var(--bg)] text-[var(--text)] font-sans select-none transition-colors duration-300">
      {/* 1. Header (Responsive with Real Geographic Search, Theme Toggle, Analytics & Scientific Tools) */}
      <TopBar
        language={language}
        theme={theme}
        currentView={currentView}
        cameraPreset={cameraPreset}
        onSetCameraPreset={handleSetCameraPreset}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
        onOpenCodeGuide={() => setIsCodeGuideOpen(true)}
        onOpenAnalytics={() => setCurrentView(currentView === 'analytics' ? 'simulator' : 'analytics')}
        onOpenTrendDetective={() => setIsTrendDetectiveOpen(true)}
        onOpenCities={() => setIsCitiesOpen(true)}
        onOpenHotspots={() => setIsHotspotsOpen(true)}
        onOpenCharts={() => setCurrentView('analytics')}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenImpact={() => setIsImpactOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onFlyToLocation={handleFlyToLocation}
        onSearchLocation={handleSearchLocation}
      />

      {/* 2. Responsive Main Layout: Side-by-Side on Desktop/Tablet, Full-Viewport App Shell on Mobile */}
      <main className={`main-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* 3. Climate Observation Layers & KPI Side Panel (.sidebar) */}
        <ClimateLayersSidePanel
          language={language}
          activeLayer={activeLayer}
          currentYearData={currentYearData}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed(prev => !prev)}
          onSelectLayer={setActiveLayer}
          onOpenCharts={() => setCurrentView('analytics')}
        />

        {/* 4. Dual Map Viewport: Three.js 3D Globe OR Real Interactive Leaflet Map (OSM / Satellite) (.map-area) */}
        <section className={`map-area relative overflow-hidden ${mapViewMode === '3d' ? 'bg-[#020408]' : 'bg-[var(--bg)]'}`}>
          {/* Top-Center Map View Switcher (3D Globe | Standard Map | Satellite Map) */}
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[450] flex items-center gap-1 p-1 rounded-xl bg-white/95 dark:bg-[#101827]/92 border border-[#dddddd] dark:border-[#334155] shadow-lg backdrop-blur-md text-xs max-w-[calc(100%-24px)] overflow-x-auto"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <button
              type="button"
              onClick={() => setMapViewMode('3d')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                mapViewMode === '3d'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-[#172033] dark:text-slate-200 hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 icon" />
              <span>{language === 'ar' ? 'الكرة 3D' : '3D Globe'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMapViewMode('osm')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                mapViewMode === 'osm'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-[#172033] dark:text-slate-200 hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 icon" />
              <span>{language === 'ar' ? 'خريطة عادية' : 'Standard Map'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMapViewMode('satellite')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                mapViewMode === 'satellite'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-[#172033] dark:text-slate-200 hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b]'
              }`}
            >
              <SatelliteIcon className="w-3.5 h-3.5 icon" />
              <span>{language === 'ar' ? 'أقمار صناعية' : 'Satellite Map'}</span>
            </button>
          </div>

          {mapViewMode === '3d' ? (
            <>
              <EarthCanvas
                activeLayer={activeLayer}
                currentYear={currentYear}
                selectedSatelliteId={selectedSatelliteId}
                cameraPreset={cameraPreset}
                targetCoordinate={targetCoordinate}
                simulationSpeed={isPlaying ? simulationSpeed : 1}
                isAutoRotating={isAutoRotating}
                onSelectSatellite={handleSelectSatellite}
                onSelectHotspot={() => setIsHotspotsOpen(true)}
                zoomAction={zoomAction}
                zoomDelta={zoomDelta}
                resetTrigger={resetTrigger}
                language={language}
                onFallbackTo2DMap={() => setMapViewMode('osm')}
              />

              {/* 3D Viewport Controls (Zoom In/Out, My Location, Rotate, Reset) */}
              <ViewportControls
                language={language}
                cameraPreset={cameraPreset}
                isAutoRotating={isAutoRotating}
                isLocating={isLocating}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onToggleAutoRotate={() => setIsAutoRotating(!isAutoRotating)}
                onResetCamera={handleResetCamera}
                onLocateMe={handleLocateMe}
                onSetCameraPreset={handleSetCameraPreset}
              />

              {/* Active Inspection Target Badge (when inspecting a city/hotspot in 3D) */}
              {targetCoordinate && (
                <div
                  className={`absolute top-14 xl:top-3 ${language === 'ar' ? 'right-3' : 'left-3'} z-[420] flex items-center gap-1.5 sm:gap-2 max-w-[calc(100%-72px)] bg-white/95 dark:bg-[#101827]/92 border border-[#2563eb]/60 dark:border-[#60a5fa]/60 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-xl text-xs backdrop-blur-md text-[#172033] dark:text-[#f8fafc]`}
                >
                  <div className="w-2 h-2 rounded-full bg-[#2563eb] dark:bg-[#60a5fa] shrink-0" />
                  <span className="font-semibold truncate">{targetCoordinate.name}</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono hidden sm:inline shrink-0 tabular-nums">
                    ({targetCoordinate.lat.toFixed(2)}°, {targetCoordinate.lon.toFixed(2)}°)
                  </span>
                  <button
                    type="button"
                    onClick={() => setMapViewMode('osm')}
                    className="px-1.5 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] text-[10px] font-semibold text-[#2563eb] dark:text-[#60a5fa] hover:border-[#2563eb] shrink-0"
                  >
                    {language === 'ar' ? 'على الخريطة' : 'Map'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCoordinate(null)}
                    className="text-slate-500 hover:text-[#172033] dark:text-slate-400 dark:hover:text-white ms-0.5 text-xs shrink-0"
                    aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
                  >
                    ×
                  </button>
                </div>
              )}
            </>
          ) : (
            <InteractiveMapView
              language={language}
              theme={theme}
              mapTileMode={mapViewMode}
              activeLayer={activeLayer}
              currentYear={currentYear}
              selectedLocation={targetCoordinate}
              isLocating={isLocating}
              onSelectLayer={setActiveLayer}
              onLocateMe={handleLocateMe}
              onSwitchTo3D={() => setMapViewMode('3d')}
              onClearLocation={() => setTargetCoordinate(null)}
              onSelectMapPoint={(coord) => {
                setTargetCoordinate(coord);
                setCameraPreset('coordinate');
              }}
            />
          )}

          {/* Temporary Geolocation Feedback Banner */}
          {geoNotice && (
            <div
              role="status"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] max-w-[calc(100%-24px)] px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/95 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-xs font-medium shadow-xl backdrop-blur-md"
            >
              {geoNotice}
            </div>
          )}
        </section>

        {/* 5. Satellite Telemetry HUD Card (when a satellite is selected) */}
        <SatelliteInfoCard
          language={language}
          satellite={selectedSatellite}
          onClose={() => handleSelectSatellite(null)}
        />

        {/* 6. Collapsible Bottom Control Dock (Timeline & Satellites) (.control-panel) */}
        <BottomDock
          language={language}
          activeLayer={activeLayer}
          currentYear={currentYear}
          selectedSatelliteId={selectedSatelliteId}
          isPlaying={isPlaying}
          simulationSpeed={simulationSpeed}
          onSelectLayer={setActiveLayer}
          onSelectSatellite={handleSelectSatellite}
          onSelectYear={setCurrentYear}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onResetTimeline={() => {
            setCurrentYear(1990);
            setIsPlaying(false);
          }}
          onChangeSpeed={setSimulationSpeed}
        />
      </main>

      {/* Standalone Full-Page Climate Analytics Platform (5 Recharts Visualizations) */}
      {currentView === 'analytics' && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[var(--bg)] text-[var(--text)] animate-in fade-in duration-200">
          <ClimateAnalyticsPage
            language={language}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onBackToSimulator={() => setCurrentView('simulator')}
            onToggleLanguage={handleToggleLanguage}
            onOpenTrendDetective={() => setIsTrendDetectiveOpen(true)}
            onFlyToLocation={handleFlyToLocation}
          />
        </div>
      )}

      {/* Earth System Trend Detective Modal (NASA POWER API & SciPy Regression) */}
      <EarthTrendDetectiveModal
        language={language}
        theme={theme}
        isOpen={isTrendDetectiveOpen}
        onClose={() => setIsTrendDetectiveOpen(false)}
        onFlyToLocation={handleFlyToLocation}
      />

      {/* Interactive Climate Analytics Modal */}
      <ClimateAnalyticsDashboard
        language={language}
        theme={theme}
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* 8. Comprehensive NASA Scientific Modals */}
      <CityExplorerModal
        language={language}
        isOpen={isCitiesOpen}
        onClose={() => setIsCitiesOpen(false)}
        onFlyToLocation={handleFlyToLocation}
      />

      <HotspotsModal
        language={language}
        isOpen={isHotspotsOpen}
        onClose={() => setIsHotspotsOpen(false)}
        onFlyToLocation={handleFlyToLocation}
      />

      <ClimateChartsModal
        language={language}
        theme={theme}
        isOpen={isChartsOpen}
        onClose={() => setIsChartsOpen(false)}
      />

      <BaselineComparisonModal
        language={language}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />

      <ClimateImpactGuideModal
        language={language}
        isOpen={isImpactOpen}
        onClose={() => setIsImpactOpen(false)}
      />

      <OfficialSourcesModal
        language={language}
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
      />

      <CodeExplainerModal
        language={language}
        isOpen={isCodeGuideOpen}
        onClose={() => setIsCodeGuideOpen(false)}
      />

      {/* Android-First Mobile Bottom Navigation & Bottom Sheet (< 768px) */}
      <MobileBottomNav
        language={language}
        activeSheet={mobileSheet}
        mapViewMode={mapViewMode}
        activeLayer={activeLayer}
        currentYear={currentYear}
        currentYearData={currentYearData}
        selectedSatelliteId={selectedSatelliteId}
        isPlaying={isPlaying}
        simulationSpeed={simulationSpeed}
        onChangeSheet={setMobileSheet}
        onSelectLayer={setActiveLayer}
        onSelectSatellite={handleSelectSatellite}
        onSelectYear={setCurrentYear}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onResetTimeline={() => {
          setCurrentYear(1990);
          setIsPlaying(false);
        }}
        onChangeSpeed={setSimulationSpeed}
        onOpenAnalytics={() => setCurrentView('analytics')}
        onOpenTrendDetective={() => setIsTrendDetectiveOpen(true)}
        onOpenCities={() => setIsCitiesOpen(true)}
        onOpenHotspots={() => setIsHotspotsOpen(true)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenImpact={() => setIsImpactOpen(true)}
        onOpenSources={() => setIsSourcesOpen(true)}
        onOpenCodeGuide={() => setIsCodeGuideOpen(true)}
      />

      {/* Offline Connectivity Indicator Banner */}
      <OfflineIndicator language={language} />
    </div>
  );
}
