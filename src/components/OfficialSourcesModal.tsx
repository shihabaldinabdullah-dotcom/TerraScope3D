/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Official NASA & NOAA Scientific Sources Catalog
 */

import React from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Database, 
  Calendar, 
  Clock, 
  FileText,
  Building
} from 'lucide-react';
import { Language } from '../types';
import { OFFICIAL_DATA_SOURCES } from '../data/nasaOfficialData';
import { translations } from '../i18n';

interface OfficialSourcesModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialSourcesModal: React.FC<OfficialSourcesModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text)] transition-colors duration-300"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-blue-600/20 border border-emerald-300 dark:border-blue-500/40 flex items-center justify-center text-emerald-600 dark:text-blue-400">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.sourcesModalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.sourcesModalSubtitle}
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

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg)]">
          <div className="grid grid-cols-1 gap-4">
            {OFFICIAL_DATA_SOURCES.map(source => (
              <div 
                key={source.id} 
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text)]">
                      {language === 'ar' ? source.nameAr : source.nameEn}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 font-medium mt-0.5">
                      <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{source.organization}</span>
                    </div>
                  </div>

                  <a
                    href={source.directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold transition-colors shrink-0"
                  >
                    <span>{t.visitSource}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Metadata Pills Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.datasetCoverage}:</span>
                      <span className="text-[var(--text)] font-mono text-[11px]">{source.timeCoverage}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.updateFrequency}:</span>
                      <span className="text-[var(--text)] text-[11px]">{language === 'ar' ? source.updateFrequencyAr : source.updateFrequency}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.lastVerified}:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">{source.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                {/* Methodology & DOI */}
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-[var(--bg)] p-3 rounded-lg border border-[var(--border)] leading-relaxed">
                  <span className="font-bold text-[var(--text)] block mb-0.5">{t.methodology}:</span>
                  <p>{language === 'ar' ? source.scientificMethodAr : source.scientificMethodEn}</p>
                  <div className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {source.doiOrIdentifier}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
