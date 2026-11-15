/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Climate Impact on Nature & Humanity Guide
 */

import React, { useState } from 'react';
import { 
  X, 
  Waves, 
  HeartPulse, 
  Wheat, 
  Droplet, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { Language } from '../types';
import { CLIMATE_IMPACT_TOPICS } from '../data/nasaOfficialData';
import { translations } from '../i18n';

interface ClimateImpactGuideModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const ClimateImpactGuideModal: React.FC<ClimateImpactGuideModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  const [activeTopicId, setActiveTopicId] = useState<string>('oceans_sea_level');

  if (!isOpen) return null;
  const t = translations[language];

  const activeTopic = CLIMATE_IMPACT_TOPICS.find(tp => tp.id === activeTopicId) || CLIMATE_IMPACT_TOPICS[0];

  const getTopicIcon = (id: string) => {
    switch (id) {
      case 'oceans_sea_level': return <Waves className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'heat_human_health': return <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'food_agriculture': return <Wheat className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'water_scarcity': return <Droplet className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      default: return <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.impactModalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.impactModalSubtitle}
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

        {/* Navigation Tabs Bar */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--surface)]/70 flex items-center gap-1.5 overflow-x-auto">
          {CLIMATE_IMPACT_TOPICS.map(topic => (
            <button
              key={topic.id}
              onClick={() => setActiveTopicId(topic.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTopicId === topic.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              {getTopicIcon(topic.id)}
              <span>{language === 'ar' ? topic.titleAr : topic.titleEn}</span>
            </button>
          ))}
        </div>

        {/* Topic Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed bg-[var(--bg)]">
          {/* Headline Callout */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {language === 'ar' ? activeTopic.categoryAr : activeTopic.category}
            </div>
            <h3 className="text-base font-bold text-[var(--text)]">
              {language === 'ar' ? activeTopic.headlineAr : activeTopic.headlineEn}
            </h3>
          </div>

          {/* Scientific Facts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.keyFacts}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(language === 'ar' ? activeTopic.factsAr : activeTopic.factsEn).map((fact, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {fact}
                </div>
              ))}
            </div>
          </div>

          {/* Direct Impact on Humans */}
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-1.5">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              {t.impactOnSociety}
            </h4>
            <p className="text-xs sm:text-sm text-rose-950 dark:text-slate-200">
              {language === 'ar' ? activeTopic.humanImpactAr : activeTopic.humanImpactEn}
            </p>
          </div>

          {/* Actionable Solutions & Adaptation */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {language === 'ar' ? 'حلول واستراتيجيات التكيف والحد من الأثر:' : 'Actionable Mitigation & Adaptation Solutions:'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {(language === 'ar' ? activeTopic.actionSolutionsAr : activeTopic.actionSolutionsEn).map((sol, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[var(--bg)] p-2.5 rounded-lg border border-[var(--border)]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{sol}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
