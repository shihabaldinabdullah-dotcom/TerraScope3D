/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - City & Country Climate Explorer Modal
 */

import React, { useState } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Compass, 
  Thermometer, 
  CloudRain, 
  AlertTriangle, 
  Radio, 
  Globe2, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Language, CityClimateProfile, LatLonCoordinate } from '../types';
import { CITY_CLIMATE_PROFILES } from '../data/nasaOfficialData';
import { translations } from '../i18n';

interface CityExplorerModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (coord: LatLonCoordinate) => void;
}

export const CityExplorerModal: React.FC<CityExplorerModalProps> = ({
  language,
  isOpen,
  onClose,
  onFlyToLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'arab' | 'global'>('all');
  const [selectedCityId, setSelectedCityId] = useState<string>('riyadh');

  if (!isOpen) return null;
  const t = translations[language];

  // Filter list
  const filteredCities = CITY_CLIMATE_PROFILES.filter(city => {
    const matchesSearch = 
      city.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.nameAr.includes(searchQuery) ||
      city.countryEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.countryAr.includes(searchQuery);

    if (!matchesSearch) return false;

    if (selectedFilter === 'arab') {
      return ['riyadh', 'cairo', 'dubai', 'baghdad', 'amman', 'casablanca'].includes(city.id);
    }
    if (selectedFilter === 'global') {
      return !['riyadh', 'cairo', 'dubai', 'baghdad', 'amman', 'casablanca'].includes(city.id);
    }
    return true;
  });

  const activeCity = CITY_CLIMATE_PROFILES.find(c => c.id === selectedCityId) || CITY_CLIMATE_PROFILES[0];

  const handleFlyTo = (city: CityClimateProfile) => {
    onFlyToLocation({
      lat: city.lat,
      lon: city.lon,
      name: language === 'ar' ? city.nameAr : city.nameEn,
    });
    onClose();
  };

  const getVulnerabilityBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-700/80';
      case 'Severe':
        return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-700/80';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/80';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700/80';
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
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.cityModalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.cityModalSubtitle}
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

        {/* Search & Region Filter Bar */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)]/70 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:right-3 rtl:left-auto text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchCityPlaceholder}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-[var(--text)] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-[var(--primary)]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)] shrink-0">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
              }`}
            >
              {t.allRegions}
            </button>
            <button
              onClick={() => setSelectedFilter('arab')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedFilter === 'arab'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
              }`}
            >
              {t.arabRegion}
            </button>
            <button
              onClick={() => setSelectedFilter('global')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedFilter === 'global'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
              }`}
            >
              {t.globalMetros}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x md:rtl:divide-x-reverse divide-[var(--border)]">
          {/* City Selection List Column */}
          <div className="md:col-span-5 p-3 space-y-1.5 overflow-y-auto max-h-60 md:max-h-none bg-[var(--bg)]">
            {filteredCities.map((city) => {
              const isSelected = city.id === activeCity.id;
              return (
                <button
                  key={city.id}
                  onClick={() => setSelectedCityId(city.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left rtl:text-right transition-all border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-500/80 text-blue-900 dark:text-white shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--border)] text-slate-700 dark:text-slate-300 hover:border-blue-400/60 hover:text-[var(--text)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text)] truncate">
                        {language === 'ar' ? city.nameAr : city.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {language === 'ar' ? city.countryAr : city.countryEn}
                      </div>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left shrink-0">
                    <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 tabular-nums block">
                      +{city.tempChangeDelta.toFixed(1)} °C
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {city.currentTempC.toFixed(1)}°C
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredCities.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {t.noCityFound}
              </div>
            )}
          </div>

          {/* Active City Details Column */}
          <div className="md:col-span-7 p-6 space-y-5 overflow-y-auto bg-[var(--bg)]">
            {/* Header Lockup */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {language === 'ar' ? activeCity.nameAr : activeCity.nameEn}
                  </h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getVulnerabilityBadge(activeCity.vulnerabilityLevel)}`}>
                    {language === 'ar' ? activeCity.vulnerabilityLevelAr : activeCity.vulnerabilityLevel}
                  </span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'ar' ? activeCity.countryAr : activeCity.countryEn} · {activeCity.lat.toFixed(2)}°N, {activeCity.lon.toFixed(2)}°E
                </span>
              </div>

              {/* Fly to on 3D Globe Button */}
              <button
                onClick={() => handleFlyTo(activeCity)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all shrink-0"
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>{t.flyToGlobe}</span>
              </button>
            </div>

            {/* Climate Metrics 3-Card Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                  {t.baselineTemp}
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-[var(--text)] tabular-nums">
                  {activeCity.baselineTempC.toFixed(1)} °C
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                  {t.currentTemp}
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-[var(--text)] tabular-nums">
                  {activeCity.currentTempC.toFixed(1)} °C
                </span>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60">
                <span className="text-[10px] text-orange-700 dark:text-orange-300 block mb-0.5">
                  {t.tempDelta}
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  +{activeCity.tempChangeDelta.toFixed(1)} °C
                </span>
              </div>
            </div>

            {/* Rainfall & Environmental Risk Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  {t.primaryRisk}
                </span>
                <p className="text-[var(--text)] font-semibold">
                  {language === 'ar' ? activeCity.primaryRiskAr : activeCity.primaryRiskEn}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  {t.rainfallPattern}
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-mono font-bold text-[var(--text)] tabular-nums">{activeCity.annualRainfallMm} mm/year</span> — {language === 'ar' ? activeCity.rainfallTrendAr : activeCity.rainfallTrendEn}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--surface)]/60 border border-[var(--border)] text-slate-700 dark:text-slate-300 leading-relaxed">
                {language === 'ar' ? activeCity.descriptionAr : activeCity.descriptionEn}
              </div>

              {/* Station Provenance Tag */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{activeCity.nasaStationId} · {language === 'ar' ? activeCity.climateZoneAr : activeCity.climateZone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
