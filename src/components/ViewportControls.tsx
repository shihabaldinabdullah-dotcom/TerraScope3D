/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - 3D Viewport Navigation & Camera Controls HUD
 */

import React from 'react';
import {
  Plus,
  Minus,
  Compass,
  Globe,
  Pause,
  Play,
  RefreshCcw,
  LocateFixed,
  Loader2
} from 'lucide-react';
import { CameraPreset, Language } from '../types';
import { translations } from '../i18n';

interface ViewportControlsProps {
  language: Language;
  cameraPreset: CameraPreset;
  isAutoRotating: boolean;
  isLocating?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
  onLocateMe: () => void;
  onSetCameraPreset: (preset: CameraPreset) => void;
}

export const ViewportControls: React.FC<ViewportControlsProps> = ({
  language,
  cameraPreset,
  isAutoRotating,
  isLocating = false,
  onZoomIn,
  onZoomOut,
  onToggleAutoRotate,
  onResetCamera,
  onLocateMe,
  onSetCameraPreset,
}) => {
  const t = translations[language];
  const isAr = language === 'ar';

  return (
    <div
      className={`toolbar absolute top-14 lg:top-3 ${isAr ? 'left-3' : 'right-3'} z-[420] flex flex-col gap-1.5 sm:gap-2 select-none`}
    >
      {/* Zoom, Location & Camera Buttons Stack */}
      <div className="bg-white/95 dark:bg-[#101827]/92 border border-[#dddddd] dark:border-[#334155] rounded-2xl shadow-2xl backdrop-blur-md p-1.5 flex flex-col gap-1 text-[#172033] dark:text-slate-200 transition-colors">
        <button
          type="button"
          onClick={onZoomIn}
          className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] dark:hover:border-[#60a5fa] flex items-center justify-center transition-colors border border-[#dddddd] dark:border-[#334155]"
          title={isAr ? 'تكبير (+)' : 'Zoom In (+)'}
          aria-label={isAr ? 'تكبير' : 'Zoom In'}
        >
          <Plus className="w-4 h-4 icon" />
        </button>

        <button
          type="button"
          onClick={onZoomOut}
          className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] dark:hover:border-[#60a5fa] flex items-center justify-center transition-colors border border-[#dddddd] dark:border-[#334155]"
          title={isAr ? 'تصغير (-)' : 'Zoom Out (-)'}
          aria-label={isAr ? 'تصغير' : 'Zoom Out'}
        >
          <Minus className="w-4 h-4 icon" />
        </button>

        <div className="h-px bg-[#dddddd] dark:bg-[#334155] my-0.5" />

        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#2563eb]/10 dark:bg-blue-500/20 text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb] hover:text-white flex items-center justify-center transition-colors border border-[#2563eb]/40 dark:border-[#60a5fa]/40 disabled:opacity-60"
          title={isAr ? 'تحديد موقعي الحالي' : 'Locate My Position'}
          aria-label={isAr ? 'تحديد موقعي' : 'My Location'}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 icon animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4 icon" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-colors border ${
            isAutoRotating
              ? 'bg-blue-50 dark:bg-blue-600/30 text-[#2563eb] dark:text-blue-300 border-[#2563eb]/50 dark:border-blue-500/40'
              : 'bg-[#f3f4f6] dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-[#dddddd] dark:border-[#334155]'
          }`}
          title={isAutoRotating ? (isAr ? 'إيقاف الدوران التلقائي' : 'Pause Earth Rotation') : (isAr ? 'تشغيل الدوران التلقائي' : 'Auto-Rotate Earth')}
        >
          {isAutoRotating ? <Pause className="w-3.5 h-3.5 icon" /> : <Play className="w-3.5 h-3.5 icon ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={onResetCamera}
          className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] dark:hover:border-[#60a5fa] flex items-center justify-center transition-colors border border-[#dddddd] dark:border-[#334155]"
          title={isAr ? 'إعادة ضبط المنظور' : 'Reset Earth View'}
        >
          <RefreshCcw className="w-3.5 h-3.5 icon" />
        </button>
      </div>

      {/* Preset Perspectives Stack */}
      <div className="bg-white/95 dark:bg-[#101827]/92 border border-[#dddddd] dark:border-[#334155] rounded-2xl shadow-2xl backdrop-blur-md p-1.5 flex flex-col gap-1 text-[#172033] dark:text-slate-200 transition-colors">
        <button
          type="button"
          onClick={() => onSetCameraPreset('global')}
          className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-colors border ${
            cameraPreset === 'global'
              ? 'bg-[#2563eb] text-white border-[#2563eb]'
              : 'bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] border-[#dddddd] dark:border-[#334155]'
          }`}
          title={t.viewGlobal}
        >
          <Globe className="w-4 h-4 icon" />
        </button>

        <button
          type="button"
          onClick={() => onSetCameraPreset('poles')}
          className={`w-9 h-9 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-colors border ${
            cameraPreset === 'poles'
              ? 'bg-[#2563eb] text-white border-[#2563eb]'
              : 'bg-[#f3f4f6] dark:bg-[#1e293b] hover:border-[#2563eb] border-[#dddddd] dark:border-[#334155]'
          }`}
          title={t.viewPoles}
        >
          <Compass className={`w-4 h-4 icon ${cameraPreset === 'poles' ? 'text-white' : 'text-cyan-600 dark:text-cyan-300'}`} />
        </button>
      </div>
    </div>
  );
};
