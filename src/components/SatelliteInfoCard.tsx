/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Satellite Telemetry & Mission Payload Card
 */

import React from 'react';
import { X, Radio, Orbit, Activity, ShieldCheck, Target } from 'lucide-react';
import { Language, Satellite } from '../types';
import { translations } from '../i18n';

interface SatelliteInfoCardProps {
  language: Language;
  satellite: Satellite | null;
  onClose: () => void;
}

export const SatelliteInfoCard: React.FC<SatelliteInfoCardProps> = ({
  language,
  satellite,
  onClose,
}) => {
  if (!satellite) return null;
  const t = translations[language];

  return (
    <div
      className={`z-[435] bg-white/95 dark:bg-[#101827]/95 border border-[#dddddd] dark:border-[#334155] rounded-2xl shadow-2xl backdrop-blur-md p-3.5 sm:p-4 text-[#172033] dark:text-[#f8fafc] select-none animate-in fade-in duration-200 md:col-start-2 md:row-start-1 md:self-start transition-colors ${
        language === 'ar' ? 'md:justify-self-end' : 'md:justify-self-start'
      } md:m-3 md:mt-14 md:w-80 lg:w-96 md:max-h-[65%] md:overflow-y-auto fixed bottom-[76px] inset-x-3 md:static max-h-[42vh] overflow-y-auto`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[#dddddd] dark:border-[#334155] pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full shadow-sm"
            style={{ backgroundColor: satellite.color }}
          />
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-white">
              {language === 'ar' ? satellite.nameAr : satellite.name}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {satellite.agency} · {satellite.launchYear}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-[#172033] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#1e293b] transition-colors"
          title="Close telemetry card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Numerical Telemetry Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
            {t.altitude}
          </span>
          <span className="text-xs font-mono font-bold text-[#2563eb] dark:text-blue-300 tabular-nums">
            {satellite.altitudeKm} km
          </span>
        </div>

        <div className="p-2 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
            {t.speed}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {satellite.velocityKmS} km/s
          </span>
        </div>

        <div className="p-2 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] border border-[#dddddd] dark:border-[#334155]">
          <span className="text-[10px] text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
            {t.inclination}
          </span>
          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums">
            {satellite.inclinationDeg}°
          </span>
        </div>
      </div>

      {/* Mission Description */}
      <div className="space-y-2.5 text-xs">
        <div>
          <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium block mb-0.5">
            {t.mission}
          </span>
          <p className="text-[#172033] dark:text-slate-200 leading-relaxed bg-[#f3f4f6] dark:bg-[#1e293b]/70 p-2 rounded border border-[#dddddd] dark:border-[#334155]">
            {language === 'ar' ? satellite.keyMissionAr : satellite.keyMissionEn}
          </p>
        </div>

        {/* Instruments / Sensor Payload */}
        <div>
          <span className="text-slate-600 dark:text-slate-400 text-[11px] font-medium block mb-1">
            {t.instruments}
          </span>
          <ul className="space-y-1">
            {(language === 'ar' ? satellite.instrumentsAr : satellite.instrumentsEn).map((inst, idx) => (
              <li
                key={idx}
                className="flex items-center gap-1.5 text-[11px] text-[#172033] dark:text-slate-200 bg-[#f3f4f6] dark:bg-[#1e293b] px-2 py-1 rounded border border-[#dddddd] dark:border-[#334155]"
              >
                <Radio className="w-3 h-3 text-[#2563eb] dark:text-[#60a5fa] shrink-0" />
                <span className="truncate">{inst}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
