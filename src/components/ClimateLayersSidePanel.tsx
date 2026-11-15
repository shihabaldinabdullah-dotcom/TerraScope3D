/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Climate Observation Layers Side Panel
 * Professional NASA Space mission control sidebar with climate layer toggles and real-time planetary KPI cards.
 */

import React, { useState } from 'react';
import {
  Layers,
  Thermometer,
  Leaf,
  Wind,
  Snowflake,
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Waves,
  X
} from 'lucide-react';
import { ClimateLayerId, Language, ClimateYearData } from '../types';
import { CLIMATE_LAYERS } from '../data/nasaData';
import { translations } from '../i18n';

interface ClimateLayersSidePanelProps {
  language: Language;
  activeLayer: ClimateLayerId;
  currentYearData: ClimateYearData;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  onSelectLayer: (id: ClimateLayerId) => void;
  onOpenCharts: () => void;
}

export const ClimateLayersSidePanel: React.FC<ClimateLayersSidePanelProps> = ({
  language,
  activeLayer,
  currentYearData,
  isCollapsed: controlledCollapsed,
  onToggleCollapsed,
  onSelectLayer,
  onOpenCharts,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const handleToggleCollapse = () => {
    if (onToggleCollapsed) {
      onToggleCollapsed();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const getLayerIcon = (id: ClimateLayerId) => {
    switch (id) {
      case 'temp_anomaly': return <Thermometer className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'vegetation_ndvi': return <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'co2_distribution': return <Wind className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'sea_ice': return <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />;
      case 'thermal_wildfires': return <Flame className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default: return <Layers className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />;
    }
  };

  const activeLayerInfo = CLIMATE_LAYERS.find(l => l.id === activeLayer);

  return (
    <aside
      className={`sidebar hidden md:flex relative z-20 flex-col w-full h-full md:p-3 transition-all duration-300 select-none ${
        isCollapsed ? 'is-collapsed' : ''
      }`}
    >
      {/* Mobile Side Panel Toggle Header (Open / Close) */}
      <div className="min-[601px]:hidden mb-2">
        <button
          type="button"
          onClick={() => setIsMobileOpen(prev => !prev)}
          aria-expanded={isMobileOpen}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/95 dark:bg-[#101827]/95 border border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-[#f8fafc] shadow-md text-xs font-bold transition-colors hover:border-[#2563eb]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 icon text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
            <span className="truncate">
              {isAr ? 'القائمة الجانبية: طبقات المناخ والمؤشرات' : 'Side Panel: Climate Layers & Metrics'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#2563eb] dark:text-[#60a5fa] shrink-0">
            <span className="text-[11px] font-semibold">
              {isMobileOpen ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'فتح' : 'Open')}
            </span>
            {isMobileOpen ? (
              <ChevronUp className="w-4 h-4 icon" />
            ) : (
              <ChevronDown className="w-4 h-4 icon" />
            )}
          </div>
        </button>
      </div>

      <div className={`${isMobileOpen ? 'flex' : 'hidden min-[601px]:flex'} relative flex-1 bg-white/95 dark:bg-[#101827]/95 border border-[#dddddd] dark:border-[#334155] rounded-2xl shadow-2xl backdrop-blur-md flex-col overflow-hidden min-h-0 transition-colors duration-300`}>
        {/* Toggle Collapse Edge Button (Desktop/Tablet only) */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className={`hidden md:flex absolute top-3 ${language === 'ar' ? 'left-2' : 'right-2'} z-30 w-6 h-6 rounded-full bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] items-center justify-center text-[#172033] dark:text-slate-200 hover:border-[#2563eb] shadow-md`}
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? (
            language === 'ar' ? <ChevronLeft className="w-3.5 h-3.5 icon" /> : <ChevronRight className="w-3.5 h-3.5 icon" />
          ) : (
            language === 'ar' ? <ChevronRight className="w-3.5 h-3.5 icon" /> : <ChevronLeft className="w-3.5 h-3.5 icon" />
          )}
        </button>

        {isCollapsed && (
          /* Collapsed Mini Icon Strip (Desktop/Tablet only) */
          <div className="hidden md:flex flex-1 flex-col items-center pt-12 pb-4 gap-3 text-slate-600 dark:text-slate-400">
            {CLIMATE_LAYERS.map(layer => (
              <button
                type="button"
                key={layer.id}
                onClick={() => {
                  onSelectLayer(layer.id);
                  if (isCollapsed) handleToggleCollapse();
                }}
                className={`p-2 rounded-xl transition-all ${
                  activeLayer === layer.id
                    ? 'bg-[#2563eb] text-white shadow-md'
                    : 'hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] hover:text-[#172033] dark:hover:text-white'
                }`}
                title={language === 'ar' ? layer.nameAr : layer.nameEn}
              >
                {getLayerIcon(layer.id)}
              </button>
            ))}
          </div>
        )}

        {/* Full Expanded Panel */}
        <div className={`${isCollapsed ? 'flex min-[601px]:hidden' : 'flex'} flex-1 flex-col p-3 sm:p-4 min-[601px]:overflow-y-auto space-y-3 sm:space-y-4 text-xs text-[#172033] dark:text-[#f8fafc]`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#dddddd] dark:border-[#334155] pb-2.5 min-[601px]:pe-7 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-4 h-4 icon text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
              <h3 className="font-bold text-[#172033] dark:text-[#f8fafc] text-xs tracking-wide truncate">
                {language === 'ar' ? 'طبقات الرصد الفضائي للمناخ' : 'Climate Observation Layers'}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300">
                NASA EOS
              </span>
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="min-[601px]:hidden p-1 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-slate-200"
                title={isAr ? 'إغلاق القائمة' : 'Close panel'}
                aria-label={isAr ? 'إغلاق القائمة' : 'Close panel'}
              >
                <X className="w-3.5 h-3.5 icon" />
              </button>
            </div>
          </div>

          {/* Layer Buttons List */}
          <div className="layer-list">
            {CLIMATE_LAYERS.map(layer => {
              const isSelected = activeLayer === layer.id;
              return (
                <button
                  type="button"
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left rtl:text-right transition-all border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/80 border-[#2563eb] dark:border-[#60a5fa] text-[#172033] dark:text-white shadow-sm'
                      : 'bg-[#f3f4f6] dark:bg-[#1e293b]/70 border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-slate-200 hover:border-[#2563eb] dark:hover:border-[#60a5fa]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0">{getLayerIcon(layer.id)}</div>
                    <span className="truncate font-medium text-xs">
                      {language === 'ar' ? layer.nameAr : layer.nameEn}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb] dark:bg-[#60a5fa] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Layer Details */}
          {activeLayerInfo && activeLayer !== 'none' && (
            <div className="p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] space-y-2">
              <div className="flex items-center justify-between text-[11px] gap-2">
                <span className="text-slate-600 dark:text-slate-400 shrink-0">{t.layerSource}:</span>
                <span className="font-semibold text-[#2563eb] dark:text-[#60a5fa] truncate">{activeLayerInfo.satelliteSource}</span>
              </div>
              <p className="text-[11px] text-[#172033]/85 dark:text-slate-300 leading-relaxed">
                {language === 'ar' ? activeLayerInfo.descriptionAr : activeLayerInfo.descriptionEn}
              </p>
              {/* Gradient Scale */}
              <div className="space-y-1 pt-1">
                <div
                  className="h-2 w-full rounded-full border border-[#dddddd] dark:border-[#334155]"
                  style={{ background: activeLayerInfo.legendGradient }}
                />
                <div className="flex justify-between text-[9px] text-slate-600 dark:text-slate-400 font-mono">
                  <span>{activeLayerInfo.minScaleLabel}</span>
                  <span>{activeLayerInfo.maxScaleLabel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Planetary KPI Cards */}
          <div className="space-y-2 pt-2 border-t border-[#dddddd] dark:border-[#334155]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {language === 'ar' ? `المؤشرات العالمية (${currentYearData.year})` : `Global Metrics (${currentYearData.year})`}
              </span>
              <button
                onClick={onOpenCharts}
                className="text-[10px] text-[#2563eb] dark:text-[#60a5fa] hover:underline flex items-center gap-1 font-medium shrink-0"
              >
                <span>{language === 'ar' ? 'الرسوم البيانية' : 'Full Charts'}</span>
                <TrendingUp className="w-3 h-3 icon" />
              </button>
            </div>

            <div className="grid grid-cols-2 max-[380px]:grid-cols-1 gap-2 font-mono">
              {/* Temp Anomaly Card */}
              <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                  <Thermometer className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  <span className="truncate">{t.tempAnomalyTitle}</span>
                </div>
                <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums block">
                  +{currentYearData.globalTempAnomaly.toFixed(2)} °C
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">vs 1951-1980</span>
              </div>

              {/* Atmospheric CO2 Card */}
              <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                  <Wind className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">{t.co2Title}</span>
                </div>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 tabular-nums block">
                  {currentYearData.co2Ppm.toFixed(1)} ppm
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">Mauna Loa</span>
              </div>

              {/* Arctic Sea Ice Card */}
              <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                  <Snowflake className="w-3 h-3 text-cyan-600 dark:text-cyan-300" />
                  <span className="truncate">{t.iceExtentTitle}</span>
                </div>
                <span className="text-sm font-bold text-cyan-700 dark:text-cyan-300 tabular-nums block">
                  {currentYearData.arcticIceAreaMillionKm2.toFixed(1)} M km²
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">NSIDC Summer</span>
              </div>

              {/* Sea Level Rise Card */}
              <div className="p-2.5 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
                <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 mb-0.5">
                  <Waves className="w-3 h-3 text-[#2563eb] dark:text-[#60a5fa]" />
                  <span className="truncate">{t.seaLevelTitle}</span>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tabular-nums block">
                  +{currentYearData.seaLevelRiseMm.toFixed(1)} mm
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans">
                  {language === 'ar' ? 'منذ 1993 (±4 ملم)' : 'since 1993 (±4 mm)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
