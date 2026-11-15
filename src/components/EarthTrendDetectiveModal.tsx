/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Earth System Trend Detective Component
 * Native React/TypeScript implementation of the NASA POWER & SciPy linregress pipeline:
 * - Detects environmental changes and trends across Luxor, Cairo, Aswan, Alexandria, etc.
 * - Computes linear regression slope, r², Student's t-test P-value, and P < 0.05 significance
 * - Interactive multi-line chart with trendlines (Recharts)
 * - 3D Earth Fly-To interaction for selected study locations
 * - CSV export of empirical NASA time-series and regression statistics
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  X,
  Compass,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Search,
  Plus
} from 'lucide-react';
import {
  STUDY_LOCATIONS,
  ENVIRONMENTAL_VARIABLES,
  EnvironmentalVariableKey,
  StudyLocation,
  LocationTrendResult,
  calculateLinearRegression,
  fetchNasaPowerData,
  extractAnnualSeries
} from '../services/nasaPowerTrendService';
import { searchLocation, GeocodedLocation } from '../services/geocodingService';
import { Language, LatLonCoordinate, ThemeMode } from '../types';

interface EarthTrendDetectiveModalProps {
  language: Language;
  theme?: ThemeMode;
  isOpen: boolean;
  onClose: () => void;
  onFlyToLocation: (coord: LatLonCoordinate) => void;
}

const LOCATION_COLORS: Record<string, string> = {
  Luxor: '#d97706',     // Deep Amber (WCAG AA on white)
  Cairo: '#1769aa',     // Ocean Blue (WCAG AA on white)
  Aswan: '#dc2626',     // Crimson Red (WCAG AA on white)
  Alexandria: '#059669',// Emerald Green (WCAG AA on white)
  Riyadh: '#7c3aed',    // Deep Purple
  Dubai: '#db2777',     // Deep Pink
  Baghdad: '#0d9488',   // Deep Teal
  Nairobi: '#ea580c'    // Deep Orange
};

const EXTENDED_PALETTE = [
  '#d97706', '#1769aa', '#dc2626', '#059669', '#7c3aed',
  '#db2777', '#0d9488', '#ea580c', '#4f46e5', '#0284c7',
  '#ca8a04', '#65a30d', '#6366f1', '#e11d48'
];

function getLocationColor(locId: string): string {
  if (LOCATION_COLORS[locId]) return LOCATION_COLORS[locId];
  const charSum = locId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return EXTENDED_PALETTE[Math.abs(charSum) % EXTENDED_PALETTE.length];
}

export const EarthTrendDetectiveModal: React.FC<EarthTrendDetectiveModalProps> = ({
  language,
  theme = 'light',
  isOpen,
  onClose,
  onFlyToLocation
}) => {
  const isAr = language === 'ar';
  const isDark = theme === 'dark';

  // Active locations dictionary (initialized with built-in locations, dynamically extensible via Smart Search)
  const [activeLocations, setActiveLocations] = useState<Record<string, StudyLocation>>(STUDY_LOCATIONS);

  // State matching Streamlit user controls
  const [selectedLocationKeys, setSelectedLocationKeys] = useState<string[]>([
    'Luxor',
    'Cairo',
    'Aswan'
  ]);
  const [selectedVariable, setSelectedVariable] = useState<EnvironmentalVariableKey>('Temperature');
  const [startYear, setStartYear] = useState<number>(2001);
  const [endYear, setEndYear] = useState<number>(2024);

  // Smart Location Search state (matching Python/Streamlit)
  const [searchText, setSearchText] = useState<string>('');
  const [geoResults, setGeoResults] = useState<GeocodedLocation[]>([]);
  const [selectedGeoLabel, setSelectedGeoLabel] = useState<string>('');
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Execution & results state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [trendResults, setTrendResults] = useState<LocationTrendResult[]>([]);
  const [showTrendlines, setShowTrendlines] = useState<boolean>(true);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);

  // Available year options (1981 - 2024)
  const availableStartYears = useMemo(() => {
    const years: number[] = [];
    for (let y = 1981; y <= 2023; y++) years.push(y);
    return years;
  }, []);

  const availableEndYears = useMemo(() => {
    const years: number[] = [];
    for (let y = startYear + 1; y <= 2024; y++) years.push(y);
    return years;
  }, [startYear]);

  // Adjust endYear if startYear exceeds it
  useEffect(() => {
    if (endYear <= startYear) {
      setEndYear(Math.min(2024, startYear + 5));
    }
  }, [startYear, endYear]);

  // Handle Smart Location Search (Open-Meteo Geocoding)
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchText.trim();
    if (!query) {
      setSearchWarning(isAr ? 'يرجى إدخال اسم موقع أو مدينة أولاً.' : 'Please enter a location name.');
      return;
    }

    setSearchWarning(null);
    setSearchSuccess(null);
    setIsSearchingLocation(true);

    try {
      const results = await searchLocation(query, isAr ? 'ar' : 'en');
      setGeoResults(results);
      if (results.length === 0) {
        setSearchWarning(isAr ? 'لم يتم العثور على مواقع. جرّب اسماً آخر.' : 'No locations found. Try another name.');
      } else {
        setSelectedGeoLabel(results[0].formattedLabel);
      }
    } catch (err) {
      setSearchWarning(isAr ? 'حدث خطأ أثناء البحث عن الموقع.' : 'Location search error occurred.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Add Location to Active Study List (Matching Python: Add Location button & 3D Earth fly-to)
  const handleAddLocation = () => {
    if (!selectedGeoLabel && geoResults.length === 0) return;
    const found = geoResults.find(r => r.display === selectedGeoLabel || r.formattedLabel === selectedGeoLabel) || geoResults[0];
    if (!found) return;

    const locId = found.name;
    const displayName = found.display || found.name;

    const newLocation: StudyLocation = {
      id: locId,
      nameEn: displayName,
      nameAr: displayName,
      lat: found.latitude,
      lon: found.longitude,
      countryEn: found.country || found.admin1 || 'Custom',
      countryAr: found.country || found.admin1 || 'مخصص'
    };

    setActiveLocations(prev => ({
      ...prev,
      [locId]: newLocation
    }));

    if (!selectedLocationKeys.includes(locId)) {
      setSelectedLocationKeys(prev => [...prev, locId]);
    }

    // Immediate 3D Earth Navigation as confirmed in user specifications
    onFlyToLocation({
      lat: found.latitude,
      lon: found.longitude,
      name: displayName
    });

    setSearchSuccess(
      isAr 
        ? `Location added! تمت إضافة ${displayName} ونقلك إلى إحداثياته في الأرض 3D.` 
        : `Location added! Added ${displayName} and navigating 3D Earth camera.`
    );
    setTimeout(() => setSearchSuccess(null), 3500);
  };

  // Main Analysis Execution
  const runTrendAnalysis = useCallback(async () => {
    if (selectedLocationKeys.length === 0) return;

    setIsLoading(true);
    setProgress(5);
    setStatusMessage(isAr ? 'جاري الاتصال بواجهة NASA POWER API...' : 'Connecting to NASA POWER API...');

    const results: LocationTrendResult[] = [];
    const varConfig = ENVIRONMENTAL_VARIABLES[selectedVariable];

    for (let i = 0; i < selectedLocationKeys.length; i++) {
      const locKey = selectedLocationKeys[i];
      const loc = activeLocations[locKey] || STUDY_LOCATIONS[locKey];
      if (!loc) continue;

      const progressVal = Math.round(10 + ((i + 1) / selectedLocationKeys.length) * 85);
      setProgress(progressVal);
      setStatusMessage(
        isAr 
          ? `تحميل بيانات NASA لـ ${loc.nameAr} (${i + 1}/${selectedLocationKeys.length})...`
          : `Fetching NASA POWER data for ${loc.nameEn} (${i + 1}/${selectedLocationKeys.length})...`
      );

      try {
        const rawParams = await fetchNasaPowerData(loc.lat, loc.lon, startYear, endYear);
        const series = extractAnnualSeries(rawParams, selectedVariable, startYear, endYear);

        if (series.length >= 2) {
          const yearsArr = series.map(d => d.year);
          const valuesArr = series.map(d => d.value);
          const reg = calculateLinearRegression(yearsArr, valuesArr);

          let trendDir: 'Increasing' | 'Decreasing' | 'No trend' = 'No trend';
          let trendDirAr: 'متزايد' | 'متناقص' | 'لا يوجد اتجاه واضح' = 'لا يوجد اتجاه واضح';

          // Significant threshold p < 0.05
          const isSig = reg.pValue < 0.05;
          if (isSig) {
            if (reg.slope > 0.001) {
              trendDir = 'Increasing';
              trendDirAr = 'متزايد';
            } else if (reg.slope < -0.001) {
              trendDir = 'Decreasing';
              trendDirAr = 'متناقص';
            }
          }

          results.push({
            location: loc.nameEn,
            locationAr: loc.nameAr,
            parameter: varConfig.nameEn,
            unit: varConfig.unit,
            trend: trendDir,
            trendAr: trendDirAr,
            slope: reg.slope,
            intercept: reg.intercept,
            pValue: reg.pValue,
            rSquared: reg.rSquared,
            isSignificant: isSig,
            yearsCount: series.length,
            startYear,
            endYear,
            annualData: series
          });
        }
      } catch (err) {
        console.error(`Failed to process ${locKey}:`, err);
      }
    }

    setProgress(100);
    setTrendResults(results);
    setHasExecuted(true);
    setIsLoading(false);
  }, [selectedLocationKeys, selectedVariable, startYear, endYear, isAr, activeLocations]);

  // Initial load
  useEffect(() => {
    if (isOpen && !hasExecuted) {
      runTrendAnalysis();
    }
  }, [isOpen, hasExecuted, runTrendAnalysis]);

  // Toggle location selection
  const handleToggleLocation = (locKey: string) => {
    if (selectedLocationKeys.includes(locKey)) {
      if (selectedLocationKeys.length > 1) {
        setSelectedLocationKeys(selectedLocationKeys.filter(k => k !== locKey));
      }
    } else {
      setSelectedLocationKeys([...selectedLocationKeys, locKey]);
    }
  };

  // Prepare merged Recharts dataset
  const chartData = useMemo(() => {
    if (trendResults.length === 0) return [];

    const yearsMap = new Map<number, Record<string, number>>();

    trendResults.forEach(res => {
      res.annualData.forEach(d => {
        if (!yearsMap.has(d.year)) {
          yearsMap.set(d.year, { year: d.year });
        }
        const row = yearsMap.get(d.year)!;
        row[res.location] = d.value;

        // Add trendline fit point y = slope * x + intercept
        if (showTrendlines) {
          const fittedVal = parseFloat((res.slope * d.year + res.intercept).toFixed(2));
          row[`${res.location}_trend`] = fittedVal;
        }
      });
    });

    return Array.from(yearsMap.values()).sort((a, b) => a.year - b.year);
  }, [trendResults, showTrendlines]);

  // Export CSV
  const handleDownloadCSV = () => {
    if (trendResults.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header for Summary Statistics
    csvContent += '--- SUMMARY REGRESSION STATISTICS (NASA POWER & SciPy linregress) ---\r\n';
    csvContent += 'Location,Parameter,Unit,Start Year,End Year,Slope (per year),P-value,Statistically Significant (p<0.05),R-squared,Trend Direction\r\n';
    
    trendResults.forEach(r => {
      csvContent += `"${r.location}","${r.parameter}","${r.unit}",${r.startYear},${r.endYear},${r.slope.toFixed(4)},${r.pValue.toFixed(6)},"${r.isSignificant ? 'Yes' : 'No'}",${r.rSquared.toFixed(4)},"${r.trend}"\r\n`;
    });

    csvContent += '\r\n--- ANNUAL TIME-SERIES DATA ---\r\n';
    const locNames = trendResults.map(r => r.location);
    csvContent += `Year,${locNames.map(n => `"${n} (${trendResults[0].unit})"`).join(',')}\r\n`;

    chartData.forEach(row => {
      const vals = locNames.map(n => (row[n] !== undefined ? row[n] : ''));
      csvContent += `${row.year},${vals.join(',')}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `earth_trends_${selectedVariable.toLowerCase()}_${startYear}_${endYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const currentVarConfig = ENVIRONMENTAL_VARIABLES[selectedVariable];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/65 dark:bg-black/80 backdrop-blur-sm overflow-hidden select-none"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text)] terrascope-app">
        
        {/* Header */}
        <div className="terrascope-header flex items-center justify-between px-4 sm:px-6 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-[#172033] dark:text-[#f8fafc] tracking-tight terrascope-h2 truncate">
                  {isAr ? '🌍 تيراسكوب 3D — كاشف اتجاهات النظام الأرضي' : '🌍 TerraScope 3D — Earth System Trend Detective'}
                </h2>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                  · NASA POWER API
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                {isAr 
                  ? 'اكتشف التغيرات البيئية، وقارن بين المواقع، واكتشف الاتجاهات ذات الدلالة الإحصائية باستخدام بيانات ناسا'
                  : 'Discover environmental changes, compare locations, and detect significant trends using NASA data.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadCSV}
              disabled={trendResults.length === 0 || isLoading}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[9px] bg-[var(--surface)] hover:bg-blue-50 dark:hover:bg-slate-800 border border-[var(--border)] text-[var(--text)] disabled:opacity-40 transition-colors"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" />
              <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-[9px] text-slate-500 dark:text-slate-400 hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container (Sidebar Controls + Main Analytics Panel) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-[var(--border)]">
          
          {/* Controls Sidebar (Col 4 on lg) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[var(--surface)] flex flex-col gap-4 overflow-y-auto terrascope-sidebar">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2563eb] dark:text-[#60a5fa] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
                {isAr ? 'إعدادات التحليل (Analysis Settings)' : 'Analysis Settings'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                MERRA-2 / GEOS
              </span>
            </div>

            {/* 🌍 GLOBAL LOCATION SEARCH (Real Geocoding) */}
            <div className="p-3.5 rounded-[12px] bg-[var(--bg)] border border-[var(--border)] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" />
                  <span>{isAr ? '🌍 البحث الجغرافي العالمي' : '🌍 Global Location Search'}</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                  Real Geo · 1h Cache
                </span>
              </div>

              <form onSubmit={handleSearchLocation} className="space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {isAr ? 'ابحث في أي مكان في العالم:' : 'Search anywhere in the world:'}
                  </label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder={isAr ? 'Tokyo, Japan / London / Paris (أو الأقصر، أسوان)' : 'Tokyo, Japan / London / Paris'}
                    className="terrascope-input w-full px-3 py-1.5 text-xs placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearchingLocation}
                  className="terrascope-btn-primary flex items-center justify-center gap-1.5 px-3 text-xs"
                >
                  <Search className={`w-3.5 h-3.5 ${isSearchingLocation ? 'animate-spin' : ''}`} />
                  <span>{isSearchingLocation ? (isAr ? 'جاري البحث عالمياً...' : 'Searching...') : (isAr ? 'بحث (Search)' : 'Search')}</span>
                </button>
              </form>

              {searchWarning && (
                <div className="p-2 rounded-[9px] bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/70 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{searchWarning}</span>
                </div>
              )}

              {searchSuccess && (
                <div className="p-2 rounded-[9px] bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-[11px] text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{searchSuccess}</span>
                </div>
              )}

              {geoResults.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    {isAr ? 'اختر موقعاً (Choose a location):' : 'Choose a location:'}
                  </label>
                  <select
                    value={selectedGeoLabel}
                    onChange={(e) => setSelectedGeoLabel(e.target.value)}
                    className="terrascope-input w-full px-2.5 py-1.5 text-xs"
                  >
                    {geoResults.map(res => (
                      <option key={res.id} value={res.display}>
                        {res.display} ({res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="w-full flex items-center justify-center gap-1.5 min-h-[38px] px-3 rounded-[9px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة الموقع (Add location)' : 'Add location'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 1. Location Selection & Active List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[var(--text)]">
                  {isAr ? 'المواقع المحددة للدراسة والمقارنة:' : 'Selected locations to analyze:'}
                </label>
                <span className="text-[11px] font-mono text-[#2563eb] dark:text-[#60a5fa] font-semibold">
                  {selectedLocationKeys.length} {isAr ? 'محددة' : 'selected'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {Object.values(activeLocations).map(loc => {
                  const isSelected = selectedLocationKeys.includes(loc.id);
                  const color = getLocationColor(loc.id);
                  const isCustom = !STUDY_LOCATIONS[loc.id];

                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleToggleLocation(loc.id)}
                      className={`flex items-center justify-between p-2 rounded-[9px] text-xs transition-colors border ${
                        isSelected
                          ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-xs'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:border-[#2563eb]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60" 
                          style={{ backgroundColor: color }} 
                        />
                        <span className="font-semibold truncate">
                          {isAr ? loc.nameAr : loc.nameEn}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isCustom ? '★' : loc.countryAr.slice(0, 4)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                {isAr 
                  ? 'يمكنك البحث عن أي مدينة أو دولة في العالم وإضافتها فوراً لتحليلات ناسا.'
                  : 'Search and add any global city or coordinates to analyze with NASA POWER.'}
              </p>
            </div>

            {/* 2. Environmental Variable Select */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                {isAr ? 'المتغير البيئي (Environmental Variable):' : 'Environmental Variable:'}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(ENVIRONMENTAL_VARIABLES) as EnvironmentalVariableKey[]).map(vKey => {
                  const cfg = ENVIRONMENTAL_VARIABLES[vKey];
                  const isSelected = selectedVariable === vKey;
                  return (
                    <button
                      key={vKey}
                      type="button"
                      onClick={() => setSelectedVariable(vKey)}
                      className={`p-2 rounded-[9px] text-left rtl:text-right border transition-colors ${
                        isSelected
                          ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-xs'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:border-[#2563eb]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{isAr ? cfg.nameAr : cfg.nameEn}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-[#2563eb] dark:text-[#60a5fa]'}`}>
                        {cfg.parameter} ({cfg.unit})
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                {isAr ? currentVarConfig.descriptionAr : currentVarConfig.descriptionEn}
              </p>
            </div>

            {/* 3. Year Range Selector */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  {isAr ? 'سنة البداية:' : 'Start Year:'}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 left-2.5 rtl:right-2.5 rtl:left-auto text-slate-500 dark:text-slate-400 pointer-events-none" />
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(parseInt(e.target.value))}
                    className="terrascope-input w-full pl-8 pr-3 rtl:pr-8 rtl:pl-3 py-1.5 text-xs"
                  >
                    {availableStartYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  {isAr ? 'سنة النهاية:' : 'End Year:'}
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 left-2.5 rtl:right-2.5 rtl:left-auto text-slate-500 dark:text-slate-400 pointer-events-none" />
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(parseInt(e.target.value))}
                    className="terrascope-input w-full pl-8 pr-3 rtl:pr-8 rtl:pl-3 py-1.5 text-xs"
                  >
                    {availableEndYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Trendlines toggle */}
            <div className="flex items-center justify-between p-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-[12px]">
              <div className="text-xs">
                <span className="font-semibold text-[var(--text)] block">
                  {isAr ? 'عرض خط الانحدار الخطي' : 'Show Linear Trendline'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                  {isAr ? 'معادلة الخط والاتجاه الإحصائي' : 'Slope fit lines over time series'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={showTrendlines}
                onChange={(e) => setShowTrendlines(e.target.checked)}
                className="w-4 h-4 rounded text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
              />
            </div>

            {/* Action Button: Run Analysis */}
            <button
              onClick={runTrendAnalysis}
              disabled={isLoading || selectedLocationKeys.length === 0}
              className="terrascope-btn-primary flex items-center justify-center gap-2 px-4 text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحليل الاتجاهات البيئية الآن' : 'Analyze Environmental Trends'}</span>
            </button>

            {/* Loading & Progress Bar */}
            {isLoading && (
              <div className="space-y-1.5 p-3 rounded-[10px] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <div className="flex justify-between text-[11px] text-[#2563eb] dark:text-[#60a5fa] font-mono font-semibold">
                  <span>{statusMessage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--bg)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div 
                    className="h-full bg-[#2563eb] dark:bg-[#60a5fa] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Fly to 3D Globe Quick Buttons */}
            <div className="mt-auto pt-3 border-t border-[var(--border)]">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mb-2">
                <MapPin className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" />
                {isAr ? 'الانتقال إلى الموقع في مجسم الأرض 3D:' : 'Fly to location on 3D Earth:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedLocationKeys.map(locKey => {
                  const loc = activeLocations[locKey] || STUDY_LOCATIONS[locKey];
                  if (!loc) return null;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => {
                        onFlyToLocation({
                          lat: loc.lat,
                          lon: loc.lon,
                          name: isAr ? loc.nameAr : loc.nameEn
                        });
                        onClose();
                      }}
                      className="px-2.5 py-1 text-[11px] rounded-[9px] bg-[var(--bg)] border border-[var(--border)] hover:border-[#2563eb] text-[var(--text)] hover:text-[#2563eb] dark:hover:text-[#60a5fa] flex items-center gap-1 transition-colors"
                    >
                      <span>{isAr ? loc.nameAr : loc.nameEn}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400 rtl:rotate-180" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Visualizations & Statistics Area (Col 8 on lg) */}
          <div className="lg:col-span-8 terrascope-container bg-[var(--bg)] flex flex-col gap-5 overflow-y-auto">
            
            {/* Centered Theme-Aware Hero Banner */}
            <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-br from-blue-50 via-[var(--bg)] to-[var(--surface)] dark:from-[#172554]/50 dark:via-[#1e293b] dark:to-[#101827] text-center">
              <h1 className="terrascope-h1 m-0 text-[#2563eb] dark:text-[#60a5fa]">
                🌍 TerraScope 3D
              </h1>
              <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">
                {isAr ? 'كاشف اتجاهات النظام الأرضي · Earth System Trend Detective' : 'Earth System Trend Detective'}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {isAr ? 'استكشف التغيرات البيئية عبر كوكب الأرض · Explore environmental changes across the planet' : 'Explore environmental changes across the planet'}
              </p>
            </div>

            {/* Top Stats Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="terrascope-metric-card flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {isAr ? 'المتغير محل الدراسة' : 'Target Variable'}
                  </div>
                  <div className="text-base font-bold text-[var(--text)] mt-0.5">
                    {isAr ? currentVarConfig.nameAr : currentVarConfig.nameEn}
                  </div>
                  <div className="text-[11px] text-[#2563eb] dark:text-[#60a5fa] font-mono">
                    {currentVarConfig.unit} ({currentVarConfig.parameter})
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="terrascope-metric-card flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {isAr ? 'الفترة الزمنية المختارة' : 'Temporal Span'}
                  </div>
                  <div className="text-base font-bold text-[var(--text)] mt-0.5 font-mono tabular-nums">
                    {startYear} – {endYear}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {endYear - startYear + 1} {isAr ? 'سنوات رصد' : 'years observed'}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="terrascope-metric-card flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                    {isAr ? 'معيار الدلالة الإحصائية' : 'Significance Criteria'}
                  </div>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono tabular-nums">
                    P &lt; 0.05
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {isAr ? 'مستوى ثقة > 95%' : 'Confidence > 95%'}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Interactive Multi-Line Chart (Recharts) */}
            <div className="terrascope-chart-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="terrascope-h3 text-sm font-bold text-[var(--text)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
                    <span>
                      {isAr 
                        ? `السلاسل الزمنية لمقارنة ${currentVarConfig.nameAr} (${currentVarConfig.unit})`
                        : `Time-Series Comparison of ${currentVarConfig.nameEn} (${currentVarConfig.unit})`}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {isAr 
                      ? 'الخطوط المتصلة تمثل القياسات السنوية المجمعة من ناسا، والخطوط المنقطة تمثل خط الانحدار الخطي'
                      : 'Solid lines represent annual NASA aggregates; dashed lines represent linear regression trends.'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  NASA POWER API
                </span>
              </div>

              <div className="terrascope-chart-viewport">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: 6, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis 
                      dataKey="year" 
                      stroke={isDark ? '#64748b' : '#94a3b8'} 
                      tick={{ fill: isDark ? '#cbd5e1' : '#475569', fontSize: 11 }}
                      domain={[startYear, endYear]}
                    />
                    <YAxis 
                      stroke={isDark ? '#64748b' : '#94a3b8'} 
                      tick={{ fill: isDark ? '#cbd5e1' : '#475569', fontSize: 11 }}
                      unit={` ${currentVarConfig.unit}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        return (
                          <div className="bg-[var(--bg)] border border-[var(--border)] p-3 rounded-xl shadow-lg text-xs text-[var(--text)]" dir={isAr ? 'rtl' : 'ltr'}>
                            <div className="font-bold text-[var(--text)] border-b border-[var(--border)] pb-1 mb-2 font-mono flex items-center justify-between gap-4">
                              <span>{isAr ? `السنة: ${label}` : `Year: ${label}`}</span>
                              <span className="text-[10px] text-[#2563eb] dark:text-[#60a5fa] font-normal">NASA POWER</span>
                            </div>
                            <div className="space-y-1.5">
                              {payload.map((entry: any, index: number) => {
                                const isTrend = entry.dataKey?.toString().endsWith('_trend');
                                const rawName = entry.dataKey?.toString().replace('_trend', '');
                                const locObj = activeLocations[rawName] || STUDY_LOCATIONS[rawName];
                                const displayName = locObj ? (isAr ? locObj.nameAr : locObj.nameEn) : rawName;

                                return (
                                  <div key={index} className="flex items-center justify-between gap-3 text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                      <span 
                                        className="w-2.5 h-2.5 rounded-full" 
                                        style={{ backgroundColor: entry.color }} 
                                      />
                                      <span className={isTrend ? 'text-slate-500 dark:text-slate-400 italic' : 'text-[var(--text)] font-semibold'}>
                                        {displayName} {isTrend ? (isAr ? '(اتجاه خطي)' : '(trend)') : ''}:
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-[var(--text)] tabular-nums">
                                      {entry.value !== undefined ? entry.value : '--'} {currentVarConfig.unit}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={40}
                      wrapperStyle={{ fontSize: '12px', color: isDark ? '#f8fafc' : '#172033' }}
                      formatter={(val) => {
                        const isTrend = val.endsWith('_trend');
                        const rawName = val.replace('_trend', '');
                        const locObj = activeLocations[rawName] || STUDY_LOCATIONS[rawName];
                        const displayName = locObj ? (isAr ? locObj.nameAr : locObj.nameEn) : rawName;
                        return isTrend 
                          ? `${displayName} ${isAr ? '(انحدار)' : '(fit)'}`
                          : displayName;
                      }}
                    />
                    {trendResults.map(res => {
                      const color = getLocationColor(res.location);
                      return (
                        <React.Fragment key={res.location}>
                          <Line
                            type="monotone"
                            dataKey={res.location}
                            name={res.location}
                            stroke={color}
                            strokeWidth={2.4}
                            dot={{ r: 3, fill: color }}
                            activeDot={{ r: 6 }}
                          />
                          {showTrendlines && (
                            <Line
                              type="linear"
                              dataKey={`${res.location}_trend`}
                              name={`${res.location}_trend`}
                              stroke={color}
                              strokeWidth={1.6}
                              strokeDasharray="5 5"
                              dot={false}
                              opacity={0.75}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Statistical Analysis Results Table */}
            <div className="terrascope-dataframe p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
                  <h3 className="terrascope-h3 text-sm font-bold text-[var(--text)]">
                    {isAr ? 'نتائج الانحدار الخطي واختبار الدلالة الإحصائية' : 'Statistical Trend Analysis (Linear Regression)'}
                  </h3>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  className="sm:hidden flex items-center gap-1 text-[11px] text-[#2563eb] dark:text-[#60a5fa] font-semibold hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>

              {trendResults.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-[10px] border border-[var(--border)]">
                    <table className="w-full text-left rtl:text-right text-xs bg-[var(--bg)]">
                      <thead className="bg-[var(--surface)] text-[var(--text)] font-semibold border-b border-[var(--border)]">
                        <tr>
                          <th className="py-2.5 px-3">{isAr ? 'الموقع' : 'Location'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'الاتجاه العام' : 'Trend'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'معدل التغير السنوي' : 'Change / yr (Slope)'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'P-value' : 'P-value'}</th>
                          <th className="py-2.5 px-3">{isAr ? 'دلالة إحصائية (P < 0.05)' : 'Significant'}</th>
                          <th className="py-2.5 px-3 font-mono">r²</th>
                          <th className="py-2.5 px-3">{isAr ? 'استعراض 3D' : '3D Action'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)] font-mono text-[var(--text)]">
                        {trendResults.map(res => {
                          const locObj = activeLocations[res.location] || 
                            Object.values(activeLocations).find(l => l.nameEn === res.location) || 
                            Object.values(STUDY_LOCATIONS).find(l => l.nameEn === res.location);
                          const isInc = res.slope > 0.0001;
                          const isDec = res.slope < -0.0001;

                          return (
                            <tr key={res.location} className="hover:bg-[var(--surface)] transition-colors">
                              <td className="py-2.5 px-3 font-sans font-bold text-[var(--text)]">
                                {isAr ? res.locationAr : res.location}
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                {res.isSignificant ? (
                                  isInc ? (
                                    <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold">
                                      <TrendingUp className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'متزايد' : 'Increasing'}</span>
                                    </span>
                                  ) : isDec ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                      <TrendingDown className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'متناقص' : 'Decreasing'}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                      <Minus className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'مستقر' : 'Stable'}</span>
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <Minus className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'لا يوجد اتجاه مؤكد' : 'No significant trend'}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-semibold tabular-nums">
                                <span className={res.slope > 0 ? 'text-amber-700 dark:text-amber-300' : res.slope < 0 ? 'text-[#2563eb] dark:text-[#60a5fa]' : 'text-slate-600 dark:text-slate-400'}>
                                  {res.slope > 0 ? '+' : ''}{res.slope.toFixed(4)} {res.unit}/{isAr ? 'سنة' : 'yr'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 tabular-nums">
                                <span className={res.pValue < 0.05 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                                  {res.pValue < 0.0001 ? '< 0.0001' : res.pValue.toFixed(4)}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                {res.isSignificant ? (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                    {isAr ? 'نعم (P < 0.05)' : 'Yes (P < 0.05)'}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 dark:text-slate-400">
                                    {isAr ? 'لا (P ≥ 0.05)' : 'No (P ≥ 0.05)'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 tabular-nums">
                                {res.rSquared.toFixed(3)}
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                {locObj && (
                                  <button
                                    onClick={() => {
                                      onFlyToLocation({
                                        lat: locObj.lat,
                                        lon: locObj.lon,
                                        name: isAr ? locObj.nameAr : locObj.nameEn
                                      });
                                      onClose();
                                    }}
                                    className="px-2.5 py-1 rounded-[9px] bg-blue-50 dark:bg-blue-950/60 hover:bg-[#2563eb] border border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-[#60a5fa] hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    <span>{isAr ? 'رؤية 3D' : 'View 3D'}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Download Button */}
                  <div className="mt-3.5 pt-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      {isAr ? 'تصدير كامل النتائج والانحدارات الإحصائية بتنسيق CSV' : 'Export full empirical indicators & slope parameters as CSV'}
                    </div>
                    <button
                      onClick={handleDownloadCSV}
                      className="terrascope-download-btn w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isAr ? 'تحميل بيانات التحليل (CSV)' : 'Download Analysis Data (CSV)'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-600 dark:text-slate-400 text-xs">
                  {isAr ? 'اضغط على زر تحليل الاتجاهات للبدء' : 'Click "Analyze Environmental Trends" to start'}
                </div>
              )}
            </div>

            {/* Scientific Explanation & Rigor Note */}
            <div className="p-4 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] text-xs space-y-2 text-[var(--text)]">
              <div className="flex items-center gap-2 font-bold text-[#2563eb] dark:text-[#60a5fa]">
                <Info className="w-4 h-4 shrink-0" />
                <span>
                  {isAr 
                    ? 'التفسير العلمي لمعايير الدلالة الإحصائية (Statistical Significance & NASA POWER):' 
                    : 'Scientific Methodology & Interpretation of NASA POWER Climate Trends:'}
                </span>
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                {isAr
                  ? 'يتم حساب ميل خط الانحدار ومعامل التحديد r² واختبار الطالب t-test ثنائي الطرف. يُعتبر الاتجاه ذا دلالة إحصائية معتبرة علمياً إذا كانت القيمة الاحتمالية P-value < 0.05 (مستوى ثقة يفوق 95%). هذا يعني أن التغير الملحوظ في درجات الحرارة أو الرطوبة أو الأمطار في الأقصر أو القاهرة ليس مجرد تقلبات مناخية عشوائية، بل يعكس تحولاً مناخياً مستمراً وفق نماذج استيعاب البيانات MERRA-2 التابعة لـ NASA GMAO.'
                  : 'Trends are computed via ordinary least squares linear regression and a two-tailed Student’s t-test. A trend is statistically significant when p-value < 0.05 (confidence level > 95%). This verifies that the observed multi-decadal changes in Luxor, Cairo, or Aswan are not stochastic noise, but significant climatological shifts documented by NASA GMAO MERRA-2 assimilation.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'بيانات حقيقية مباشرة' : 'Direct NASA API Data'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" />
                  <span>{isAr ? 'مستويات ثقة 95%' : '95% Confidence Threshold'}</span>
                </span>
                <a 
                  href="https://power.larc.nasa.gov/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#2563eb] dark:text-[#60a5fa] font-semibold hover:underline"
                >
                  <span>NASA POWER Documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
