/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Collapsible Bottom Control Dock
 * Designed for zero viewport occlusion: consolidates climate layers, satellite selectors,
 * and time-lapse controls into a single ergonomic bottom dock with cinema mode toggle.
 */

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Pause, 
  RotateCcw, 
  Layers, 
  Orbit, 
  Clock, 
  Flame, 
  Thermometer, 
  Leaf, 
  Wind, 
  Snowflake,
  ExternalLink
} from 'lucide-react';
import { ClimateLayerId, Language, Satellite } from '../types';
import { CLIMATE_LAYERS, CLIMATE_TIMELINE, SATELLITES } from '../data/nasaData';
import { translations } from '../i18n';

interface BottomDockProps {
  language: Language;
  activeLayer: ClimateLayerId;
  currentYear: number;
  selectedSatelliteId: string | null;
  isPlaying: boolean;
  simulationSpeed: number;
  onSelectLayer: (layerId: ClimateLayerId) => void;
  onSelectSatellite: (satelliteId: string | null) => void;
  onSelectYear: (year: number) => void;
  onTogglePlay: () => void;
  onResetTimeline: () => void;
  onChangeSpeed: (speed: number) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  language,
  activeLayer,
  currentYear,
  selectedSatelliteId,
  isPlaying,
  simulationSpeed,
  onSelectLayer,
  onSelectSatellite,
  onSelectYear,
  onTogglePlay,
  onResetTimeline,
  onChangeSpeed,
}) => {
  const t = translations[language];
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'climate' | 'satellites' | 'timeline'>('climate');

  // Find active year data point
  const currentYearData = CLIMATE_TIMELINE.find(item => item.year === currentYear) || CLIMATE_TIMELINE[CLIMATE_TIMELINE.length - 1];
  const activeLayerInfo = CLIMATE_LAYERS.find(layer => layer.id === activeLayer);
  const activeSatellite = SATELLITES.find(s => s.id === selectedSatelliteId);

  const getLayerIcon = (id: ClimateLayerId) => {
    switch (id) {
      case 'temp_anomaly': return <Thermometer className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
      case 'vegetation_ndvi': return <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'co2_distribution': return <Wind className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'sea_ice': return <Snowflake className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />;
      case 'thermal_wildfires': return <Flame className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />;
      default: return <Layers className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" />;
    }
  };

  return (
    <div
      className={`control-panel hidden md:block z-[410] transition-transform duration-300 ease-out select-none w-[94%] max-w-4xl mb-3 ${
        isCollapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-[#172033] dark:text-slate-200 bg-white/95 dark:bg-[#101827]/95 border border-[#dddddd] dark:border-[#334155] rounded-full shadow-lg hover:border-[#2563eb] transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 icon text-[#2563eb] dark:text-[#60a5fa]" />
              <span>{t.showDock}</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 icon text-[#2563eb] dark:text-[#60a5fa]" />
              <span>{t.hideDock}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className={`${isCollapsed ? 'max-[600px]:hidden' : ''} bg-white/95 dark:bg-[#101827]/95 border border-[#dddddd] dark:border-[#334155] rounded-xl shadow-2xl backdrop-blur-md p-2.5 sm:p-3 text-[#172033] dark:text-[#f8fafc] transition-colors`}>
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dddddd] dark:border-[#334155] pb-2 mb-2.5">
          <div className="flex items-center gap-1 bg-[#f3f4f6] dark:bg-[#1e293b] p-0.5 rounded-lg border border-[#dddddd] dark:border-[#334155] max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('climate')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'climate'
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 icon" />
              <span>{t.tabClimate}</span>
            </button>

            <button
              onClick={() => setActiveTab('satellites')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'satellites'
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Orbit className="w-3.5 h-3.5 icon" />
              <span>{t.tabSatellites}</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#172033] dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 icon" />
              <span>{t.tabTimeline}</span>
            </button>
          </div>

          {/* Real-time Year Metric Strip */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">{t.tempAnomalyTitle}:</span>
              <span className="font-bold tabular-nums text-orange-600 dark:text-orange-400">
                +{currentYearData.globalTempAnomaly.toFixed(2)} °C
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">{t.co2Title}:</span>
              <span className="font-bold tabular-nums text-amber-700 dark:text-amber-300">
                {currentYearData.co2Ppm.toFixed(1)} ppm
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">{t.iceExtentTitle}:</span>
              <span className="font-bold tabular-nums text-cyan-700 dark:text-cyan-300">
                {currentYearData.arcticIceAreaMillionKm2.toFixed(1)} M km²
              </span>
            </div>
            <div className="hidden xl:flex items-center gap-1.5">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">{t.seaLevelTitle}:</span>
              <span className="font-bold tabular-nums text-[#2563eb] dark:text-blue-300">
                +{currentYearData.seaLevelRiseMm.toFixed(1)} mm
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Climate Observation Layers */}
        {activeTab === 'climate' && (
          <div className="space-y-2">
            <div className="bottom-layer-list">
              {CLIMATE_LAYERS.map(layer => {
                const isSelected = activeLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left rtl:text-right transition-all border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-[#2563eb] dark:border-[#60a5fa] text-[#172033] dark:text-white shadow-sm'
                        : 'bg-[#f3f4f6] dark:bg-[#1e293b]/70 border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-slate-200 hover:border-[#2563eb]'
                    }`}
                  >
                    <div className="shrink-0">{getLayerIcon(layer.id)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {language === 'ar' ? layer.nameAr : layer.nameEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Layer Details Ribbon & Gradient Scale */}
            {activeLayerInfo && activeLayer !== 'none' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-[#f3f4f6] dark:bg-[#1e293b] rounded-lg border border-[#dddddd] dark:border-[#334155] text-xs">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <span className="text-slate-600 dark:text-slate-400">{t.layerSource}:</span>
                  <span className="font-medium text-[#2563eb] dark:text-[#60a5fa]">{activeLayerInfo.satelliteSource}</span>
                  <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-xs hidden sm:inline">{activeLayerInfo.nasaProgram}</span>
                </div>

                {/* Color Legend Scale */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{activeLayerInfo.minScaleLabel}</span>
                  <div
                    className="h-2 w-24 sm:w-28 rounded-full border border-[#dddddd] dark:border-[#334155]"
                    style={{ background: activeLayerInfo.legendGradient }}
                  />
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{activeLayerInfo.maxScaleLabel}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Satellites Selector */}
        {activeTab === 'satellites' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 max-[380px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {SATELLITES.map(sat => {
                const isSelected = selectedSatelliteId === sat.id;
                return (
                  <button
                    key={sat.id}
                    onClick={() => onSelectSatellite(isSelected ? null : sat.id)}
                    className={`flex flex-col p-2 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-[#2563eb] dark:border-[#60a5fa] text-[#172033] dark:text-white shadow-sm'
                        : 'bg-[#f3f4f6] dark:bg-[#1e293b]/70 border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-slate-200 hover:border-[#2563eb]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold truncate">
                        {language === 'ar' ? sat.nameAr : sat.name}
                      </span>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sat.color }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      {sat.altitudeKm} km · {sat.velocityKmS} km/s
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Satellite Quick Telemetry Preview */}
            {activeSatellite && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-[#f3f4f6] dark:bg-[#1e293b] rounded-lg border border-[#dddddd] dark:border-[#334155] text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#172033] dark:text-white">
                      {language === 'ar' ? activeSatellite.nameAr : activeSatellite.name}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">({activeSatellite.agency})</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {language === 'ar' ? activeSatellite.descriptionAr : activeSatellite.descriptionEn}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectSatellite(null)}
                    className="px-2.5 py-1 text-[11px] rounded bg-white dark:bg-[#101827] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb] text-[#172033] dark:text-slate-200"
                  >
                    {t.deselectSatellite}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Timeline & Historical Climate Trends */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {/* Scrubber & Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onTogglePlay}
                className="w-8 h-8 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm"
                title={isPlaying ? t.pause : t.play}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={onResetTimeline}
                className="w-8 h-8 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb] text-[#172033] dark:text-slate-200 flex items-center justify-center shrink-0"
                title={t.reset}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Year Slider */}
              <div className="basis-full sm:basis-auto sm:flex-1 order-last sm:order-none flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-600 dark:text-slate-400">1990</span>
                  <span className="text-sm font-bold text-[#2563eb] dark:text-[#60a5fa] tabular-nums px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900">
                    {currentYear}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">2026</span>
                </div>
                <input
                  type="range"
                  min="1990"
                  max="2026"
                  step="1"
                  value={currentYear}
                  onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-[#dddddd] dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2563eb]"
                />
              </div>

              {/* Simulation Speed Pill Selector */}
              <div className="flex items-center gap-1 bg-[#f3f4f6] dark:bg-[#1e293b] p-0.5 rounded-lg border border-[#dddddd] dark:border-[#334155] shrink-0 ms-auto sm:ms-0">
                {[1, 2, 5].map((speed) => (
                  <button
                    type="button"
                    key={speed}
                    onClick={() => onChangeSpeed(speed)}
                    className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                      simulationSpeed === speed
                        ? 'bg-[#2563eb] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-[#172033] dark:hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Year Context Summary */}
            <div className="p-2 bg-[#f3f4f6] dark:bg-[#1e293b] rounded-lg border border-[#dddddd] dark:border-[#334155] text-xs text-[#172033] dark:text-slate-200 flex items-start gap-2">
              <span className="font-bold text-[#2563eb] dark:text-[#60a5fa] shrink-0">
                {currentYear}:
              </span>
              <p className="leading-relaxed">
                {language === 'ar' ? currentYearData.summaryAr : currentYearData.summaryEn}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
