import React, { useState } from 'react';
import { Download, Smartphone, X, Share2, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallButtonProps {
  language: Language;
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language,
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const isAr = language === 'ar';

  // Hide completely when running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  // On desktop browsers that aren't Android/iOS and haven't fired beforeinstallprompt, keep header uncluttered
  if (!isInstallable && !isIOS && !isAndroid) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // User dismissed or browser blocked prompt; fallback guide remains accessible if needed
      }
      return;
    }
    setShowGuide(true);
  };

  const buttonLabel = isAr
    ? variant === 'card'
      ? 'تثبيت التطبيق على الهاتف (PWA)'
      : 'تثبيت التطبيق'
    : variant === 'card'
      ? 'Install TerraScope App (PWA)'
      : 'Install App';

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-cyan-600 text-white shadow-md hover:opacity-95 active:scale-[0.99] transition-all text-xs font-bold"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-start min-w-0">
              <div className="truncate text-sm">{buttonLabel}</div>
              <div className="text-[11px] font-normal text-blue-100 truncate">
                {isAr
                  ? 'يعمل كتطبيق أندرويد سريع حتى مع ضعف الإنترنت'
                  : 'Runs like a native Android app with offline cache'}
              </div>
            </div>
          </div>
          <Download className="w-5 h-5 shrink-0" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors whitespace-nowrap"
          title={buttonLabel}
          aria-label={buttonLabel}
        >
          <Download className="w-3.5 h-3.5 icon" />
          <span className="hidden sm:inline">{buttonLabel}</span>
          <span className="sm:hidden">{isAr ? 'تثبيت' : 'App'}</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#101827] border border-[#dddddd] dark:border-[#334155] p-5 shadow-2xl text-[#172033] dark:text-[#f8fafc] space-y-3"
            dir={isAr ? 'rtl' : 'ltr'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#2563eb] dark:text-[#60a5fa]" />
                <h3 className="text-sm font-bold">
                  {isIOS
                    ? isAr
                      ? 'تثبيت التطبيق على آيفون / آيباد'
                      : 'Install on iPhone / iPad'
                    : isAr
                      ? 'تثبيت التطبيق على أندرويد'
                      : 'Install on Android'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] text-slate-500 dark:text-slate-300"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2 text-xs leading-relaxed text-[#172033]/90 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">1.</span>
                  <span>
                    {isAr ? (
                      <>
                        اضغط على زر <strong>المشاركة</strong> <Share2 className="inline w-3.5 h-3.5 mx-0.5" /> أسفل متصفح Safari.
                      </>
                    ) : (
                      <>
                        Tap the <strong>Share</strong> button <Share2 className="inline w-3.5 h-3.5 mx-0.5" /> in Safari.
                      </>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">2.</span>
                  <span>
                    {isAr
                      ? 'مرر للأسفل واختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).'
                      : 'Scroll down and tap "Add to Home Screen".'}
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2 text-xs leading-relaxed text-[#172033]/90 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">1.</span>
                  <span>
                    {isAr ? (
                      <>
                        افتح قائمة المتصفح <MoreVertical className="inline w-3.5 h-3.5 mx-0.5" /> أعلى الشاشة في Chrome أو Samsung Internet.
                      </>
                    ) : (
                      <>
                        Open the browser menu <MoreVertical className="inline w-3.5 h-3.5 mx-0.5" /> in Chrome or Samsung Internet.
                      </>
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#2563eb] dark:text-[#60a5fa]">2.</span>
                  <span>
                    {isAr
                      ? 'اختر «تثبيت التطبيق» (Install app) أو «إضافة إلى الشاشة الرئيسية» (Add to Home screen).'
                      : 'Tap "Install app" or "Add to Home screen".'}
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              {isAr ? 'حسناً، فهمت' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
