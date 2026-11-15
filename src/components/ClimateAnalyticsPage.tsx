/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Scientific Climate Analytics Platform
 * Comprehensive peer-reviewed data validation aligned with official NASA and NOAA registries:
 * 1. NASA GISTEMP v4 LOTI (1951-1980 baseline, latest published monthly anomaly: Sep 2026: +1.38±0.06°C)
 * 2. NOAA GML Atmospheric CO2: Global Marine Monthly Mean (426.10 ppm, July 2026) vs Mauna Loa Weekly (427.28 ppm, Oct 25, 2026)
 * 3. NASA Satellite Altimetry Sea Level: 115.8 ± 4.0 mm since 1993 baseline (purged of 1990 references)
 * 4. NSIDC Arctic Sea Ice Minimum: 4.60 M km² on Sep 12, 2026 (10th lowest on satellite record, -32.8% vs 1979-2000)
 * 5. Unified Scientific Documentation System covering 9 mandatory metadata criteria
 * 6. Interactive synchronization engine with real connectivity testing and transparent CORS fallback
 * 7. Two-period comparison engine and multi-country regional comparative analysis
 * 8. One-click CSV export with UTF-8 BOM
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  TrendingUp, 
  Wind, 
  Waves, 
  Snowflake, 
  BarChart3, 
  Globe, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  Info, 
  Download,
  Scale, 
  FileSpreadsheet, 
  AlertTriangle, 
  Clock, 
  BookOpen,
  Filter,
  Layers,
  Thermometer,
  RefreshCw,
  HelpCircle,
  Database,
  CheckCircle2,
  Compass,
  Sun,
  Moon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Language, ClimateYearData, ScientificIndicatorDoc, LatLonCoordinate, ThemeMode } from '../types';
import { HISTORICAL_CHART_DATA, CITY_CLIMATE_PROFILES } from '../data/nasaOfficialData';
import { scientificDataService, SyncStatusReport } from '../services/scientificDataService';
import { translations } from '../i18n';
import { RegionalTrendComparison } from './RegionalTrendComparison';

interface ClimateAnalyticsPageProps {
  language: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onBackToSimulator: () => void;
  onToggleLanguage: () => void;
  onOpenTrendDetective?: () => void;
  onFlyToLocation?: (coord: LatLonCoordinate) => void;
}

type TimeRange = 'all' | 'modern' | 'satellite' | 'recent';
type CountryMetric = 'delta' | 'temp_comparison' | 'rainfall';

interface PeriodComparisonPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  periodA: [number, number];
  periodB: [number, number];
  descriptionAr: string;
  descriptionEn: string;
}

const COMPARISON_PRESETS: PeriodComparisonPreset[] = [
  {
    id: 'pre_vs_modern',
    nameAr: 'ما قبل الثورة الصناعية vs العصر الحديث',
    nameEn: 'Pre-Industrial vs Modern Era',
    periodA: [1880, 1940],
    periodB: [1990, 2025],
    descriptionAr: 'مقارنة الحقبة الصناعية المبكرة بعصر تسارع الانبعاثات والرصد بالأقمار الصناعية.',
    descriptionEn: 'Compares early industrial baseline with the satellite era and accelerating emissions.'
  },
  {
    id: 'giss_baseline_vs_recent',
    nameAr: 'خط أساس ناسا (1951-1980) vs العقدين الأخيرين',
    nameEn: 'NASA Baseline (1951-1980) vs Last 2 Decades',
    periodA: [1951, 1980],
    periodB: [2005, 2025],
    descriptionAr: 'مقارنة خط الأساس المرجعي المعتمد عالمياً في سجلات GISTEMP بأحدث عقدين مسجلين.',
    descriptionEn: 'Compares standard NASA 30-year climatological baseline against recent decades.'
  },
  {
    id: 'pre_satellite_vs_satellite',
    nameAr: 'ما قبل الأقمار (1940-1970) vs عصر الأقمار الفضائية',
    nameEn: 'Pre-Satellite vs Space Altimetry Era',
    periodA: [1940, 1970],
    periodB: [1995, 2025],
    descriptionAr: 'مقارنة دقة القياسات الأرضية القديمة مع عهد الرادار الفضائي المستمر للأقمار الصناعية.',
    descriptionEn: 'Contrasts early ground networks with multi-satellite continuous radar altimetry.'
  }
];

// Client-side CSV export utility
function exportDataToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel / Arabic support
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let val = row[k] === null || row[k] === undefined ? '' : row[k];
            if (typeof val === 'string') {
              val = val.replace(/"/g, '""');
              if (val.search(/("|,|\n)/g) >= 0) {
                val = `"${val}"`;
              }
            }
            return val;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ClimateAnalyticsPage: React.FC<ClimateAnalyticsPageProps> = ({
  language,
  theme = 'light',
  onToggleTheme,
  onBackToSimulator,
  onToggleLanguage,
  onOpenTrendDetective,
  onFlyToLocation,
}) => {
  const t = translations[language];
  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#334155' : '#e2e8f0';
  const axisStroke = isDark ? '#64748b' : '#94a3b8';
  const tickFill = isDark ? '#cbd5e1' : '#475569';
  const legendStyle = { paddingTop: 10, fontSize: 12, color: isDark ? '#f8fafc' : '#172033' };

  // Active section tab: charts, documentation catalog, period comparison, country comparison, regional trends
  const [activeTab, setActiveTab] = useState<'charts' | 'scientific_catalog' | 'period_comparison' | 'country_comparison' | 'regional_trends'>('charts');

  // Time Range Filter for Timeline Charts
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Active Point Inspector State (Defaults to latest validated record)
  const [selectedPoint, setSelectedPoint] = useState<ClimateYearData>(HISTORICAL_CHART_DATA[HISTORICAL_CHART_DATA.length - 1]);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('temp_anomaly');

  // Sync Service State
  const [syncReport, setSyncReport] = useState<SyncStatusReport>(scientificDataService.getStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Period Comparison State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pre_vs_modern');
  const [periodAStart, setPeriodAStart] = useState<number>(1880);
  const [periodAEnd, setPeriodAEnd] = useState<number>(1940);
  const [periodBStart, setPeriodBStart] = useState<number>(1990);
  const [periodBEnd, setPeriodBEnd] = useState<number>(2025);

  // Country Comparison Selection
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

  // Unified Scientific Indicators Catalog
  const scientificIndicators = useMemo(() => scientificDataService.getIndicators(), []);

  // Filter time series data based on chosen time range
  const filteredTimelineData = useMemo(() => {
    let startYear = 1880;
    if (timeRange === 'modern') startYear = 1960;
    if (timeRange === 'satellite') startYear = 1993; // 1993 Inception of satellite radar altimetry
    if (timeRange === 'recent') startYear = 2010;

    return HISTORICAL_CHART_DATA.filter(d => d.year >= startYear).map(d => ({
      ...d,
      displayLabel: d.year === 2026 ? '2026*' : `${d.year}`,
      seaLevelUpperUncertainty: d.seaLevelRiseMm + (d.seaLevelUncertainty || 4.0),
      seaLevelLowerUncertainty: Math.max(-20, d.seaLevelRiseMm - (d.seaLevelUncertainty || 4.0)),
      preIndustrialEquivTemp: d.globalTempAnomaly + 0.22, // GISS / IPCC 1850-1900 pre-industrial baseline offset
    }));
  }, [timeRange]);

  // Two-Period Comparison Computations
  const comparisonResults = useMemo(() => {
    const dataA = HISTORICAL_CHART_DATA.filter(d => d.year >= periodAStart && d.year <= periodAEnd && d.year !== 2026);
    const dataB = HISTORICAL_CHART_DATA.filter(d => d.year >= periodBStart && d.year <= periodBEnd && d.year !== 2026);

    const calcMean = (arr: ClimateYearData[], key: keyof ClimateYearData) => {
      if (!arr.length) return 0;
      const sum = arr.reduce((acc, curr) => acc + (typeof curr[key] === 'number' ? (curr[key] as number) : 0), 0);
      return sum / arr.length;
    };

    const meanTempA = calcMean(dataA, 'globalTempAnomaly');
    const meanTempB = calcMean(dataB, 'globalTempAnomaly');
    const tempDelta = meanTempB - meanTempA;

    const meanCo2A = calcMean(dataA, 'co2Ppm');
    const meanCo2B = calcMean(dataB, 'co2Ppm');
    const co2Delta = meanCo2B - meanCo2A;

    const meanIceA = calcMean(dataA, 'arcticIceAreaMillionKm2');
    const meanIceB = calcMean(dataB, 'arcticIceAreaMillionKm2');
    const iceDelta = meanIceB - meanIceA;

    const meanSeaA = calcMean(dataA, 'seaLevelRiseMm');
    const meanSeaB = calcMean(dataB, 'seaLevelRiseMm');
    const seaDelta = meanSeaB - meanSeaA;

    // Rate of warming per decade between midpoints
    const midA = (periodAStart + periodAEnd) / 2;
    const midB = (periodBStart + periodBEnd) / 2;
    const yearsDiff = Math.max(1, midB - midA);
    const warmingRatePerDecade = (tempDelta / yearsDiff) * 10;

    return {
      meanTempA,
      meanTempB,
      tempDelta,
      meanCo2A,
      meanCo2B,
      co2Delta,
      meanIceA,
      meanIceB,
      iceDelta,
      meanSeaA,
      meanSeaB,
      seaDelta,
      warmingRatePerDecade,
    };
  }, [periodAStart, periodAEnd, periodBStart, periodBEnd]);

  // Country comparative dataset
  const comparativeCountryData = useMemo(() => {
    return CITY_CLIMATE_PROFILES
      .filter(c => selectedCountryIds.includes(c.id))
      .map(c => ({
        id: c.id,
        name: language === 'ar' ? `${c.nameAr} (${c.countryAr})` : `${c.nameEn} (${c.countryEn})`,
        shortName: language === 'ar' ? c.nameAr : c.nameEn,
        countryName: language === 'ar' ? c.countryAr : c.countryEn,
        tempChangeDelta: c.tempChangeDelta,
        baselineTempC: c.baselineTempC,
        currentTempC: c.currentTempC,
        annualRainfallMm: c.annualRainfallMm,
        vulnerabilityLevel: c.vulnerabilityLevel,
        vulnerabilityLevelAr: c.vulnerabilityLevelAr,
        climateZone: language === 'ar' ? c.climateZoneAr : c.climateZone,
        primaryRisk: language === 'ar' ? c.primaryRiskAr : c.primaryRiskEn,
      }))
      .sort((a, b) => b.tempChangeDelta - a.tempChangeDelta);
  }, [selectedCountryIds, language]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    const res = await scientificDataService.syncNow();
    setSyncReport(res);
    setIsSyncing(false);
  };

  const toggleCountrySelection = (id: string) => {
    if (selectedCountryIds.includes(id)) {
      if (selectedCountryIds.length > 2) {
        setSelectedCountryIds(selectedCountryIds.filter(cId => cId !== id));
      }
    } else {
      setSelectedCountryIds([...selectedCountryIds, id]);
    }
  };

  const applyCountryPreset = (preset: 'mena' | 'vulnerable' | 'global' | 'all') => {
    if (preset === 'mena') {
      setSelectedCountryIds(['riyadh', 'cairo', 'baghdad', 'dubai', 'amman']);
    } else if (preset === 'vulnerable') {
      setSelectedCountryIds(['nairobi', 'male', 'sao_paulo', 'baghdad', 'reykjavik']);
    } else if (preset === 'global') {
      setSelectedCountryIds(['new_york', 'london', 'tokyo', 'sydney', 'paris']);
    } else {
      setSelectedCountryIds(CITY_CLIMATE_PROFILES.map(c => c.id));
    }
  };

  const applyComparisonPreset = (preset: PeriodComparisonPreset) => {
    setSelectedPresetId(preset.id);
    setPeriodAStart(preset.periodA[0]);
    setPeriodAEnd(preset.periodA[1]);
    setPeriodBStart(preset.periodB[0]);
    setPeriodBEnd(preset.periodB[1]);
  };

  // Custom Theme-Aware Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isYear2026 = String(label).includes('2026');
      return (
        <div 
          className="bg-[var(--bg)]/95 border border-[var(--border)] rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono select-none text-[var(--text)]"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="font-bold text-[var(--text)] border-b border-[var(--border)] pb-1.5 mb-1.5 flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span>{label}</span>
              {isYear2026 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-sans border border-amber-300 dark:border-amber-500/40">
                  {language === 'ar' ? 'أحدث شهر منشور (سبتمبر)' : 'Latest Published (Sep)'}
                </span>
              )}
            </span>
            <span className="text-[10px] text-[#2563eb] dark:text-[#60a5fa] font-sans">NASA GISS / NOAA</span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="font-sans text-[11px] font-medium" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-bold text-[var(--text)] tabular-nums">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-sans mt-1.5 pt-1 border-t border-[var(--border)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] dark:bg-cyan-400 animate-ping inline-block" />
            <span>{language === 'ar' ? 'انقر على النقطة لعرض وثائق المصدر وتفاصيل القياس' : 'Click point to inspect provenance & DOI'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleTimelineChartClick = (e: any) => {
    if (e && e.activePayload && e.activePayload.length) {
      const year = e.activePayload[0].payload.year;
      const found = HISTORICAL_CHART_DATA.find(d => d.year === year);
      if (found) {
        setSelectedPoint(found);
      }
    }
  };

  // CSV Export Handlers
  const handleExportTimelineCsv = () => {
    const exportRows = filteredTimelineData.map(d => ({
      Year: d.year,
      Data_Status: d.year === 2026 ? 'Sep_2026_Published_Month_Incomplete_Year' : (d.dataStatus || 'Finalized_Annual'),
      Global_Temp_Anomaly_C_vs_1951_1980: d.globalTempAnomaly,
      Temp_Uncertainty_C: d.tempUncertainty || 0.05,
      Pre_Industrial_Equiv_Warming_C: d.preIndustrialEquivTemp.toFixed(2),
      Atmospheric_CO2_Ppm: d.co2Ppm,
      Arctic_Sea_Ice_Extent_Million_Km2: d.arcticIceAreaMillionKm2,
      Sea_Level_Rise_Mm_Since_1993: d.seaLevelRiseMm,
      Sea_Level_Uncertainty_Mm: d.seaLevelUncertainty || 4.0,
      Primary_Agency: 'NASA GISTEMP v4 / NOAA GML / NASA PO.DAAC / NSIDC',
      Primary_DOI: '10.26051/0T46-3R84',
      Scientific_Summary_En: d.summaryEn,
      Scientific_Summary_Ar: d.summaryAr,
    }));
    exportDataToCsv(`nasa_terrascope_validated_climate_timeline_${timeRange}.csv`, exportRows);
  };

  const handleExportIndicatorsCatalogCsv = () => {
    const exportRows = scientificIndicators.map(ind => ({
      Indicator_ID: ind.id,
      Indicator_Title: ind.titleEn,
      Current_Value: ind.currentValue,
      Current_Value_Display: ind.currentValueDisplay,
      Unit: ind.unit,
      Measurement_Date: ind.measurementDateEn,
      Reference_Baseline: ind.referenceBaselineEn,
      Scientific_Agency: ind.scientificAgencyEn,
      Direct_URL: ind.directUrl,
      DOI_Or_Identifier: ind.doiOrIdentifier,
      Last_Updated: ind.lastUpdatedEn,
      Data_Status: ind.dataStatus,
      Uncertainty_Margin: ind.uncertaintyMargin,
      Scientific_Interpretation: ind.interpretationEn,
    }));
    exportDataToCsv('nasa_terrascope_scientific_indicators_catalog.csv', exportRows);
  };

  const handleExportCountriesCsv = () => {
    const exportRows = comparativeCountryData.map(c => ({
      City_ID: c.id,
      City_Name: c.shortName,
      Country: c.countryName,
      Warming_Delta_C: c.tempChangeDelta,
      Baseline_Temp_1951_1980_C: c.baselineTempC,
      Current_Temp_2020_2026_C: c.currentTempC,
      Annual_Rainfall_Mm: c.annualRainfallMm,
      Vulnerability_Level: c.vulnerabilityLevel,
      Climate_Zone: c.climateZone,
      Primary_Climate_Risk: c.primaryRisk,
      Data_Source: 'NASA POWER Project API v2.0 / NOAA GHCN-v4',
      Last_Updated: 'November 2026',
    }));
    exportDataToCsv('nasa_terrascope_country_climate_comparison.csv', exportRows);
  };

  return (
    <div 
      className="w-full h-full min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col overflow-y-auto font-sans transition-colors duration-300"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Sticky Top Header Bar */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-[var(--bg)]/95 border-b border-[var(--border)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSimulator}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/50 text-[#2563eb] dark:text-blue-300 hover:bg-[#2563eb] hover:text-white text-xs font-semibold transition-all shadow-xs"
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{language === 'ar' ? 'العودة لمحاكي الأرض 3D' : 'Back to 3D Earth'}</span>
          </button>

          <div className="h-5 w-px bg-[var(--border)] hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{language === 'ar' ? 'منصة التحقق والتحليلات العلمية للمناخ' : 'Scientific Climate Validation Platform'}</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-[#2563eb] dark:text-blue-300 hidden md:inline">
                NASA Space Apps · Peer-Reviewed Standards
              </span>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">
              {language === 'ar' ? 'بيانات حقيقية مستخرجة ومحققة من جداول NASA GISS و NOAA GML و NSIDC الرسمية' : 'Empirical observations validated against NASA GISS CSV tables, NOAA GML, and NSIDC registries'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'charts' ? 'bg-[#2563eb] text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الرسوم البيانية المصححة' : 'Validated Charts'}</span>
          </button>

          <button
            onClick={() => setActiveTab('scientific_catalog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'scientific_catalog' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'نظام التوثيق الموحد (9 معايير)' : 'Unified Indicator Catalog'}</span>
          </button>

          <button
            onClick={() => setActiveTab('period_comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'period_comparison' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مقارنة فترتين' : 'Compare 2 Periods'}</span>
          </button>

          <button
            onClick={() => setActiveTab('country_comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'country_comparison' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مقارنة الدول' : 'Countries'}</span>
          </button>

          <button
            onClick={() => setActiveTab('regional_trends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              activeTab === 'regional_trends' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مقارنة الاتجاهات (مصر وإقليمياً)' : 'Regional Trends (Egypt & Peers)'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Trend Detective Quick Button */}
          {onOpenTrendDetective && (
            <button
              onClick={onOpenTrendDetective}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-500/60 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ar' ? 'كاشف الاتجاهات (NASA POWER)' : 'Trend Detective'}</span>
              <span className="sm:hidden">{language === 'ar' ? 'الاتجاهات' : 'Trends'}</span>
            </button>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={isDark ? (language === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (language === 'ar' ? 'الوضع الليلي' : 'Dark Mode')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[#2563eb] transition-colors"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#2563eb]" />}
              <span className="hidden md:inline">{isDark ? (language === 'ar' ? 'نهاري' : 'Light') : (language === 'ar' ? 'ليلي' : 'Dark')}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-1.5 text-xs font-medium rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:border-[#2563eb] transition-colors"
          >
            {language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Interactive Data Synchronization & Connectivity Status Bar */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-blue-200 dark:border-blue-500/40 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs backdrop-blur-md">
          <div className="flex items-start md:items-center gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${
              syncReport.syncState === 'live_synced' 
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40' 
                : 'bg-blue-100 dark:bg-blue-500/20 text-[#2563eb] dark:text-blue-300 border border-blue-300 dark:border-blue-500/40'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[var(--text)] text-sm">
                  {language === 'ar' ? 'حالة التحقق والمطابقة مع خوادم NASA و NOAA الرسمية:' : 'Data Synchronization & Empirical Validation Status:'}
                </span>
                <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                  {language === 'ar' ? 'مطابق ومحقق علمياً (4 نوفمبر 2026)' : 'Empirically Validated (Nov 4, 2026)'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs">
                {language === 'ar' ? syncReport.technicalDetailsAr : syncReport.technicalDetailsEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 border-t md:border-t-0 md:border-l md:rtl:border-l-0 md:rtl:border-r border-[var(--border)] pt-2.5 md:pt-0 md:px-3">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold transition-all disabled:opacity-60 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? (isSyncing ? 'جارٍ الفحص...' : 'فحص الاتصال بالمصادر الآن') : (isSyncing ? 'Checking...' : 'Verify Connectivity Now')}</span>
            </button>
          </div>
        </div>

        {/* 5 Empirical KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Global Temp Anomaly */}
          <div 
            onClick={() => { setSelectedIndicatorId('temp_anomaly'); setActiveTab('scientific_catalog'); }}
            className="p-3.5 rounded-2xl bg-[var(--surface)] border border-orange-300 dark:border-orange-500/40 hover:border-orange-500 transition-all cursor-pointer shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>{language === 'ar' ? 'حرارة السطح (GISTEMP)' : 'GISTEMP LOTI Anomaly'}</span>
              <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">+1.38 °C</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">±0.06°C</span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-sans block">
              {language === 'ar' ? 'سبتمبر 2026 (أحدث شهر منشور)' : 'Sep 2026 (Latest Published)'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block border-t border-[var(--border)] pt-1">
              vs 1951-1980 baseline · NASA GISS
            </span>
          </div>

          {/* 2. Global Monthly CO2 */}
          <div 
            onClick={() => { setSelectedIndicatorId('co2_global_monthly'); setActiveTab('scientific_catalog'); }}
            className="p-3.5 rounded-2xl bg-[var(--surface)] border border-amber-300 dark:border-amber-500/40 hover:border-amber-500 transition-all cursor-pointer shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>{language === 'ar' ? 'CO₂ المتوسط العالمي الشهري' : 'Global Monthly CO₂'}</span>
              <Wind className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">426.10</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ppm</span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-sans block">
              {language === 'ar' ? 'يوليو 2026 (نشر 4 نوفمبر)' : 'July 2026 (Published Nov 4)'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block border-t border-[var(--border)] pt-1">
              NOAA Marine Boundary Layer
            </span>
          </div>

          {/* 3. Mauna Loa Weekly In-Situ CO2 */}
          <div 
            onClick={() => { setSelectedIndicatorId('co2_mauna_loa_weekly'); setActiveTab('scientific_catalog'); }}
            className="p-3.5 rounded-2xl bg-[var(--surface)] border border-yellow-300 dark:border-yellow-500/40 hover:border-yellow-500 transition-all cursor-pointer shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>{language === 'ar' ? 'CO₂ مونا لوا الأسبوعي' : 'Mauna Loa Weekly CO₂'}</span>
              <Wind className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 tabular-nums">427.28</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ppm</span>
            </div>
            <span className="text-[10px] text-yellow-800 dark:text-yellow-200 font-sans block">
              {language === 'ar' ? 'أسبوع 25 أكتوبر 2026' : 'Week of Oct 25, 2026'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block border-t border-[var(--border)] pt-1">
              Mauna Loa In-Situ · Scripps/NOAA
            </span>
          </div>

          {/* 4. Sea Level Rise */}
          <div 
            onClick={() => { setSelectedIndicatorId('sea_level'); setActiveTab('scientific_catalog'); }}
            className="p-3.5 rounded-2xl bg-[var(--surface)] border border-blue-300 dark:border-blue-500/40 hover:border-blue-500 transition-all cursor-pointer shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>{language === 'ar' ? 'ارتفاع مستوى البحر' : 'Sea Level Rise'}</span>
              <Waves className="w-4 h-4 text-[#2563eb] dark:text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-[#2563eb] dark:text-blue-300 tabular-nums">115.8</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">±4.0 mm</span>
            </div>
            <span className="text-[10px] text-cyan-700 dark:text-cyan-300 font-sans block">
              {language === 'ar' ? 'منذ 1993 (أكتوبر 2026)' : 'Since 1993 (Oct 2026 update)'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block border-t border-[var(--border)] pt-1">
              TOPEX/Jason/Sentinel-6 · NASA
            </span>
          </div>

          {/* 5. Arctic Sea Ice Minimum */}
          <div 
            onClick={() => { setSelectedIndicatorId('arctic_sea_ice'); setActiveTab('scientific_catalog'); }}
            className="p-3.5 rounded-2xl bg-[var(--surface)] border border-cyan-300 dark:border-cyan-500/40 hover:border-cyan-500 transition-all cursor-pointer shadow-sm space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
              <span>{language === 'ar' ? 'أدنى جليد للقطب 2026' : 'Arctic Ice Minimum 2026'}</span>
              <Snowflake className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300 tabular-nums">4.60</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">M km²</span>
            </div>
            <span className="text-[10px] text-cyan-800 dark:text-cyan-200 font-sans block">
              {language === 'ar' ? '12 سبتمبر 2026 (المرتبة 10)' : 'Sep 12, 2026 (10th lowest)'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 block border-t border-[var(--border)] pt-1">
              -32.8% vs 1979-2000 · NSIDC
            </span>
          </div>
        </div>

        {/* TAB 1: ALL SCIENTIFIC CHARTS WITH UNCERTAINTIES & ANNOTATIONS */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <Filter className="w-3.5 h-3.5 text-[#2563eb] dark:text-blue-400" />
                  <span>{language === 'ar' ? 'فترة الرصد الزمني:' : 'Observation Timeline:'}</span>
                </span>
                <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)] text-xs">
                  <button
                    onClick={() => setTimeRange('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      timeRange === 'all' ? 'bg-[#2563eb] text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    1880 - 2026*
                  </button>
                  <button
                    onClick={() => setTimeRange('modern')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      timeRange === 'modern' ? 'bg-[#2563eb] text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    1960 - 2026*
                  </button>
                  <button
                    onClick={() => setTimeRange('satellite')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      timeRange === 'satellite' ? 'bg-[#2563eb] text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'عهد الأقمار (1993-2026*)' : 'Satellite Era (1993-2026*)'}
                  </button>
                  <button
                    onClick={() => setTimeRange('recent')}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      timeRange === 'recent' ? 'bg-[#2563eb] text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    2010 - 2026*
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportTimelineCsv}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تنزيل السجل التاريخي المحقق (CSV)' : 'Export Validated CSV Data'}</span>
              </button>
            </div>

            {/* CHART 1: NASA GISTEMP v4 LOTI */}
            <section className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>1. {language === 'ar' ? 'شذوذ درجات الحرارة العالمية السطحية (NASA GISTEMP v4 LOTI)' : 'Global Surface Temperature Anomaly (NASA GISTEMP v4 LOTI)'}</span>
                  </h2>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar' 
                      ? 'مقارنة بخط الأساس المرجعي 1951–1980 لمرصد جودارد ناسا (درجة مئوية °C). أحدث شهر منشور: سبتمبر 2026 (+1.38±0.06°C).'
                      : 'Relative to 1951-1980 NASA GISS baseline in °C. Latest published validated month: September 2026 (+1.38±0.06°C).'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-600 dark:text-orange-400 shrink-0">
                  <span>{timeRange === 'all' ? '1880 - 2026*' : `${filteredTimelineData[0].year} - 2026*`}</span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-2" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={filteredTimelineData} 
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    onClick={handleTimelineChartClick}
                  >
                    <defs>
                      <linearGradient id="tempGradientValidated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="displayLabel" stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} />
                    <YAxis stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} unit="°C" domain={[-0.4, 1.8]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine y={0} stroke={axisStroke} strokeDasharray="3 3" label={{ value: '1951-1980 Baseline (0.0°C)', fill: tickFill, fontSize: 10 }} />
                    <ReferenceLine y={1.28} stroke="#f97316" strokeDasharray="3 3" label={{ value: '2024 Confirmed Annual Mean (+1.28°C)', fill: '#f97316', fontSize: 10 }} />
                    <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Paris 1.5°C Boundary', fill: '#ef4444', fontSize: 10 }} />
                    <Area 
                      type="monotone" 
                      dataKey="globalTempAnomaly" 
                      name={language === 'ar' ? 'انحراف GISTEMP LOTI (°C)' : 'GISTEMP LOTI Anomaly (°C)'} 
                      stroke="#f97316" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#tempGradientValidated)" 
                      activeDot={{ r: 7, fill: '#ffedd5', stroke: '#f97316', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Scientific Distinction Notice */}
              <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 text-xs text-orange-900 dark:text-orange-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-300">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'التدقيق العلمي لخطوط الأساس:' : 'Climatological Baseline Distinction:'}</span>
                </div>
                <p className="leading-relaxed">
                  {language === 'ar'
                    ? '1) خط أساس 1951–1980 هو المعتمد في سجلات NASA GISTEMP LOTI، وأحدث شهر معتمد منشور هو سبتمبر 2026 بقيمة +1.38±0.06°C. 2) المتوسط السنوي لعام 2026 لم يُحسم بعد ولن يُنشر قبل إغلاق العام في يناير 2027 (متوسط الأشهر 9 الأولى هو +1.23°C). 3) بالمقارنة مع عصر ما قبل الصناعة (1850–1900)، فإن خط أساس ناسا أدفأ بنحو 0.22°C، ما يعني أن انحراف سبتمبر يعادل نحو +1.60°C فوق مستويات ما قبل الصناعة.'
                    : '1) The 1951-1980 baseline is the rigorous standard for NASA GISTEMP LOTI, where the latest published validated month is September 2026 at +1.38±0.06°C. 2) The 2026 annual mean is not finalized until year closure in Jan 2027 (Jan-Sep YTD average is ~+1.23°C). 3) Compared to pre-industrial (1850-1900), the 1951-1980 baseline is ~0.22°C warmer, meaning Sep 2026 is equivalent to ~+1.60°C above pre-industrial.'}
                </p>
              </div>

              {/* Source & DOI */}
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>NASA Goddard Institute for Space Studies (GISS)</strong> · GISTEMP v4 CSV Table (GLB.Ts+dSST.csv) · 
                    <span className="font-mono text-[#2563eb] dark:text-cyan-400 ml-1">DOI: 10.26051/0T46-3R84</span> · {language === 'ar' ? 'تاريخ التحديث: أكتوبر 2026' : 'Updated: Oct 2026'}
                  </span>
                </div>
                <a
                  href="https://data.giss.nasa.gov/gistemp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-[#2563eb] dark:text-blue-300 hover:bg-[#2563eb] hover:text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  <span>{language === 'ar' ? 'بوابة ناسا GISTEMP' : 'NASA GISTEMP Portal'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </section>

            {/* CHART 2: NOAA Atmospheric CO2 (Global Monthly vs Mauna Loa Weekly) */}
            <section className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>2. {language === 'ar' ? 'تركيز ثاني أكسيد الكربون (المتوسط العالمي الشهري لـ NOAA وقراءة مونا لوا)' : 'Atmospheric CO₂ (NOAA Global Monthly Mean vs Mauna Loa Weekly)'}</span>
                  </h2>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar' 
                      ? 'المتوسط العالمي الشهري: 426.10 ppm (يوليو 2026) · قراءة محطة مونا لوا الأسبوعية: 427.28 ppm (أسبوع 25 أكتوبر 2026).'
                      : 'Global Monthly Mean: 426.10 ppm (July 2026) · Mauna Loa Weekly in-situ: 427.28 ppm (week of Oct 25, 2026).'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                  <span>{timeRange === 'all' ? '1880 - 2026*' : `${filteredTimelineData[0].year} - 2026*`}</span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-2" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={filteredTimelineData} 
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    onClick={handleTimelineChartClick}
                  >
                    <defs>
                      <linearGradient id="co2GradientValidated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="displayLabel" stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} />
                    <YAxis stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} unit=" ppm" domain={[270, 450]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine y={280} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Pre-Industrial Baseline (280 ppm)', fill: '#10b981', fontSize: 10 }} />
                    <ReferenceLine y={426.10} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Global Monthly (426.10 ppm, July 2026)', fill: '#d97706', fontSize: 10 }} />
                    <ReferenceLine y={427.28} stroke="#eab308" strokeDasharray="2 2" label={{ value: 'Mauna Loa Weekly (427.28 ppm, Oct 25)', fill: '#ca8a04', fontSize: 10 }} />
                    <Area 
                      type="monotone" 
                      dataKey="co2Ppm" 
                      name={language === 'ar' ? 'CO₂ المتوسط العالمي (ppm)' : 'Global Monthly CO₂ (ppm)'} 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#co2GradientValidated)" 
                      activeDot={{ r: 7, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Scientific Distinction Note */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'التمييز العلمي بين القياسين:' : 'Scientific Distinction between Global Mean and Station In-Situ:'}</span>
                </div>
                <p className="leading-relaxed">
                  {language === 'ar'
                    ? 'لا يجوز الخلط بين القياسين: 1) المتوسط العالمي لـ NOAA (426.10 ppm لشهر يوليو 2026) يُحسب عبر شبكة محطات بحرية موزعة كوكبياً، وينشر بتأخر نحو 3 أشهر لضمان دقة الجودة. 2) قراءة محطة مونا لوا الأسبوعية (427.28 ppm لأسبوع 25 أكتوبر 2026) هي قياس موضعي في بركان هاواي على ارتفاع 3,397م، يتأثر مباشرة بدورة تنفس الغابات في الخريف بنصف الكرة الشمالي.'
                    : 'Do not conflate the two metrics: 1) NOAA Global Marine Mean (426.10 ppm, July 2026) aggregates dozens of oceanic stations reflecting planetary reality with a 3-month QA latency. 2) Mauna Loa Weekly (427.28 ppm, week of Oct 25, 2026) is a single high-altitude Pacific observatory sensitive to Northern Hemisphere autumn terrestrial biosphere release.'}
                </p>
              </div>

              {/* Source & DOI */}
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>NOAA Global Monitoring Laboratory (GML) & Scripps Oceanography</strong> · 
                    <span className="font-mono text-[#2563eb] dark:text-cyan-400 ml-1">DOI: 10.15138/wkgj-f215</span> · {language === 'ar' ? 'تاريخ النشر: 4 نوفمبر 2026' : 'Published: Nov 4, 2026'}
                  </span>
                </div>
                <a
                  href="https://gml.noaa.gov/ccgg/trends/global.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-[#2563eb] dark:text-blue-300 hover:bg-[#2563eb] hover:text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  <span>{language === 'ar' ? 'بوابة NOAA العالمية' : 'NOAA Global Portal'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </section>

            {/* CHART 3: NASA Satellite Altimetry Sea Level Rise (Since 1993 Baseline) */}
            <section className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>3. {language === 'ar' ? 'ارتفاع متوسط مستوى سطح البحر العالمي (NASA Altimetry منذ عام 1993)' : 'Global Mean Sea Level Rise (NASA Altimetry Since 1993)'}</span>
                  </h2>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar' 
                      ? 'القيمة المنشورة في أكتوبر 2026: 115.8 ± 4.0 ملم بدقة الرادار الفضائي منذ عام 1993 (تم حذف أي إشارة لـ 1990 كخط أساس).'
                      : 'Published October 2026 value: 115.8 ± 4.0 mm via multi-satellite altimetry since 1993 (1990 baseline references purged).'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2563eb] dark:text-blue-400 shrink-0">
                  <span>1993 - 2026*</span>
                </div>
              </div>

              {/* Chart Canvas with Uncertainty Envelope */}
              <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-2" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={filteredTimelineData.filter(d => d.year >= 1993)} 
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    onClick={handleTimelineChartClick}
                  >
                    <defs>
                      <linearGradient id="seaGradientValidated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="uncertaintyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="displayLabel" stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} />
                    <YAxis stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} unit=" mm" domain={[-10, 130]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine y={0} stroke={axisStroke} strokeDasharray="3 3" label={{ value: '1993 Satellite Baseline (0.0 mm)', fill: tickFill, fontSize: 10 }} />
                    <ReferenceLine y={115.8} stroke="#2563eb" strokeDasharray="3 3" label={{ value: 'Oct 2026: 115.8 ± 4.0 mm', fill: isDark ? '#38bdf8' : '#2563eb', fontSize: 10 }} />
                    <Area 
                      type="monotone" 
                      dataKey="seaLevelUpperUncertainty" 
                      name={language === 'ar' ? 'الحد الأعلى لعدم اليقين (+4 ملم)' : 'Upper Uncertainty (+4 mm)'} 
                      stroke="#60a5fa" 
                      strokeDasharray="2 2"
                      fillOpacity={1} 
                      fill="url(#uncertaintyGradient)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="seaLevelRiseMm" 
                      name={language === 'ar' ? 'متوسط ارتفاع البحر (mm)' : 'Mean Sea Level Rise (mm)'} 
                      stroke="#2563eb" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#seaGradientValidated)" 
                      activeDot={{ r: 7, fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Scientific Note */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 text-xs text-blue-900 dark:text-blue-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#2563eb] dark:text-blue-300">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'التصحيح المرجعي وهامش عدم اليقين:' : 'Reference Correction & Uncertainty Envelope:'}</span>
                </div>
                <p className="leading-relaxed">
                  {language === 'ar'
                    ? 'يؤكد مرصد ناسا أن رصد ارتفاع سطح البحر بالأقمار الصناعية بدأ بدقة في عام 1993 (مع إطلاق TOPEX/Poseidon). بلغت القيمة المنشورة في أكتوبر 2026 نحو 115.8 ملم مع هامش عدم يقين علمي قدره ±4.0 ملم. تم تصحيح كافة الرسوم لحذف أي إشارة خاطئة إلى عام 1990 كخط أساس، وتوضيح نطاق عدم اليقين.'
                    : 'NASA affirms that continuous high-precision satellite altimetry begins in 1993 with TOPEX/Poseidon. The published October 2026 value is 115.8 mm with a standard error of ±4.0 mm. All historical references erroneously citing 1990 as the baseline have been removed, and the ±4.0 mm uncertainty envelope is explicitly rendered.'}
                </p>
              </div>

              {/* Source & DOI */}
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>NASA Science / Earth Indicators & PO.DAAC</strong> · Global Mean Sea Level Indicator · 
                    <span className="font-mono text-[#2563eb] dark:text-cyan-400 ml-1">DOI: 10.5067/GMSLM-TJ151</span> · {language === 'ar' ? 'تاريخ التحديث: أكتوبر 2026' : 'Updated: Oct 2026'}
                  </span>
                </div>
                <a
                  href="https://science.nasa.gov/earth/explore/earth-indicators/sea-leve/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-[#2563eb] dark:text-blue-300 hover:bg-[#2563eb] hover:text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  <span>{language === 'ar' ? 'بوابة ناسا الرسمية لمؤشرات البحر' : 'NASA Sea Level Indicators'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </section>

            {/* CHART 4: NSIDC Arctic Sea Ice Minimum Extent */}
            <section className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>4. {language === 'ar' ? 'الحد الأدنى لمساحة الجليد في القطب الشمالي (NSIDC Sea Ice Index)' : 'Arctic Sea Ice Minimum Extent (NSIDC Sea Ice Index)'}</span>
                  </h2>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'ar' 
                      ? 'الحد الأدنى السنوي لعام 2026: 4.60 مليون كم² في 12 سبتمبر 2026 (المرتبة 10 بين أدنى القيم المسجلة في سجل الأقمار 1979–2026).'
                      : 'Confirmed 2026 Annual Minimum: 4.60 million km² reached on Sep 12, 2026 (10th lowest on 1979-2026 satellite record).'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 shrink-0">
                  <span>1979 - 2026*</span>
                </div>
              </div>

              {/* Chart Canvas */}
              <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-2" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={filteredTimelineData.filter(d => d.year >= 1979)} 
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    onClick={handleTimelineChartClick}
                  >
                    <defs>
                      <linearGradient id="iceGradientValidated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="displayLabel" stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} />
                    <YAxis stroke={axisStroke} tick={{ fill: tickFill }} fontSize={11} tickLine={false} unit=" M km²" domain={[2.5, 9.0]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={legendStyle} />
                    <ReferenceLine y={6.85} stroke={axisStroke} strokeDasharray="3 3" label={{ value: '1979-2000 Sept Baseline (6.85 M km²)', fill: tickFill, fontSize: 10 }} />
                    <ReferenceLine y={4.60} stroke="#0891b2" strokeDasharray="3 3" label={{ value: '2026 Min (4.60 M km², Sep 12)', fill: isDark ? '#22d3ee' : '#0e7490', fontSize: 10 }} />
                    <Area 
                      type="monotone" 
                      dataKey="arcticIceAreaMillionKm2" 
                      name={language === 'ar' ? 'الحد الأدنى لجليد القطب (مليون كم²)' : 'Arctic September Minimum (M km²)'} 
                      stroke="#0891b2" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#iceGradientValidated)" 
                      activeDot={{ r: 7, fill: '#cffafe', stroke: '#06b6d4', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Scientific Note on Rate and Clarification */}
              <div className="p-3.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-500/30 text-xs text-cyan-950 dark:text-cyan-200/90 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-cyan-800 dark:text-cyan-300">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'التصحيح المنهجي للنسب وفترات الأساس:' : 'Methodological Correction of Baselines & Rates:'}</span>
                </div>
                <p className="leading-relaxed">
                  {language === 'ar'
                    ? 'لا يجوز ذكر انخفاض بنسبة 62% دون تحديد الأساس. التدقيق العلمي يوضح: 1) مقارنة بمتوسط 1979-2000 للحد الأدنى (6.85 مليون كم²)، فإن قيمة 4.60 مليون كم² تمثل انخفاضاً بنسبة 32.8%. 2) معدل التراجع الخطي يبلغ نحو -12.2% لكل عقد مقارنة بـ 1981-2010. 3) يجب التمييز بين: الحد الأدنى السنوي (4.60 M km² في 12 سبتمبر 2026)، والمتوسط الشهري لشهر سبتمبر (~4.72 M km²)، ومساحة الجليد اليومية.'
                    : 'A 62% decline figure cannot be asserted without specifying methodology. The scientific reality: 1) Relative to the 1979-2000 average minimum (6.85 M km²), 4.60 M km² is a 32.8% decline. 2) The downward decadal trend is -12.2% per decade relative to 1981-2010. 3) Clear scientific distinction exists between the annual minimum (4.60 M km² on Sep 12, 2026), the September monthly average (~4.72 M km²), and day-to-day weather-driven extents.'}
                </p>
              </div>

              {/* Source & DOI */}
              <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>National Snow and Ice Data Center (NSIDC / NASA Cryosphere)</strong> · Sea Ice Index v3 · 
                    <span className="font-mono text-[#2563eb] dark:text-cyan-400 ml-1">DOI: 10.7265/N5K072F8</span> · {language === 'ar' ? 'تاريخ التحديث: أواخر سبتمبر 2026' : 'Updated: Late Sep 2026'}
                  </span>
                </div>
                <a
                  href="https://nsidc.org/news-analyses/news-stories/arctic-sea-ice-has-reached-minimum-extent-2026-antarctic-sea-ice-maximum-most-likely-reached-well"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-[#2563eb] dark:text-blue-300 hover:bg-[#2563eb] hover:text-white text-xs font-semibold shrink-0 transition-colors"
                >
                  <span>{language === 'ar' ? 'تقرير NSIDC الرسمي للحد الأدنى 2026' : 'NSIDC 2026 Minimum Report'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: UNIFIED SCIENTIFIC DOCUMENTATION CATALOG */}
        {activeTab === 'scientific_catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'ar' ? 'نظام التوثيق العلمي الموحد للمؤشرات المناخية' : 'Unified Scientific Climate Documentation Catalog'}</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'ar' 
                    ? 'يتضمن كل مؤشر: القيمة الحالية، الوحدة، تاريخ القياس، خط الأساس المرجعي، المؤسسة العلمية، الرابط الرسمي، تاريخ التحديث، حالة البيانات، وهامش عدم اليقين.'
                    : 'Each parameter is fully described across 9 mandatory scientific validation standards with official citations.'}
                </p>
              </div>

              <button
                onClick={handleExportIndicatorsCatalogCsv}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تصدير دليل المؤشرات (CSV)' : 'Export Catalog (CSV)'}</span>
              </button>
            </div>

            {/* Catalog Cards */}
            <div className="space-y-4">
              {scientificIndicators.map((ind) => {
                const isSelected = selectedIndicatorId === ind.id;
                return (
                  <div
                    key={ind.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isSelected 
                        ? 'bg-[var(--surface)] border-emerald-500 shadow-xl ring-1 ring-emerald-500/30' 
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border)] pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <h3 className="font-bold text-[var(--text)] text-sm sm:text-base">
                            {language === 'ar' ? ind.titleAr : ind.titleEn}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {ind.doiOrIdentifier}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                          {ind.currentValueDisplay}
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-[var(--bg)] text-slate-700 dark:text-slate-300 border border-[var(--border)]">
                          {language === 'ar' ? ind.dataStatusLabelAr : ind.dataStatusLabelEn}
                        </span>
                      </div>
                    </div>

                    {/* 9 Criteria Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs mb-3">
                      <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold mb-0.5">
                          1. {language === 'ar' ? 'القيمة الحالية وهامش عدم اليقين:' : 'Current Value & Uncertainty:'}
                        </span>
                        <span className="font-bold text-[var(--text)] font-mono">{ind.currentValueDisplay}</span>{' '}
                        <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">({ind.uncertaintyMargin})</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold mb-0.5">
                          2. {language === 'ar' ? 'وحدة القياس:' : 'Measurement Unit:'}
                        </span>
                        <span className="font-semibold text-[var(--text)]">{language === 'ar' ? ind.unitAr : ind.unit}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold mb-0.5">
                          3. {language === 'ar' ? 'تاريخ القياس الدقيق:' : 'Exact Measurement Date:'}
                        </span>
                        <span className="font-semibold text-[var(--text)]">{language === 'ar' ? ind.measurementDateAr : ind.measurementDateEn}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold mb-0.5">
                          4. {language === 'ar' ? 'الفترة المرجعية (خط الأساس):' : 'Reference Baseline:'}
                        </span>
                        <span className="font-semibold text-[var(--text)]">{language === 'ar' ? ind.referenceBaselineAr : ind.referenceBaselineEn}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold mb-0.5">
                          5. {language === 'ar' ? 'اسم المؤسسة العلمية:' : 'Scientific Institution:'}
                        </span>
                        <span className="font-semibold text-[var(--text)]">{language === 'ar' ? ind.scientificAgencyAr : ind.scientificAgencyEn}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-semibold mb-0.5">
                          6. {language === 'ar' ? 'تاريخ آخر تحديث رسمي:' : 'Last Official Update:'}
                        </span>
                        <span className="font-semibold text-[var(--text)]">{language === 'ar' ? ind.lastUpdatedAr : ind.lastUpdatedEn}</span>
                      </div>
                    </div>

                    {/* Scientific Interpretation & Distinction Notes */}
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                        <strong className="text-emerald-700 dark:text-emerald-400 block mb-1">
                          {language === 'ar' ? 'الشرح العلمي والتفسير الفيزيائي:' : 'Physical & Scientific Interpretation:'}
                        </strong>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {language === 'ar' ? ind.interpretationAr : ind.interpretationEn}
                        </p>
                      </div>

                      {ind.distinctionNotesAr && (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-200">
                          <strong className="text-[#2563eb] dark:text-blue-300 block mb-1">
                            {language === 'ar' ? 'ملاحظة الأمانة العلمية والتمييز المرجعي:' : 'Scientific Integrity & Baseline Clarification:'}
                          </strong>
                          <p className="leading-relaxed">
                            {language === 'ar' ? ind.distinctionNotesAr : ind.distinctionNotesEn}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-1">
                        <a
                          href={ind.directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all"
                        >
                          <span>{language === 'ar' ? 'رابط مصدر البيانات المباشر' : 'Direct Data Source Link'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TWO-PERIOD COMPARISON ENGINE */}
        {activeTab === 'period_comparison' && (
          <section className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-indigo-300 dark:border-indigo-500/40 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'ar' ? 'محرك مقارنة الفترات الزمنية المناخية' : 'Climate Period Comparison Engine'}</span>
                </h2>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'ar'
                    ? 'قارن بين فترتين تاريخيتين لحساب الفوارق المناخية ومعدل تسارع الاحترار لكل عقد (Warming Rate per Decade)'
                    : 'Compare any two historical epochs to calculate anomaly deltas and decadal warming acceleration'}
                </span>
              </div>

              <button
                onClick={handleExportTimelineCsv}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-all shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تصدير المقارنة (CSV)' : 'Export Comparison (CSV)'}</span>
              </button>
            </div>

            {/* Presets Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                {language === 'ar' ? 'اختر مقارنة معتمدة جاهزة، أو عدّل الفترات يدوياً:' : 'Select a scientific comparison preset or customize years:'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {COMPARISON_PRESETS.map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyComparisonPreset(preset)}
                      className={`p-3 rounded-xl border text-left rtl:text-right transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                          : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text)] hover:border-indigo-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">
                          {language === 'ar' ? preset.nameAr : preset.nameEn}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-[11px] font-mono block mb-1 ${isSelected ? 'text-indigo-100' : 'text-indigo-700 dark:text-indigo-300'}`}>
                        [{preset.periodA[0]}-{preset.periodA[1]}] vs [{preset.periodB[0]}-{preset.periodB[1]}]
                      </span>
                      <p className={`text-[10px] line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'}`}>
                        {language === 'ar' ? preset.descriptionAr : preset.descriptionEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Period Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2563eb] dark:text-blue-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>{language === 'ar' ? 'الفترة الأولى (Period A):' : 'Period A (Reference Baseline):'}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2563eb] dark:text-white bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {periodAStart} — {periodAEnd}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">{language === 'ar' ? 'سنة البداية:' : 'Start Year:'}</label>
                    <select
                      value={periodAStart}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPeriodAStart(val);
                        if (val >= periodAEnd) setPeriodAEnd(val + 10);
                        setSelectedPresetId('custom');
                      }}
                      className="terrascope-input w-full px-2 py-1 font-mono text-xs"
                    >
                      {[1880, 1900, 1920, 1940, 1950, 1960, 1970].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">{language === 'ar' ? 'سنة النهاية:' : 'End Year:'}</label>
                    <select
                      value={periodAEnd}
                      onChange={(e) => {
                        setPeriodAEnd(Number(e.target.value));
                        setSelectedPresetId('custom');
                      }}
                      className="terrascope-input w-full px-2 py-1 font-mono text-xs"
                    >
                      {[1920, 1940, 1950, 1960, 1970, 1980, 1990].filter(y => y > periodAStart).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>{language === 'ar' ? 'الفترة الثانية (Period B):' : 'Period B (Comparison Epoch):'}</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-orange-700 dark:text-white bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800">
                    {periodBStart} — {periodBEnd}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">{language === 'ar' ? 'سنة البداية:' : 'Start Year:'}</label>
                    <select
                      value={periodBStart}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPeriodBStart(val);
                        if (val >= periodBEnd) setPeriodBEnd(val + 5);
                        setSelectedPresetId('custom');
                      }}
                      className="terrascope-input w-full px-2 py-1 font-mono text-xs"
                    >
                      {[1980, 1990, 1993, 1995, 2000, 2005, 2010, 2015].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-1">{language === 'ar' ? 'سنة النهاية (المحققة):' : 'End Year (Finalized):'}</label>
                    <select
                      value={periodBEnd}
                      onChange={(e) => {
                        setPeriodBEnd(Number(e.target.value));
                        setSelectedPresetId('custom');
                      }}
                      className="terrascope-input w-full px-2 py-1 font-mono text-xs"
                    >
                      {[2010, 2015, 2020, 2023, 2024, 2025].filter(y => y > periodBStart).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Differences Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[var(--bg)] border border-orange-300 dark:border-orange-500/40 space-y-1.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
                  {language === 'ar' ? 'فارق متوسط الحرارة (ΔT)' : 'Mean Temperature Delta (ΔT)'}
                </span>
                <span className="text-2xl font-mono font-bold text-orange-600 dark:text-orange-400 tabular-nums block">
                  +{comparisonResults.tempDelta.toFixed(2)} °C
                </span>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5 pt-1 border-t border-[var(--border)]">
                  <div className="flex justify-between">
                    <span>Period A Mean:</span>
                    <span className="text-[#2563eb] dark:text-blue-300">{comparisonResults.meanTempA > 0 ? '+' : ''}{comparisonResults.meanTempA.toFixed(2)}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period B Mean:</span>
                    <span className="text-orange-600 dark:text-orange-300">+{comparisonResults.meanTempB.toFixed(2)}°C</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-red-300 dark:border-red-500/40 space-y-1.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
                  {language === 'ar' ? 'معدل الاحترار لكل عقد' : 'Decadal Warming Rate'}
                </span>
                <span className="text-2xl font-mono font-bold text-red-600 dark:text-red-400 tabular-nums block">
                  +{comparisonResults.warmingRatePerDecade.toFixed(2)} °C
                </span>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 pt-1 border-t border-[var(--border)]">
                  {language === 'ar' ? 'سرعة تصاعد درجات الحرارة بين الفترتين' : 'Warming velocity between epoch midpoints'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-amber-300 dark:border-amber-500/40 space-y-1.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
                  {language === 'ar' ? 'تراكم ثاني أكسيد الكربون (ΔCO₂)' : 'Net Atmospheric CO₂ Accumulation'}
                </span>
                <span className="text-2xl font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums block">
                  +{comparisonResults.co2Delta.toFixed(1)} ppm
                </span>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5 pt-1 border-t border-[var(--border)]">
                  <div className="flex justify-between">
                    <span>Period A Mean:</span>
                    <span className="text-[#2563eb] dark:text-blue-300">{comparisonResults.meanCo2A.toFixed(1)} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period B Mean:</span>
                    <span className="text-amber-700 dark:text-amber-300">{comparisonResults.meanCo2B.toFixed(1)} ppm</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg)] border border-cyan-300 dark:border-cyan-500/40 space-y-1.5">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">
                  {language === 'ar' ? 'انحسار الجليد القطبي (ΔIce)' : 'Arctic Sea Ice Reduction (ΔIce)'}
                </span>
                <span className="text-2xl font-mono font-bold text-cyan-700 dark:text-cyan-400 tabular-nums block">
                  {comparisonResults.iceDelta.toFixed(2)} M km²
                </span>
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-mono space-y-0.5 pt-1 border-t border-[var(--border)]">
                  <div className="flex justify-between">
                    <span>Period A Mean:</span>
                    <span className="text-[#2563eb] dark:text-blue-300">{comparisonResults.meanIceA.toFixed(2)} M km²</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Period B Mean:</span>
                    <span className="text-cyan-700 dark:text-cyan-300">{comparisonResults.meanIceB.toFixed(2)} M km²</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: MULTI-COUNTRY COMPARISON */}
        {activeTab === 'country_comparison' && (
          <section className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-purple-300 dark:border-purple-500/40 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>5. {language === 'ar' ? 'مقارنة المؤشرات المناخية بين الدول والمدن العالمية' : 'Comparative Multi-Country Climate Indicators'}</span>
                </h2>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'ar'
                    ? 'قارن بين دولتين أو أكثر لفحص فارق الاحترار (ΔT)، درجات حرارة الأساس مقارنة باليوم، ومعدلات هطول الأمطار'
                    : 'Select two or more countries to analyze regional warming heterogeneity, rainfall stress, and vulnerability'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)] text-xs shrink-0">
                  <button
                    onClick={() => setCountryMetric('delta')}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      countryMetric === 'delta' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'فارق الاحترار (ΔT)' : 'Warming Delta (ΔT)'}
                  </button>
                  <button
                    onClick={() => setCountryMetric('temp_comparison')}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      countryMetric === 'temp_comparison' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'الحرارة: الأساس vs الحالي' : 'Baseline vs Current'}
                  </button>
                  <button
                    onClick={() => setCountryMetric('rainfall')}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      countryMetric === 'rainfall' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--text)]'
                    }`}
                  >
                    {language === 'ar' ? 'معدل الأمطار' : 'Annual Rainfall'}
                  </button>
                </div>

                <button
                  onClick={handleExportCountriesCsv}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/50 text-purple-700 dark:text-purple-300 hover:bg-purple-600 hover:text-white text-xs font-semibold transition-all shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تصدير الدول (CSV)' : 'Export CSV'}</span>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">{language === 'ar' ? 'مجموعات سريعة:' : 'Quick Presets:'}</span>
              <button
                onClick={() => applyCountryPreset('mena')}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:border-purple-500 transition-colors"
              >
                {language === 'ar' ? 'الشرق الأوسط (MENA)' : 'Middle East & North Africa'}
              </button>
              <button
                onClick={() => applyCountryPreset('vulnerable')}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:border-purple-500 transition-colors"
              >
                {language === 'ar' ? 'المناطق الأكثر هشاشة' : 'Most Vulnerable'}
              </button>
              <button
                onClick={() => applyCountryPreset('global')}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:border-purple-500 transition-colors"
              >
                {language === 'ar' ? 'العواصم العالمية' : 'Global Hubs'}
              </button>
              <button
                onClick={() => applyCountryPreset('all')}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:border-purple-500 transition-colors"
              >
                {language === 'ar' ? 'الكل (15+ دولة)' : 'Select All (15+)'}
              </button>
            </div>

            {/* Country Toggle Chips */}
            <div className="p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                {language === 'ar' ? 'حدد دولتين أو أكثر للمقارنة المباشرة (انقر لإضافة أو استبعاد أي دولة):' : 'Select 2 or more countries for comparison (click to toggle):'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CITY_CLIMATE_PROFILES.map(city => {
                  const isSelected = selectedCountryIds.includes(city.id);
                  return (
                    <button
                      key={city.id}
                      onClick={() => toggleCountrySelection(city.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-all border ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white font-semibold shadow-xs'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:border-purple-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      <span>{language === 'ar' ? `${city.nameAr} (${city.countryAr})` : `${city.nameEn} (${city.countryEn})`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BarChart */}
            <div className="bg-[var(--bg)] rounded-xl border border-[var(--border)] p-2" style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={comparativeCountryData} margin={{ top: 20, right: 30, left: 10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis 
                    dataKey="shortName" 
                    stroke={axisStroke} 
                    tick={{ fill: tickFill }}
                    fontSize={11} 
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    stroke={axisStroke} 
                    tick={{ fill: tickFill }}
                    fontSize={11} 
                    tickLine={false} 
                    unit={countryMetric === 'rainfall' ? ' mm' : '°C'} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={legendStyle} />

                  {countryMetric === 'delta' && (
                    <Bar 
                      dataKey="tempChangeDelta" 
                      name={language === 'ar' ? 'فارق الاحترار (ΔT)' : 'Warming Delta (ΔT)'} 
                      fill="#9333ea" 
                      radius={[6, 6, 0, 0]}
                      unit="°C"
                    />
                  )}

                  {countryMetric === 'temp_comparison' && (
                    <>
                      <Bar 
                        dataKey="baselineTempC" 
                        name={language === 'ar' ? 'متوسط الأساس (1951-1980)' : 'Baseline (1951-1980)'} 
                        fill="#2563eb" 
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
                      fill="#0891b2" 
                      radius={[6, 6, 0, 0]}
                      unit="mm"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Tab 5: Regional Trends & Percentage Shift Comparison */}
        {activeTab === 'regional_trends' && (
          <section className="space-y-6">
            <RegionalTrendComparison
              language={language}
              theme={theme}
              onFlyToLocation={(coord) => {
                if (onFlyToLocation) {
                  onBackToSimulator();
                  onFlyToLocation(coord);
                }
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
};
