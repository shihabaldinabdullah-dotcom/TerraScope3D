/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Android-First Mobile Bottom Navigation & Collapsible Bottom Sheet
 * Provides one-handed mobile access to Map/3D, Climate Layers & KPIs, Timeline & Satellites,
 * and all 7 NASA Scientific Tools without cluttering or scrolling away from the viewport.
 */

import React from 'react';
import {
  AlertOctagon,
  BarChart3,
  Clock,
  Code,
  Compass,
  Database,
  Flame,
  History,
  Layers,
  Leaf,
  Map as MapIcon,
  MapPin,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Snowflake,
  Sparkles,
  Thermometer,
  TrendingUp,
  Waves,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { ClimateLayerId, ClimateYearData, Language, MapViewMode } from '../types';
import { CLIMATE_LAYERS, SATELLITES } from '../data/nasaData';
import { translations } from '../i18n';
import { PWAInstallButton } from './PWAInstallButton';

export type MobileSheetTab = 'map' | 'layers' | 'timeline' | 'tools';

interface MobileBottomNavProps {
  language: Language;
  activeSheet: MobileSheetTab;
  mapViewMode: MapViewMode;
  activeLayer: ClimateLayerId;
  currentYear: number;
  currentYearData: ClimateYearData;
  selectedSatelliteId: string | null;
  isPlaying: boolean;
  simulationSpeed: number;
  onChangeSheet: (tab: MobileSheetTab) => void;
  onSelectLayer: (layerId: ClimateLayerId) => void;
  onSelectSatellite: (satelliteId: string | null) => void;
  onSelectYear: (year: number) => void;
  onTogglePlay: () => void;
  onResetTimeline: () => void;
  onChangeSpeed: (speed: number) => void;
  onOpenAnalytics: () => void;
  onOpenTrendDetective: () => void;
  onOpenCities: () => void;
  onOpenHotspots: () => void;
  onOpenComparison: () => void;
  onOpenImpact: () => void;
  onOpenSources: () => void;
  onOpenCodeGuide: () => void;
}

function getLayerIcon(id: ClimateLayerId) {
  switch (id) {
    case 'temp_anomaly':
      return <Thermometer className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    case 'vegetation_ndvi':
      return <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'co2_distribution':
      return <Wind className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 'sea_ice':
      return <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />;
    case 'thermal_wildfires':
      return <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />;
    default:
      return <Layers className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />;
  }
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  language,
  activeSheet,
  mapViewMode,
  activeLayer,
  currentYear,
  currentYearData,
  selectedSatelliteId,
  isPlaying,
  simulationSpeed,
  onChangeSheet,
  onSelectLayer,
  onSelectSatellite,
  onSelectYear,
  onTogglePlay,
  onResetTimeline,
  onChangeSpeed,
  onOpenAnalytics,
  onOpenTrendDetective,
  onOpenCities,
  onOpenHotspots,
  onOpenComparison,
  onOpenImpact,
  onOpenSources,
  onOpenCodeGuide,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';
  const activeLayerInfo = CLIMATE_LAYERS.find((l) => l.id === activeLayer);
  const activeSatellite = SATELLITES.find((s) => s.id === selectedSatelliteId);
  const isSheetOpen = activeSheet !== 'map';

  const handleToggleTab = (tab: MobileSheetTab) => {
    if (tab === 'map') {
      onChangeSheet('map');
      return;
    }
    onChangeSheet(activeSheet === tab ? 'map' : tab);
  };

  return (
    <div className="md:hidden select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Subtle Scrim when Bottom Sheet is Open */}
      {isSheetOpen && (
        <div
          className="fixed inset-0 z-[480] bg-black/45 backdrop-blur-[1px]"
          onClick={() => onChangeSheet('map')}
        />
      )}

      {/* Draggable-Style Android Bottom Sheet */}
      {isSheetOpen && (
        <div
          className="fixed inset-x-0 z-[490] bg-white dark:bg-[#101827] border-t border-[#dddddd] dark:border-[#334155] rounded-t-3xl shadow-2xl flex flex-col max-h-[72vh] max-h-[72dvh] text-[#172033] dark:text-[#f8fafc] transition-colors"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
        >
          {/* Sheet Drag Handle & Header */}
          <div className="px-4 pt-2.5 pb-2 border-b border-[#dddddd] dark:border-[#334155] shrink-0">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-2" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {activeSheet === 'layers' && (
                  <>
                    <Layers className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                    <h2 className="text-xs font-bold truncate">
                      {isAr ? 'طبقات المناخ والمؤشرات العالمية' : 'Climate Layers & Global Metrics'}
                    </h2>
                  </>
                )}
                {activeSheet === 'timeline' && (
                  <>
                    <Clock className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                    <h2 className="text-xs font-bold truncate">
                      {isAr ? 'الجدول الزمني (1990–2026) والأقمار الصناعية' : 'Timeline (1990–2026) & Satellites'}
                    </h2>
                  </>
                )}
                {activeSheet === 'tools' && (
                  <>
                    <Wrench className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                    <h2 className="text-xs font-bold truncate">
                      {isAr ? 'أدوات ناسا والتحليلات العلمية' : 'NASA Scientific Tools & Analytics'}
                    </h2>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onChangeSheet('map')}
                className="w-8 h-8 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sheet Scrollable Body */}
          <div className="overflow-y-auto overscroll-contain p-3.5 space-y-4 text-xs">
            {/* TAB 1: CLIMATE LAYERS & KPIS */}
            {activeSheet === 'layers' && (
              <>
                <div className="text-[11px] px-2.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-200">
                  {mapViewMode === '3d'
                    ? isAr
                      ? 'الطبقة المختارة تظهر مباشرة على الكرة 3D — ويمكنك أيضاً التبديل للخريطة العادية أو الأقمار الصناعية لرؤية أثرها.'
                      : 'Active layer renders on the 3D Globe and dynamically overlays on Standard & Satellite Maps.'
                    : isAr
                      ? 'الطبقة المختارة مُطبّقة الآن بدقة جغرافية على الخريطة المفتوحة.'
                      : 'Active layer is projected geographically onto the open 2D / Satellite Map.'}
                </div>

                {/* 6 Climate Layer Buttons */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                  {CLIMATE_LAYERS.map((layer) => {
                    const isSelected = activeLayer === layer.id;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => onSelectLayer(layer.id)}
                        className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-start transition-all min-h-[46px] ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/80 border-[#2563eb] dark:border-[#60a5fa] text-[#172033] dark:text-white shadow-sm'
                            : 'bg-[#f3f4f6] dark:bg-[#1e293b]/80 border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0">{getLayerIcon(layer.id)}</span>
                          <span className="font-semibold text-xs leading-snug">
                            {isAr ? layer.nameAr : layer.nameEn}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#2563eb] dark:bg-[#60a5fa] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Layer Source & Legend */}
                {activeLayerInfo && activeLayer !== 'none' && (
                  <div className="p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="opacity-70">{t.layerSource}:</span>
                      <span className="font-bold text-[#2563eb] dark:text-[#60a5fa] truncate">
                        {activeLayerInfo.satelliteSource}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-85 leading-relaxed">
                      {isAr ? activeLayerInfo.descriptionAr : activeLayerInfo.descriptionEn}
                    </p>
                    <div className="space-y-1 pt-1">
                      <div
                        className="h-2.5 w-full rounded-full border border-[#dddddd] dark:border-[#334155]"
                        style={{ background: activeLayerInfo.legendGradient }}
                      />
                      <div className="flex justify-between text-[10px] opacity-75 font-mono">
                        <span>{activeLayerInfo.minScaleLabel}</span>
                        <span>{activeLayerInfo.maxScaleLabel}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Global KPI Metrics Grid */}
                <div className="space-y-2 pt-2 border-t border-[#dddddd] dark:border-[#334155]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold opacity-75 uppercase tracking-wider">
                      {isAr
                        ? `المؤشرات العالمية (${currentYearData.year})`
                        : `Global Metrics (${currentYearData.year})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeSheet('map');
                        onOpenAnalytics();
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#2563eb] dark:text-[#60a5fa]"
                    >
                      <span>{isAr ? 'الرسوم البيانية' : 'Full Charts'}</span>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-0.5 font-sans">
                        <Thermometer className="w-3 h-3 text-orange-500" />
                        <span className="truncate">{t.tempAnomalyTitle}</span>
                      </div>
                      <div className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                        +{currentYearData.globalTempAnomaly.toFixed(2)} °C
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-0.5 font-sans">
                        <Wind className="w-3 h-3 text-amber-500" />
                        <span className="truncate">{t.co2Title}</span>
                      </div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                        {currentYearData.co2Ppm.toFixed(1)} ppm
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-0.5 font-sans">
                        <Snowflake className="w-3 h-3 text-cyan-500" />
                        <span className="truncate">{t.iceExtentTitle}</span>
                      </div>
                      <div className="text-sm font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">
                        {currentYearData.arcticIceAreaMillionKm2.toFixed(1)} M km²
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-0.5 font-sans">
                        <Waves className="w-3 h-3 text-[#2563eb]" />
                        <span className="truncate">{t.seaLevelTitle}</span>
                      </div>
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                        +{currentYearData.seaLevelRiseMm.toFixed(1)} mm
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: TIMELINE SCRUBBER & SATELLITES */}
            {activeSheet === 'timeline' && (
              <>
                {/* Year Scrubber Controls */}
                <div className="p-3 rounded-2xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onTogglePlay}
                        className="w-10 h-10 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white flex items-center justify-center shadow-sm"
                        aria-label={isPlaying ? t.pause : t.play}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={onResetTimeline}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-[#101827] border border-[#dddddd] dark:border-[#334155] flex items-center justify-center"
                        aria-label={t.reset}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-base font-mono font-extrabold text-[#2563eb] dark:text-[#60a5fa] tabular-nums px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800">
                      {currentYear}
                    </span>

                    <div className="flex items-center gap-1 bg-white dark:bg-[#101827] p-1 rounded-xl border border-[#dddddd] dark:border-[#334155]">
                      {[1, 2, 5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => onChangeSpeed(speed)}
                          className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors ${
                            simulationSpeed === speed
                              ? 'bg-[#2563eb] text-white'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min="1990"
                      max="2026"
                      step="1"
                      value={currentYear}
                      onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-[#dddddd] dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                    />
                    <div className="flex justify-between text-[11px] font-mono opacity-75">
                      <span>1990</span>
                      <span>2008</span>
                      <span>2026</span>
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed bg-white dark:bg-[#101827] p-2.5 rounded-xl border border-[#dddddd] dark:border-[#334155]">
                    <span className="font-bold text-[#2563eb] dark:text-[#60a5fa] me-1">
                      {currentYear}:
                    </span>
                    {isAr ? currentYearData.summaryAr : currentYearData.summaryEn}
                  </p>
                </div>

                {/* NASA Orbiting Satellites */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-75 flex items-center gap-1.5">
                      <Orbit className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" />
                      <span>{isAr ? 'الأقمار الصناعية المدارية (3D)' : 'NASA Orbiting Satellites (3D)'}</span>
                    </span>
                    {activeSatellite && (
                      <button
                        type="button"
                        onClick={() => onSelectSatellite(null)}
                        className="text-[11px] font-semibold text-[#2563eb] dark:text-[#60a5fa]"
                      >
                        {t.deselectSatellite}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {SATELLITES.map((sat) => {
                      const isSelected = selectedSatelliteId === sat.id;
                      return (
                        <button
                          key={sat.id}
                          type="button"
                          onClick={() => {
                            onSelectSatellite(isSelected ? null : sat.id);
                            if (!isSelected) onChangeSheet('map');
                          }}
                          className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-start transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/75 border-[#2563eb] dark:border-[#60a5fa]'
                              : 'bg-[#f3f4f6] dark:bg-[#1e293b]/70 border-[#dddddd] dark:border-[#334155]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate">
                              {isAr ? sat.nameAr : sat.name}
                            </div>
                            <div className="text-[11px] opacity-75 truncate">
                              {sat.agency} · {sat.altitudeKm} km · {sat.velocityKmS} km/s
                            </div>
                          </div>
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: sat.color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: ALL NASA SCIENTIFIC TOOLS + PWA INSTALL */}
            {activeSheet === 'tools' && (
              <>
                <PWAInstallButton language={language} variant="card" />

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenAnalytics();
                    }}
                    className="col-span-2 flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/55 border border-blue-200 dark:border-blue-500/60 text-blue-900 dark:text-blue-100 font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="w-5 h-5 text-[#2563eb] dark:text-cyan-300" />
                      <span>{t.navAnalytics}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-blue-900/60">
                      5 Recharts
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenTrendDetective();
                    }}
                    className="col-span-2 flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/60 text-emerald-900 dark:text-emerald-100 font-bold"
                  >
                    <div className="flex items-center gap-2.5">
                      <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
                      <span>{t.navTrendDetective}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 dark:bg-emerald-900/60">
                      NASA POWER
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenCities();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] font-semibold min-h-[48px]"
                  >
                    <MapPin className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                    <span className="truncate">{t.navCities}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenHotspots();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] font-semibold min-h-[48px]"
                  >
                    <AlertOctagon className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate">{t.navHotspots}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenComparison();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] font-semibold min-h-[48px]"
                  >
                    <History className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate">{t.navComparison}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenImpact();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] font-semibold min-h-[48px]"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{t.navImpact}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenSources();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] font-semibold min-h-[48px]"
                  >
                    <Database className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span className="truncate">{t.navSources}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeSheet('map');
                      onOpenCodeGuide();
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] font-semibold min-h-[48px]"
                  >
                    <Code className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                    <span className="truncate">{isAr ? 'دليل الكود' : 'Code Guide'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fixed Android-Style Bottom Navigation Bar */}
      <nav
        aria-label={isAr ? 'شريط التنقل للهاتف' : 'Mobile bottom navigation'}
        className="fixed bottom-0 inset-x-0 z-[500] bg-white/98 dark:bg-[#101827]/98 border-t border-[#dddddd] dark:border-[#334155] backdrop-blur-md shadow-[0_-6px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
          <button
            type="button"
            onClick={() => handleToggleTab('map')}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition-colors ${
              activeSheet === 'map'
                ? 'text-[#2563eb] dark:text-[#60a5fa] bg-blue-50/90 dark:bg-blue-950/60 font-bold'
                : 'text-slate-600 dark:text-slate-400 font-medium'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[11px] leading-none">
              {isAr ? 'الخريطة' : 'Map'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleTab('layers')}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition-colors relative ${
              activeSheet === 'layers'
                ? 'text-[#2563eb] dark:text-[#60a5fa] bg-blue-50/90 dark:bg-blue-950/60 font-bold'
                : 'text-slate-600 dark:text-slate-400 font-medium'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[11px] leading-none">
              {isAr ? 'الطبقات' : 'Layers'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleTab('timeline')}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition-colors ${
              activeSheet === 'timeline'
                ? 'text-[#2563eb] dark:text-[#60a5fa] bg-blue-50/90 dark:bg-blue-950/60 font-bold'
                : 'text-slate-600 dark:text-slate-400 font-medium'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[11px] leading-none">
              {isAr ? 'الزمن' : 'Time'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleTab('tools')}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition-colors ${
              activeSheet === 'tools'
                ? 'text-[#2563eb] dark:text-[#60a5fa] bg-blue-50/90 dark:bg-blue-950/60 font-bold'
                : 'text-slate-600 dark:text-slate-400 font-medium'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-[11px] leading-none">
              {isAr ? 'الأدوات' : 'Tools'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};
