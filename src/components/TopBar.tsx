/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Top Bar with Quick Search, Scientific Nav, Analytics, and Language Switcher
 */

import React, { useState } from 'react';
import {
  Orbit,
  Languages,
  Code,
  MapPin,
  AlertOctagon,
  History,
  Sparkles,
  Database,
  Menu,
  X,
  Search,
  BarChart3,
  Compass,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import { Language, CameraPreset, LatLonCoordinate, CityClimateProfile, ThemeMode } from '../types';
import { CITY_CLIMATE_PROFILES } from '../data/nasaOfficialData';
import { searchLocationDetailed, GeocodedLocation } from '../services/geocodingService';
import { translations } from '../i18n';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  language: Language;
  theme: ThemeMode;
  currentView?: 'simulator' | 'analytics';
  cameraPreset: CameraPreset;
  onSetCameraPreset: (preset: CameraPreset) => void;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onOpenCodeGuide: () => void;
  onOpenAnalytics: () => void;
  onOpenTrendDetective: () => void;
  onOpenCities: () => void;
  onOpenHotspots: () => void;
  onOpenCharts: () => void;
  onOpenComparison: () => void;
  onOpenImpact: () => void;
  onOpenSources: () => void;
  onFlyToLocation: (coord: LatLonCoordinate) => void;
  onSearchLocation?: (coord: LatLonCoordinate) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  theme,
  currentView = 'simulator',
  onToggleLanguage,
  onToggleTheme,
  onOpenCodeGuide,
  onOpenAnalytics,
  onOpenTrendDetective,
  onOpenCities,
  onOpenHotspots,
  onOpenComparison,
  onOpenImpact,
  onOpenSources,
  onFlyToLocation,
  onSearchLocation,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [globalResults, setGlobalResults] = useState<GeocodedLocation[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [hasSearchedRemote, setHasSearchedRemote] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const navigateWithSearch = onSearchLocation || onFlyToLocation;

  // Debounced global geocoding search (Nominatim + Open-Meteo real APIs)
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setGlobalResults([]);
      setHasSearchedRemote(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true);
      setSearchError(null);
      const { results, error } = await searchLocationDetailed(trimmed, isAr ? 'ar' : 'en');
      if (cancelled) return;
      setGlobalResults(results.slice(0, 8));
      setHasSearchedRemote(true);
      if (error && results.length === 0) {
        setSearchError(
          isAr
            ? 'تعذّر الاتصال بخدمة الخرائط الجغرافية حالياً. يرجى المحاولة مجدداً.'
            : 'Unable to reach geographic search service right now. Please try again.'
        );
      }
      setIsSearchingGlobal(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, isAr]);

  // Filter matching cities from built-in climate profiles
  const matchingCities = searchQuery.trim().length > 0
    ? CITY_CLIMATE_PROFILES.filter(c =>
        c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameAr.includes(searchQuery) ||
        c.countryEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.countryAr.includes(searchQuery)
      ).slice(0, 4)
    : [];

  const handleSelectCity = (city: CityClimateProfile) => {
    const label = isAr ? city.nameAr : city.nameEn;
    setSearchQuery(label);
    navigateWithSearch({
      lat: city.lat,
      lon: city.lon,
      name: label,
      display: isAr ? `${city.nameAr}، ${city.countryAr}` : `${city.nameEn}, ${city.countryEn}`,
      country: isAr ? city.countryAr : city.countryEn,
      placeType: 'city',
    });
    setIsSearchFocused(false);
  };

  const handleSelectGlobalLocation = (loc: GeocodedLocation) => {
    setSearchQuery(loc.name);
    navigateWithSearch({
      lat: loc.latitude,
      lon: loc.longitude,
      name: loc.name,
      display: loc.display,
      country: loc.country,
      admin1: loc.admin1,
      placeType: loc.placeType,
      boundingBox: loc.boundingBox,
    });
    setIsSearchFocused(false);
  };

  // Explicit form submission for immediate Enter / Search button execution
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsSearchFocused(true);
    setIsSearchingGlobal(true);
    setSearchError(null);

    const { results, error } = await searchLocationDetailed(trimmed, isAr ? 'ar' : 'en');
    setIsSearchingGlobal(false);
    setHasSearchedRemote(true);

    if (results.length > 0) {
      setGlobalResults(results.slice(0, 8));
      handleSelectGlobalLocation(results[0]);
      return;
    }

    if (matchingCities.length > 0) {
      handleSelectCity(matchingCities[0]);
      return;
    }

    setGlobalResults([]);
    if (error) {
      setSearchError(
        isAr
          ? 'تعذّر الاتصال بخدمة البحث الجغرافي. تحقق من الإنترنت وحاول مجدداً.'
          : 'Could not reach the geographic search service. Please check connection and retry.'
      );
    }
  };

  const noResultsFound =
    !isSearchingGlobal &&
    hasSearchedRemote &&
    matchingCities.length === 0 &&
    globalResults.length === 0 &&
    searchQuery.trim().length >= 1;

  const showDropdown =
    isSearchFocused &&
    (matchingCities.length > 0 ||
      globalResults.length > 0 ||
      isSearchingGlobal ||
      noResultsFound ||
      Boolean(searchError));

  return (
    <div className="relative z-30 select-none">
      <header className="topbar relative z-30 bg-white/95 dark:bg-[#101827]/95 border-b border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-[#f8fafc] backdrop-blur-md transition-colors duration-300">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 order-1">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-600/30 dark:border-blue-400/40 flex items-center justify-center text-[#2563eb] dark:text-[#60a5fa] shrink-0">
            <Orbit className="w-5 h-5 icon" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#172033] dark:text-[#f8fafc] whitespace-nowrap m-0">
                {t.appTitle}
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 hidden lg:inline">
                NASA Space Apps
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden 2xl:inline whitespace-nowrap">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Real Bilingual Geographic Search Bar — Always full search input + button */}
        <div className="relative flex-1 min-w-[220px] max-w-md order-3 basis-full md:order-2 md:basis-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 icon absolute top-1/2 -translate-y-1/2 left-2.5 rtl:right-2.5 rtl:left-auto text-slate-500 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 220)}
                placeholder={isAr ? 'ابحث عن مدينة، دولة أو منطقة...' : 'Search city, country or region...'}
                aria-label={isAr ? 'البحث الجغرافي' : 'Geographic search'}
                className="w-full bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] rounded-xl pl-8 pr-7 rtl:pr-8 rtl:pl-7 py-1.5 text-xs text-[#172033] dark:text-[#f8fafc] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#60a5fa] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery('');
                    setGlobalResults([]);
                    setHasSearchedRemote(false);
                    setSearchError(null);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 right-2 rtl:left-2 rtl:right-auto text-slate-400 hover:text-[#172033] dark:hover:text-white p-0.5"
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X className="w-3 h-3 icon" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 shadow-xs"
              title={isAr ? 'بحث جغرافي' : 'Search location'}
            >
              <Search className="w-3.5 h-3.5 icon" />
              <span>{isAr ? 'بحث' : 'Search'}</span>
            </button>
          </form>

          {/* Real Geographic Autocomplete & Feedback Dropdown */}
          {showDropdown && (
            <div
              className="absolute top-full mt-1.5 inset-x-0 bg-white dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] rounded-xl shadow-2xl overflow-hidden z-50 text-xs max-h-80 overflow-y-auto"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              {/* Built-in NASA Climate Profiles */}
              {matchingCities.map(city => (
                <button
                  key={city.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectCity(city);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#f3f4f6] dark:hover:bg-slate-700/70 text-left rtl:text-right border-b border-[#dddddd] dark:border-[#334155]/70 last:border-none transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 icon text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold text-[#172033] dark:text-[#f8fafc] block truncate">
                        {isAr ? `${city.nameAr}، ${city.countryAr}` : `${city.nameEn}, ${city.countryEn}`}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {city.lat.toFixed(4)}°, {city.lon.toFixed(4)}° · NASA Station
                      </span>
                    </div>
                  </div>
                  <span className="text-orange-600 dark:text-orange-400 font-mono font-bold text-[11px] tabular-nums shrink-0">
                    +{city.tempChangeDelta.toFixed(1)}°C
                  </span>
                </button>
              ))}

              {/* Real Global Geocoded Places (Nominatim + Open-Meteo) */}
              {globalResults.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectGlobalLocation(loc);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-[#f3f4f6] dark:hover:bg-slate-700/70 text-left rtl:text-right border-b border-[#dddddd] dark:border-[#334155]/70 last:border-none transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className="w-3.5 h-3.5 icon text-emerald-600 dark:text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-[#172033] dark:text-[#f8fafc] block truncate">
                        {loc.display}
                      </span>
                      <span className="text-[10px] text-[#2563eb] dark:text-[#60a5fa] font-mono tabular-nums block">
                        Lat: {loc.latitude.toFixed(4)}° | Lon: {loc.longitude.toFixed(4)}°
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#172033] dark:text-slate-200 font-sans shrink-0 px-2 py-0.5 rounded bg-[#f3f4f6] dark:bg-[#101827] border border-[#dddddd] dark:border-[#334155]">
                    {isAr ? 'عرض على الخريطة' : 'Show Map'}
                  </span>
                </button>
              ))}

              {isSearchingGlobal && (
                <div className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                  {isAr ? 'جارٍ البحث عن الإحداثيات الجغرافية الحقيقية...' : 'Searching real geographic coordinates...'}
                </div>
              )}

              {searchError && (
                <div className="px-3 py-2.5 flex items-center gap-2 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {noResultsFound && !searchError && (
                <div className="px-3 py-3 text-center text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 text-[11px] space-y-0.5">
                  <div className="font-bold">
                    {isAr ? 'لم يتم العثور على هذا الموقع' : 'Location not found'}
                  </div>
                  <div className="opacity-85">
                    {isAr
                      ? 'تأكد من صحة كتابة اسم المدينة أو الدولة أو المنطقة، أو جرّب البحث بالعربية أو الإنجليزية.'
                      : 'Check the city, country, or region spelling and try again in Arabic or English.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Zone 2: Desktop & Tablet Scientific Tools Buttons — Always visible on >= 768px without clipping */}
        <nav className="hidden md:flex flex-wrap items-center gap-1.5 text-[11px] 2xl:text-xs font-medium text-[#172033] dark:text-slate-200 order-4 basis-full pt-1.5 border-t border-[#dddddd]/70 dark:border-[#334155]/70 2xl:order-3 2xl:basis-auto 2xl:pt-0 2xl:border-none">
          <button
            type="button"
            onClick={onOpenAnalytics}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all whitespace-nowrap shadow-sm ${
              currentView === 'analytics'
                ? 'bg-[#2563eb] text-white border border-blue-500'
                : 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/50 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/60'
            }`}
          >
            <BarChart3 className={`w-4 h-4 icon ${currentView === 'analytics' ? 'text-white' : 'text-[#2563eb] dark:text-cyan-300'}`} />
            <span className="font-bold">{t.navAnalytics}</span>
            <span className={`hidden 2xl:inline px-1.5 py-0.2 rounded text-[10px] font-mono ${
              currentView === 'analytics'
                ? 'bg-white/20 text-white'
                : 'bg-blue-100 dark:bg-blue-500/30 text-blue-800 dark:text-cyan-200'
            }`}>
              5 Recharts
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenTrendDetective}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all whitespace-nowrap shadow-xs"
          >
            <Compass className="w-4 h-4 icon text-emerald-600 dark:text-emerald-300" />
            <span className="font-bold">{t.navTrendDetective}</span>
            <span className="hidden 2xl:inline px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/30 rounded text-[10px] text-emerald-800 dark:text-emerald-300 font-mono">
              NASA POWER
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCities}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] transition-colors whitespace-nowrap"
          >
            <MapPin className="w-3.5 h-3.5 icon text-[#2563eb] dark:text-[#60a5fa]" />
            <span>{t.navCities}</span>
          </button>

          <button
            type="button"
            onClick={onOpenHotspots}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] transition-colors whitespace-nowrap"
          >
            <AlertOctagon className="w-3.5 h-3.5 icon text-red-600 dark:text-red-400" />
            <span>{t.navHotspots}</span>
          </button>

          <button
            type="button"
            onClick={onOpenComparison}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] transition-colors whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 icon text-purple-600 dark:text-purple-400" />
            <span>{t.navComparison}</span>
          </button>

          <button
            type="button"
            onClick={onOpenImpact}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 icon text-emerald-600 dark:text-emerald-400" />
            <span>{t.navImpact}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSources}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] transition-colors whitespace-nowrap"
          >
            <Database className="w-3.5 h-3.5 icon text-cyan-600 dark:text-cyan-400" />
            <span>{t.navSources}</span>
          </button>
        </nav>

        {/* Zone 3: Theme Switcher, Language Switcher, PWA Install, Code Guide & Mobile Drawer */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 order-2 md:order-3 2xl:order-4">
          <PWAInstallButton language={language} variant="header" />
          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-[#f8fafc] hover:border-[#2563eb] dark:hover:border-[#60a5fa] transition-colors whitespace-nowrap"
            title={
              theme === 'dark'
                ? isAr ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode'
                : isAr ? 'التبديل إلى الوضع الليلي' : 'Switch to Dark Mode'
            }
            aria-label={
              theme === 'dark'
                ? isAr ? 'الوضع النهاري' : 'Light Mode'
                : isAr ? 'الوضع الليلي' : 'Dark Mode'
            }
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 icon text-amber-400" />
                <span className="hidden sm:inline">{isAr ? 'نهاري' : 'Light'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 icon text-[#2563eb]" />
                <span className="hidden sm:inline">{isAr ? 'ليلي' : 'Dark'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-[#f8fafc] hover:border-[#2563eb] dark:hover:border-[#60a5fa] transition-colors whitespace-nowrap"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 icon text-[#2563eb] dark:text-[#60a5fa]" />
            <span>{t.langToggle}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCodeGuide}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white shadow-sm transition-all whitespace-nowrap"
          >
            <Code className="w-3.5 h-3.5 icon" />
            <span className="hidden lg:inline">{t.pitchDeckBtn}</span>
            <span className="lg:hidden">{isAr ? 'الدليل' : 'Guide'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-[#f8fafc] hover:border-[#2563eb] flex items-center justify-center"
            aria-label={isAr ? 'فتح القائمة' : 'Open mobile navigation'}
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 icon" /> : <Menu className="w-4 h-4 icon" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (< 768px only) */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden absolute top-full inset-x-0 z-40 bg-white/98 dark:bg-[#101827]/98 border-b border-[#dddddd] dark:border-[#334155] text-[#172033] dark:text-[#f8fafc] p-3 sm:p-4 shadow-2xl backdrop-blur-lg animate-in slide-in-from-top-2 duration-200 max-h-[80vh] overflow-y-auto"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button
              onClick={() => { onOpenAnalytics(); setIsMobileMenuOpen(false); }}
              className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-500/60 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-bold"
            >
              <BarChart3 className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
              <span>{t.navAnalytics}</span>
            </button>

            <button
              onClick={() => { onOpenTrendDetective(); setIsMobileMenuOpen(false); }}
              className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-bold"
            >
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
              <span>{t.navTrendDetective}</span>
            </button>

            <button
              onClick={() => { onOpenCities(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb]"
            >
              <MapPin className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
              <span>{t.navCities}</span>
            </button>

            <button
              onClick={() => { onOpenHotspots(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb]"
            >
              <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>{t.navHotspots}</span>
            </button>

            <button
              onClick={() => { onOpenComparison(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb]"
            >
              <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{t.navComparison}</span>
            </button>

            <button
              onClick={() => { onOpenImpact(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb]"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t.navImpact}</span>
            </button>

            <button
              onClick={() => { onOpenSources(); setIsMobileMenuOpen(false); }}
              className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155] hover:border-[#2563eb]"
            >
              <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{t.navSources}</span>
            </button>

            <div className="col-span-2 pt-1">
              <PWAInstallButton language={language} variant="card" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
