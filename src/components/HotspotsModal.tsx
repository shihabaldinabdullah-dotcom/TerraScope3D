/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Global Climate Vulnerability Hotspots Modal
 */

import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Snowflake, 
  Waves, 
  Trees, 
  Sun, 
  Globe2, 
  Radio, 
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { Language, ClimateHotspot, LatLonCoordinate } from '../types';
import { CLIMATE_HOTSPOTS } from '../data/nasaOfficialData';
import { translations } from '../i18n';

interface HotspotsModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (coord: LatLonCoordinate) => void;
}

export const HotspotsModal: React.FC<HotspotsModalProps> = ({
  language,
  isOpen,
  onClose,
  onFlyToLocation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeHotspotId, setActiveHotspotId] = useState<string>('arctic_svalbard');

  if (!isOpen) return null;
  const t = translations[language];

  const filteredHotspots = CLIMATE_HOTSPOTS.filter(hotspot => {
    if (selectedCategory === 'all') return true;
    return hotspot.category === selectedCategory;
  });

  const activeHotspot = CLIMATE_HOTSPOTS.find(h => h.id === activeHotspotId) || CLIMATE_HOTSPOTS[0];

  const handleFlyTo = (hotspot: ClimateHotspot) => {
    onFlyToLocation({
      lat: hotspot.lat,
      lon: hotspot.lon,
      name: language === 'ar' ? hotspot.nameAr : hotspot.nameEn,
    });
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cryosphere': return <Snowflake className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />;
      case 'ocean': return <Waves className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'forest': return <Trees className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'arid': return <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default: return <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text)] transition-colors duration-300"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-600/20 border border-red-300 dark:border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.hotspotsModalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.hotspotsModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Bar */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--surface)]/70 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: t.filterAll },
            { id: 'cryosphere', label: t.filterCryosphere },
            { id: 'ocean', label: t.filterOceans },
            { id: 'forest', label: t.filterForests },
            { id: 'arid', label: t.filterArid },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-Column Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:rtl:divide-x-reverse divide-[var(--border)]">
          {/* Hotspots List */}
          <div className="md:col-span-5 p-3 space-y-1.5 overflow-y-auto max-h-60 md:max-h-none bg-[var(--bg)]">
            {filteredHotspots.map(hotspot => {
              const isSelected = hotspot.id === activeHotspot.id;
              return (
                <button
                  key={hotspot.id}
                  onClick={() => setActiveHotspotId(hotspot.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left rtl:text-right transition-all border ${
                    isSelected
                      ? 'bg-red-50 dark:bg-red-950/70 border-red-400 dark:border-red-500/80 text-red-900 dark:text-white shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--border)] text-slate-700 dark:text-slate-300 hover:border-red-400/60 hover:text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      {getCategoryIcon(hotspot.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text)] truncate">
                        {language === 'ar' ? hotspot.nameAr : hotspot.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {language === 'ar' ? hotspot.categoryAr : hotspot.categoryEn}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                    hotspot.riskRating === 'Critical'
                      ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                      : 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800'
                  }`}>
                    {language === 'ar' ? hotspot.riskRatingAr : hotspot.riskRating}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Hotspot Inspector */}
          <div className="md:col-span-7 p-6 space-y-5 overflow-y-auto bg-[var(--bg)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  {language === 'ar' ? activeHotspot.nameAr : activeHotspot.nameEn}
                </h3>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? activeHotspot.categoryAr : activeHotspot.categoryEn} · {activeHotspot.lat.toFixed(2)}°N, {activeHotspot.lon.toFixed(2)}°E
                </span>
              </div>

              <button
                onClick={() => handleFlyTo(activeHotspot)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all shrink-0"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>{t.flyToGlobe}</span>
              </button>
            </div>

            {/* Headline Callout */}
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-800 dark:text-red-200">
              {language === 'ar' ? activeHotspot.headlineAr : activeHotspot.headlineEn}
            </div>

            {/* Scientific Details */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <p className="bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)]">
                {language === 'ar' ? activeHotspot.detailsAr : activeHotspot.detailsEn}
              </p>

              {/* NASA Observation Findings */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-1">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {t.nasaFindings}
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? activeHotspot.nasaObservationAr : activeHotspot.nasaObservationEn}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
