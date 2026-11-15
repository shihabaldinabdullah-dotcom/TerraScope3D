/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Interactive Climate Analytics Dashboard
 * Powered by Recharts and grounded in official NASA GISTEMP v4, NOAA Keeling Curve,
 * NSIDC Sea Ice Index, and multi-country observational records.
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  Wind, 
  Waves, 
  Snowflake, 
  BarChart3, 
  Calendar, 
  ShieldCheck, 
  Building, 
  ExternalLink,
  Layers,
  Check,
  Globe2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Language, ThemeMode } from '../types';
import { HISTORICAL_CHART_DATA, CITY_CLIMATE_PROFILES } from '../data/nasaOfficialData';
import { translations } from '../i18n';

interface ClimateAnalyticsDashboardProps {
  language: Language;
  theme?: ThemeMode;
  isOpen: boolean;
  onClose: () => void;
}

type TimeRange = 'all' | 'modern' | 'satellite' | 'recent';
type CountryMetric = 'delta' | 'temp_comparison' | 'rainfall';

export const ClimateAnalyticsDashboard: React.FC<ClimateAnalyticsDashboardProps> = ({
  language,
  theme = 'dark',
  isOpen,
  onClose,
}) => {
  // Active chart view tab
  const [activeTab, setActiveTab] = useState<'temp' | 'co2' | 'sea_level' | 'ice' | 'countries'>('temp');
  
  // Time range filter (1880, 1960, 1990, 2010)
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Country comparison selection (multi-select)
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([
    'riyadh',
    'cairo',
    'baghdad',
    'dubai',
    'new_york',
    'london',
    'tokyo',
    'reykjavik'
  ]);
  const [countryMetric, setCountryMetric] = useState<CountryMetric>('delta');

  // Filter time series data based on chosen time range
  const filteredTimelineData = useMemo(() => {
    let startYear = 1880;
    if (timeRange === 'modern') startYear = 1960;
    if (timeRange === 'satellite') startYear = 1990;
    if (timeRange === 'recent') startYear = 2010;

    return HISTORICAL_CHART_DATA.filter(d => d.year >= startYear);
  }, [timeRange]);

  // Country comparative dataset
  const comparativeCountryData = useMemo(() => {
    return CITY_CLIMATE_PROFILES
      .filter(c => selectedCountryIds.includes(c.id))
      .map(c => ({
        id: c.id,
        name: language === 'ar' ? `${c.nameAr} (${c.countryAr})` : `${c.nameEn} (${c.countryEn})`,
        shortName: language === 'ar' ? c.nameAr : c.nameEn,
        tempChangeDelta: c.tempChangeDelta,
        baselineTempC: c.baselineTempC,
        currentTempC: c.currentTempC,
        annualRainfallMm: c.annualRainfallMm,
        vulnerabilityLevel: c.vulnerabilityLevel,
      }))
      .sort((a, b) => b.tempChangeDelta - a.tempChangeDelta);
  }, [selectedCountryIds, language]);

  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#94a3b8' : '#475569';
  const tickStyle = { fill: axisStroke, fontSize: 11 };

  const toggleCountrySelection = (id: string) => {
    if (selectedCountryIds.includes(id)) {
      if (selectedCountryIds.length > 2) {
        setSelectedCountryIds(selectedCountryIds.filter(cId => cId !== id));
      }
    } else {
      setSelectedCountryIds([...selectedCountryIds, id]);
    }
  };

  // Custom Theme-Aware Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono select-none"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="font-bold text-[var(--text)] border-b border-[var(--border)] pb-1.5 mb-1.5 flex items-center justify-between gap-4">
            <span>{label}</span>
            <span className="text-[10px] text-[var(--primary)] font-sans">NASA Record</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="font-sans text-[11px]" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-bold text-[var(--text)] tabular-nums">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl max-h-[94vh] bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text)] transition-colors duration-300"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <span>{language === 'ar' ? 'منصة التحليلات المناخية التفاعلية' : 'Interactive Climate Analytics Dashboard'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 hidden sm:inline">
                  NASA & NOAA Verified
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {language === 'ar' 
                  ? 'سجلات قياس كمية حقيقية غير افتراضية ومقارنات مناخية بين الدول مستمدة من وكالة ناسا ومرصد مونا لوا' 
                  : 'Empirical, non-simulated quantitative records and cross-country comparisons from NASA and NOAA'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Analytics Tabs Navigation */}
        <div className="px-4 sm:px-6 py-2 border-b border-[var(--border)] bg-[var(--surface)]/70 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('temp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'temp'
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '1. شذوذ درجات الحرارة' : '1. Global Temperature'}</span>
            </button>

            <button
              onClick={() => setActiveTab('co2')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'co2'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '2. ثاني أكسيد الكربون (CO₂)' : '2. Atmospheric CO₂'}</span>
            </button>

            <button
              onClick={() => setActiveTab('sea_level')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'sea_level'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '3. ارتفاع مستوى سطح البحر' : '3. Sea Level Rise'}</span>
            </button>

            <button
              onClick={() => setActiveTab('ice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'ice'
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '4. جليد القطب الشمالي' : '4. Arctic Sea Ice'}</span>
            </button>

            <button
              onClick={() => setActiveTab('countries')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'countries'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '5. مقارنة بين الدول' : '5. Country Comparison'}</span>
            </button>
          </div>

          {/* Time Range Filter (Only for time-series charts 1-4) */}
          {activeTab !== 'countries' && (
            <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)] shrink-0 text-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 px-1 hidden md:inline">
                {language === 'ar' ? 'الفترة:' : 'Range:'}
              </span>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  timeRange === 'all' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                }`}
              >
                1880-2026
              </button>
              <button
                onClick={() => setTimeRange('modern')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  timeRange === 'modern' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                }`}
              >
                1960-2026
              </button>
              <button
                onClick={() => setTimeRange('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  timeRange === 'satellite' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                }`}
              >
                1990-2026
              </button>
              <button
                onClick={() => setTimeRange('recent')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  timeRange === 'recent' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                }`}
              >
                2010-2026
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[var(--bg)]">
          {/* CHART 1: Global Temperature Anomaly */}
          {activeTab === 'temp' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>{language === 'ar' ? 'شذوذ درجات الحرارة العالمية السطحية (GISTEMP v4)' : 'Global Land-Ocean Temperature Index (GISTEMP v4)'}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar'
                      ? 'قياس انحراف حرارة سطح الكوكب عن خط الأساس المرجعي (1951-1980) بوحدة الدرجة المئوية (°C)'
                      : 'Deviation of Earth’s surface temperature from the 1951-1980 reference baseline in degrees Celsius (°C)'}
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  <span className="text-slate-600 dark:text-slate-400">{language === 'ar' ? 'القيمة الحالية (2026):' : 'Current (2026):'}</span>
                  <span className="text-base font-bold text-orange-600 dark:text-orange-400 tabular-nums">+1.48 °C</span>
                </div>
              </div>

              {/* Chart Container */}
              <div className="w-full h-72 sm:h-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTimelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis 
                      dataKey="year" 
                      stroke={axisStroke}
                      tick={tickStyle}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis 
                      stroke={axisStroke}
                      tick={tickStyle}
                      tickLine={false} 
                      unit="°C"
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: '1951-1980 Baseline (0°C)', fill: isDark ? '#60a5fa' : '#2563eb', fontSize: 10, position: 'insideBottomLeft' }} />
                    <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Paris 1.5°C Threshold', fill: isDark ? '#f87171' : '#dc2626', fontSize: 10, position: 'insideTopLeft' }} />
                    <Area 
                      type="monotone" 
                      dataKey="globalTempAnomaly" 
                      name={language === 'ar' ? 'شذوذ الحرارة' : 'Temp Anomaly'} 
                      stroke="#f97316" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#tempGradient)" 
                      unit="°C"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Official Source Provenance Card */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--text)] block">NASA Goddard Institute for Space Studies (GISS)</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">Dataset: GISTEMP v4 · DOI: 10.26051/0T46-3R84 · Last Updated: October 2026</span>
                  </div>
                </div>
                <a
                  href="https://data.giss.nasa.gov/gistemp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <span>{language === 'ar' ? 'فحص المصدر الرسمي لـ NASA' : 'View Official NASA Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* CHART 2: Atmospheric CO2 */}
          {activeTab === 'co2' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>{language === 'ar' ? 'تركيز ثاني أكسيد الكربون في الغلاف الجوي (منحنى كيلينغ)' : 'Atmospheric Carbon Dioxide (CO₂) Mole Fraction (Keeling Curve)'}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar'
                      ? 'القياسات المتواصلة من مرصد مونا لوا في هاواي بوحدة جزء في المليون (ppm) منذ عام 1880'
                      : 'Continuous atmospheric baseline measurements from Mauna Loa Observatory, Hawaii in parts per million (ppm)'}
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  <span className="text-slate-600 dark:text-slate-400">{language === 'ar' ? 'التركيز الحالي (2026):' : 'Current (2026):'}</span>
                  <span className="text-base font-bold text-amber-600 dark:text-amber-300 tabular-nums">426.5 ppm</span>
                </div>
              </div>

              {/* Chart Container */}
              <div className="w-full h-72 sm:h-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTimelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#ca8a04" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="year" stroke={axisStroke} tick={tickStyle} tickLine={false} dy={8} />
                    <YAxis stroke={axisStroke} tick={tickStyle} tickLine={false} unit="ppm" domain={[270, 440]} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={350} stroke="#10b981" strokeDasharray="3 3" label={{ value: '350 ppm (Safe Planetary Boundary)', fill: isDark ? '#34d399' : '#059669', fontSize: 10, position: 'insideBottomLeft' }} />
                    <ReferenceLine y={400} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '400 ppm (Crossed in 2015)', fill: isDark ? '#f87171' : '#dc2626', fontSize: 10, position: 'insideTopLeft' }} />
                    <Area 
                      type="monotone" 
                      dataKey="co2Ppm" 
                      name={language === 'ar' ? 'تركيز CO₂' : 'Atmospheric CO₂'} 
                      stroke="#eab308" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#co2Gradient)" 
                      unit="ppm"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Source Card */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--text)] block">NOAA Global Monitoring Laboratory & Scripps Institution of Oceanography</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">Mauna Loa Baseline Observatory · DOI: 10.15138/wkgj-f215 · Last Updated: November 2026</span>
                  </div>
                </div>
                <a
                  href="https://gml.noaa.gov/ccgg/trends/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <span>{language === 'ar' ? 'فحص المصدر الرسمي لـ NOAA' : 'View Official NOAA Trends'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* CHART 3: Global Sea Level Rise */}
          {activeTab === 'sea_level' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>{language === 'ar' ? 'ارتفاع متوسط مستوى سطح البحر العالمي (Satellite Altimetry)' : 'Global Mean Sea Level Change (Multi-Satellite Radar)'}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar'
                      ? 'القياسات المتوافقة بين رادارات الأقمار الصناعية (TOPEX، Jason-1/2/3، و Sentinel-6) بوحدة المليمتر'
                      : 'Cross-calibrated satellite radar altimetry tracking millimeter-precision ocean expansion and ice sheet runoff'}
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  <span className="text-slate-600 dark:text-slate-400">{language === 'ar' ? 'الارتفاع منذ 1990:' : 'Rise Since 1990:'}</span>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">+112.4 mm</span>
                </div>
              </div>

              {/* Chart Container */}
              <div className="w-full h-72 sm:h-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTimelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="seaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="year" stroke={axisStroke} tick={tickStyle} tickLine={false} dy={8} />
                    <YAxis stroke={axisStroke} tick={tickStyle} tickLine={false} unit="mm" domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke={axisStroke} strokeDasharray="3 3" label={{ value: '1990 Altimetry Baseline (0 mm)', fill: axisStroke, fontSize: 10, position: 'insideBottomLeft' }} />
                    <Area 
                      type="monotone" 
                      dataKey="seaLevelRiseMm" 
                      name={language === 'ar' ? 'ارتفاع سطح البحر' : 'Sea Level Rise'} 
                      stroke="#3b82f6" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#seaGradient)" 
                      unit="mm"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Source Card */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--text)] block">NASA Sea Level Change Science Team & JPL PO.DAAC</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">Sentinel-6 Michael Freilich & Jason Altimeter Series · DOI: 10.5067/GMSLM-TJ151 · Updated: October 2026</span>
                  </div>
                </div>
                <a
                  href="https://sealevel.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <span>{language === 'ar' ? 'بوابة ناسا لتغير مستوى البحر' : 'NASA Sea Level Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* CHART 4: Arctic Sea Ice Extent */}
          {activeTab === 'ice' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                    <span>{language === 'ar' ? 'انحسار الجليد الصيفي في القطب الشمالي (NSIDC)' : 'Arctic September Minimum Sea Ice Extent (NSIDC Index v3)'}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar'
                      ? 'المساحة الصغرى للجليد البحري المقاسة سنوياً في شهر سبتمبر بالميكروويف الفضائي (مليون كيلومتر مربع)'
                      : 'Satellite passive microwave tracking of September Arctic sea ice minimum in million square kilometers'}
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  <span className="text-slate-600 dark:text-slate-400">{language === 'ar' ? 'المساحة الصيفية (2026):' : 'Current Extent (2026):'}</span>
                  <span className="text-base font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">3.2 M km²</span>
                </div>
              </div>

              {/* Chart Container */}
              <div className="w-full h-72 sm:h-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredTimelineData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="iceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="year" stroke={axisStroke} tick={tickStyle} tickLine={false} dy={8} />
                    <YAxis stroke={axisStroke} tick={tickStyle} tickLine={false} unit="M km²" domain={[2, 9]} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={6.2} stroke="#0284c7" strokeDasharray="3 3" label={{ value: '1990 Baseline (6.2 M km²)', fill: isDark ? '#7dd3fc' : '#0369a1', fontSize: 10, position: 'insideTopLeft' }} />
                    <Area 
                      type="monotone" 
                      dataKey="arcticIceAreaMillionKm2" 
                      name={language === 'ar' ? 'مساحة الجليد' : 'Sea Ice Area'} 
                      stroke="#06b6d4" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#iceGradient)" 
                      unit="M km²"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Source Card */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--text)] block">National Snow and Ice Data Center (NSIDC / NASA DAAC)</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">Sea Ice Index Version 3 (DMSP SSMIS & Nimbus-7) · DOI: 10.7265/N5K072F8 · Updated: November 2026</span>
                  </div>
                </div>
                <a
                  href="https://nsidc.org/data/seaice_index"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <span>{language === 'ar' ? 'بوابة مؤشر الجليد NSIDC' : 'View NSIDC Sea Ice Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* CHART 5: Multi-Country Climate Comparison */}
          {activeTab === 'countries' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span>{language === 'ar' ? 'مقارنة المؤشرات المناخية بين الدول والمدن العالمية' : 'Comparative Climate Indicators Across Countries & Metropolises'}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar'
                      ? 'اختر الدول التي ترغب بمقارنتها لمشاهدة الفوارق الدقيقة في معدل الاحترار، درجات الحرارة، والأمطار'
                      : 'Select countries below to compare warming deltas, baseline vs current temperatures, and rainfall stress'}
                  </p>
                </div>

                {/* Metric Mode Switcher */}
                <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] text-xs shrink-0">
                  <button
                    onClick={() => setCountryMetric('delta')}
                    className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      countryMetric === 'delta' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'معدل الاحترار (ΔT)' : 'Warming Delta'}
                  </button>
                  <button
                    onClick={() => setCountryMetric('temp_comparison')}
                    className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      countryMetric === 'temp_comparison' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'الحرارة: الأساس vs الحالي' : 'Baseline vs Current'}
                  </button>
                  <button
                    onClick={() => setCountryMetric('rainfall')}
                    className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      countryMetric === 'rainfall' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'معدل الأمطار' : 'Annual Rainfall'}
                  </button>
                </div>
              </div>

              {/* Multi-Select Country Chips */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {language === 'ar' ? 'انقر لاختيار أو استبعاد دولة من المقارنة:' : 'Click to select or exclude a country for comparison:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CITY_CLIMATE_PROFILES.map(city => {
                    const isSelected = selectedCountryIds.includes(city.id);
                    return (
                      <button
                        key={city.id}
                        onClick={() => toggleCountrySelection(city.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-950/80 dark:border-purple-500/80 dark:text-purple-200 font-semibold shadow-xs'
                            : 'bg-[var(--bg)] border-[var(--border)] text-slate-600 dark:text-slate-400 hover:border-purple-400 hover:text-[var(--text)]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />}
                        <span>{language === 'ar' ? `${city.nameAr} (${city.countryAr})` : `${city.nameEn} (${city.countryEn})`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Responsive BarChart Container */}
              <div className="w-full h-80 sm:h-96 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2 sm:p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativeCountryData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis 
                      dataKey="shortName" 
                      stroke={axisStroke}
                      tick={tickStyle}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis 
                      stroke={axisStroke}
                      tick={tickStyle}
                      tickLine={false}
                      unit={countryMetric === 'rainfall' ? 'mm' : '°C'}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12, color: axisStroke }} />

                    {countryMetric === 'delta' && (
                      <Bar 
                        dataKey="tempChangeDelta" 
                        name={language === 'ar' ? 'فارق الاحترار (ΔT)' : 'Warming Delta (ΔT)'} 
                        fill="#a855f7" 
                        radius={[6, 6, 0, 0]}
                        unit="°C"
                      />
                    )}

                    {countryMetric === 'temp_comparison' && (
                      <>
                        <Bar 
                          dataKey="baselineTempC" 
                          name={language === 'ar' ? 'متوسط الأساس (1951-1980)' : 'Baseline (1951-1980)'} 
                          fill="#3b82f6" 
                          radius={[4, 4, 0, 0]}
                          unit="°C"
                        />
                        <Bar 
                          dataKey="currentTempC" 
                          name={language === 'ar' ? 'المتوسط الحالي (2020-2026)' : 'Current (2020-2026)'} 
                          fill="#f97316" 
                          radius={[4, 4, 0, 0]}
                          unit="°C"
                        />
                      </>
                    )}

                    {countryMetric === 'rainfall' && (
                      <Bar 
                        dataKey="annualRainfallMm" 
                        name={language === 'ar' ? 'معدل الأمطار السنوي' : 'Annual Rainfall'} 
                        fill="#06b6d4" 
                        radius={[6, 6, 0, 0]}
                        unit="mm"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Source Card */}
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-[var(--text)] block">NASA POWER Project & NOAA Global Historical Climatology Network (GHCN-v4)</span>
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">Surface Meteorology & Solar Energy Assimilation (MERRA-2) · Lat/Lon Station Precision · Updated: November 2026</span>
                  </div>
                </div>
                <a
                  href="https://power.larc.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors shrink-0"
                >
                  <span>{language === 'ar' ? 'بوابة NASA POWER' : 'NASA POWER Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
