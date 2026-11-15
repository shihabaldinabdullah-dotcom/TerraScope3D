/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Official NASA Climate Charts Component
 * Interactive quantitative SVG charts plotting empirical data from NASA GISTEMP v4,
 * NOAA Mauna Loa Keeling curve, NSIDC Sea Ice Index, and Satellite Altimetry.
 */

import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  Calendar, 
  Info, 
  Wind, 
  Snowflake, 
  Waves, 
  Thermometer,
  ShieldCheck
} from 'lucide-react';
import { Language, ThemeMode } from '../types';
import { HISTORICAL_CHART_DATA } from '../data/nasaOfficialData';
import { translations } from '../i18n';

interface ClimateChartsModalProps {
  language: Language;
  theme?: ThemeMode;
  isOpen: boolean;
  onClose: () => void;
}

export const ClimateChartsModal: React.FC<ClimateChartsModalProps> = ({
  language,
  theme = 'dark',
  isOpen,
  onClose,
}) => {
  const [activeChart, setActiveChart] = useState<'temp' | 'co2' | 'ice' | 'sea_level'>('temp');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(HISTORICAL_CHART_DATA.length - 1);

  if (!isOpen) return null;
  const t = translations[language];
  const isDark = theme === 'dark';

  const hoveredData = hoveredIndex !== null ? HISTORICAL_CHART_DATA[hoveredIndex] : HISTORICAL_CHART_DATA[HISTORICAL_CHART_DATA.length - 1];

  // SVG Chart Geometry
  const svgWidth = 720;
  const svgHeight = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  // Compute Scales
  const years = HISTORICAL_CHART_DATA.map(d => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  let values: number[] = [];
  let unit = '';
  let color = '#3b82f6';
  let chartTitle = '';

  if (activeChart === 'temp') {
    values = HISTORICAL_CHART_DATA.map(d => d.globalTempAnomaly);
    unit = '°C';
    color = '#f97316'; // Orange / Red
    chartTitle = language === 'ar' ? 'شذوذ درجات الحرارة العالمية عن خط الأساس (NASA GISTEMP)' : 'Global Temperature Anomaly vs 1951-1980 Baseline (°C)';
  } else if (activeChart === 'co2') {
    values = HISTORICAL_CHART_DATA.map(d => d.co2Ppm);
    unit = 'ppm';
    color = '#eab308'; // Amber / Gold
    chartTitle = language === 'ar' ? 'تركيز ثاني أكسيد الكربون في الغلاف الجوي (مرصد مونا لوا)' : 'Atmospheric CO₂ Concentration at Mauna Loa (ppm)';
  } else if (activeChart === 'ice') {
    values = HISTORICAL_CHART_DATA.map(d => d.arcticIceAreaMillionKm2);
    unit = 'M km²';
    color = isDark ? '#38bdf8' : '#0284c7'; // Cyan
    chartTitle = language === 'ar' ? 'مساحة الجليد البحري في القطب الشمالي (NSIDC)' : 'Arctic September Minimum Sea Ice Extent (Million sq km)';
  } else {
    values = HISTORICAL_CHART_DATA.map(d => d.seaLevelRiseMm);
    unit = 'mm';
    color = isDark ? '#60a5fa' : '#2563eb'; // Blue
    chartTitle = language === 'ar' ? 'ارتفاع متوسط مستوى سطح البحر العالمي (رادار الأقمار)' : 'Global Mean Sea Level Rise from 1990 Baseline (mm)';
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valuePadding = (maxValue - minValue) * 0.1 || 1;
  const yMin = minValue - valuePadding;
  const yMax = maxValue + valuePadding;

  const getX = (year: number) => {
    return padding.left + ((year - minYear) / (maxYear - minYear)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - yMin) / (yMax - yMin)) * innerHeight;
  };

  // Generate SVG path points
  const points = HISTORICAL_CHART_DATA.map((d, i) => `${getX(d.year)},${getY(values[i])}`).join(' ');

  // Zero-line Y for temperature anomaly
  const zeroY = getY(0);
  const svgGridStroke = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(148, 163, 184, 0.35)';
  const svgTickFill = isDark ? '#94a3b8' : '#475569';
  const svgCrosshairStroke = isDark ? '#ffffff' : '#172033';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text)] transition-colors duration-300"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-600/20 border border-orange-300 dark:border-orange-500/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.chartsModalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.chartsModalSubtitle}
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

        {/* Tab Selection */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--surface)]/70 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveChart('temp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeChart === 'temp'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>{t.chartTempTab}</span>
          </button>

          <button
            onClick={() => setActiveChart('co2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeChart === 'co2'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>{t.chartCo2Tab}</span>
          </button>

          <button
            onClick={() => setActiveChart('ice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeChart === 'ice'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{t.chartIceTab}</span>
          </button>

          <button
            onClick={() => setActiveChart('sea_level')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeChart === 'sea_level'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{t.chartSeaLevelTab}</span>
          </button>
        </div>

        {/* Chart Canvas & Hover Telemetry View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg)]">
          {/* Chart Title and Live Hover Values */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text)]">
                {chartTitle}
              </h3>
              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                1880 — 2026 ({HISTORICAL_CHART_DATA.length} Verified Data Points)
              </span>
            </div>

            {hoveredData && (
              <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 rounded-xl font-mono text-xs shrink-0">
                <span className="text-slate-600 dark:text-slate-400 font-bold">{hoveredData.year}:</span>
                <span className="font-bold text-base tabular-nums" style={{ color }}>
                  {activeChart === 'temp' && `+${hoveredData.globalTempAnomaly.toFixed(2)} ${unit}`}
                  {activeChart === 'co2' && `${hoveredData.co2Ppm.toFixed(1)} ${unit}`}
                  {activeChart === 'ice' && `${hoveredData.arcticIceAreaMillionKm2.toFixed(1)} ${unit}`}
                  {activeChart === 'sea_level' && `${hoveredData.seaLevelRiseMm > 0 ? '+' : ''}${hoveredData.seaLevelRiseMm.toFixed(1)} ${unit}`}
                </span>
              </div>
            )}
          </div>

          {/* Responsive SVG Chart */}
          <div className="w-full overflow-x-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-56 sm:h-64 overflow-visible"
            >
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = padding.top + innerHeight * pct;
                const val = yMax - pct * (yMax - yMin);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke={svgGridStroke}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 3}
                      fill={svgTickFill}
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Zero Baseline for Temperature */}
              {activeChart === 'temp' && zeroY >= padding.top && zeroY <= padding.top + innerHeight && (
                <line
                  x1={padding.left}
                  y1={zeroY}
                  x2={svgWidth - padding.right}
                  y2={zeroY}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
              )}

              {/* Gradient Area Fill under curve */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <polygon
                points={`${padding.left},${padding.top + innerHeight} ${points} ${svgWidth - padding.right},${padding.top + innerHeight}`}
                fill="url(#chartGradient)"
              />

              {/* Main Line Stroke */}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points & Interactive Hover Verticals */}
              {HISTORICAL_CHART_DATA.map((d, i) => {
                const cx = getX(d.year);
                const cy = getY(values[i]);
                const isHovered = hoveredIndex === i;

                return (
                  <g 
                    key={d.year}
                    onMouseEnter={() => setHoveredIndex(i)}
                    className="cursor-pointer"
                  >
                    {/* Invisible wider hover hit target */}
                    <rect
                      x={cx - 10}
                      y={padding.top}
                      width={20}
                      height={innerHeight}
                      fill="transparent"
                    />

                    {isHovered && (
                      <line
                        x1={cx}
                        y1={padding.top}
                        x2={cx}
                        y2={padding.top + innerHeight}
                        stroke={svgCrosshairStroke}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.8"
                      />
                    )}

                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5 : 2.5}
                      fill={isHovered ? svgCrosshairStroke : color}
                      stroke={color}
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

              {/* X-axis year ticks */}
              {[1880, 1920, 1960, 1990, 2010, 2026].map(yr => (
                <text
                  key={yr}
                  x={getX(yr)}
                  y={padding.top + innerHeight + 18}
                  fill={svgTickFill}
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {yr}
                </text>
              ))}
            </svg>
          </div>

          {/* Context Note of Hovered Year */}
          {hoveredData && (
            <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text)] block mb-0.5">
                  {hoveredData.year} — {language === 'ar' ? 'سياق الرصد الفضائي والتاريخي:' : 'Observational & Historical Context:'}
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {language === 'ar' ? hoveredData.summaryAr : hoveredData.summaryEn}
                </p>
              </div>
            </div>
          )}

          {/* Provenance Verification Note */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t.sourceNotice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
