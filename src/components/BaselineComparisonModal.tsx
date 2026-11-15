/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Historical Baseline vs Current Comparison Modal
 */

import React from 'react';
import { X, ArrowRight, TrendingUp, History, Compass, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';

interface BaselineComparisonModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const BaselineComparisonModal: React.FC<BaselineComparisonModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const comparisonRows = [
    {
      metricEn: 'Atmospheric Carbon Dioxide (CO₂)',
      metricAr: 'تركيز ثاني أكسيد الكربون في الجو',
      preIndustrial: '280.0 ppm',
      nasaBaseline: '320.0 ppm',
      year1990: '354.2 ppm',
      current2026: '426.5 ppm',
      delta: '+146.5 ppm (+52%)',
      impactEn: 'Highest concentration in over 3 million years (Pliocene epoch).',
      impactAr: 'أعلى تركيز في تاريخ الكوكب منذ أكثر من 3 ملايين عام (العصر البليوسيني).'
    },
    {
      metricEn: 'Global Surface Temperature Anomaly',
      metricAr: 'شذوذ درجات الحرارة العالمية السطحية',
      preIndustrial: '0.00 °C (Reference)',
      nasaBaseline: '+0.03 °C',
      year1990: '+0.45 °C',
      current2026: '+1.48 °C',
      delta: '+1.48 °C',
      impactEn: 'Approaching the critical 1.5°C Paris Agreement treaty threshold.',
      impactAr: 'ملامسة عتبة 1.5 درجة مئوية الحرجة المنصوص عليها في اتفاقية باريس للمناخ.'
    },
    {
      metricEn: 'Arctic Summer Sea Ice Extent (September)',
      metricAr: 'مساحة الجليد الصيفي بالقطب الشمالي',
      preIndustrial: '~8.5 M km²',
      nasaBaseline: '~7.6 M km²',
      year1990: '6.2 M km²',
      current2026: '3.2 M km²',
      delta: '-5.3 M km² (-62%)',
      impactEn: 'More than 60% of summer ice volume lost; polar amplification in overdrive.',
      impactAr: 'فقدان أكثر من 60% من مساحة الجليد الصيفي؛ وتسارع غير مسبوق في الاحترار القطبي.'
    },
    {
      metricEn: 'Global Mean Sea Level Change',
      metricAr: 'متوسط ارتفاع مستوى مياه البحار العالمية',
      preIndustrial: '-230 mm',
      nasaBaseline: '-50 mm',
      year1990: '0.0 mm (Baseline)',
      current2026: '+112.4 mm',
      delta: '+112.4 mm since 1990',
      impactEn: 'Rate has accelerated from 1.4 mm/yr to 4.4 mm/yr currently.',
      impactAr: 'تسارع معدل الارتفاع من 1.4 ملم سنوياً إلى 4.4 ملم سنوياً بفعل ذوبان الصفائح.'
    },
    {
      metricEn: 'Active Extreme Wildfire Occurrence',
      metricAr: 'وتيرة حرائق الغابات الاستثنائية العالمية',
      preIndustrial: 'Natural baseline',
      nasaBaseline: 'Occasional peaks',
      year1990: 'Moderate intensity',
      current2026: 'Record severity',
      delta: '+150% in fire season length',
      impactEn: 'Wildfire season now extends ~40 days longer globally.',
      impactAr: 'موسم الحرائق العالمي أصبح أطول بنحو 40 يوماً مقارنة بسبعينيات القرن الماضي.'
    }
  ];

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
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.compareModalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.compareModalSubtitle}
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

        {/* 4 Landmark Eras KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 border-b border-[var(--border)] bg-[var(--surface)]/70 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {t.periodPreIndustrial}
            </span>
            <span className="font-mono font-bold text-[var(--text)] text-sm block">280 ppm CO₂</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">0.0 °C Anomaly</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {t.periodMidCentury}
            </span>
            <span className="font-mono font-bold text-[var(--text)] text-sm block">320 ppm CO₂</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">+0.03 °C Anomaly</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {t.period1990}
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-300 text-sm block">354 ppm CO₂</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">+0.45 °C Anomaly</span>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-700/60">
            <span className="text-[10px] text-orange-700 dark:text-orange-300 uppercase tracking-wider block mb-1 font-bold">
              {t.periodCurrent}
            </span>
            <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-sm block">426.5 ppm CO₂</span>
            <span className="text-[11px] text-orange-700 dark:text-orange-300 font-bold">+1.48 °C Anomaly</span>
          </div>
        </div>

        {/* Comparative Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg)]">
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]/50">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-slate-600 dark:text-slate-400 font-medium">
                  <th className="p-3">{t.indicator}</th>
                  <th className="p-3">1850-1900</th>
                  <th className="p-3">1951-1980</th>
                  <th className="p-3">1990</th>
                  <th className="p-3 text-orange-600 dark:text-orange-400 font-bold">2026</th>
                  <th className="p-3 text-red-600 dark:text-red-300 font-bold">{t.changeVsPreIndustrial}</th>
                  <th className="p-3 hidden sm:table-cell">{t.scientificSignificance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="p-3 font-semibold text-[var(--text)]">
                      {language === 'ar' ? row.metricAr : row.metricEn}
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{row.preIndustrial}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{row.nasaBaseline}</td>
                    <td className="p-3 font-mono text-amber-700 dark:text-amber-300/80">{row.year1990}</td>
                    <td className="p-3 font-mono font-bold text-orange-600 dark:text-orange-400">{row.current2026}</td>
                    <td className="p-3 font-mono font-bold text-red-600 dark:text-red-400">{row.delta}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      {language === 'ar' ? row.impactAr : row.impactEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
