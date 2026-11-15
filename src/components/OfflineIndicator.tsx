import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../types';

interface OfflineIndicatorProps {
  language: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const isOnline = useOnlineStatus();
  const isAr = language === 'ar';

  if (isOnline) return null;

  return (
    <div
      role="status"
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed bottom-[76px] md:bottom-4 left-3 right-3 md:left-4 md:right-auto z-[900] flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/50"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span className="truncate">
        {isAr
          ? 'وضع عدم الاتصال — يتم استخدام البيانات والخرائط المخزنة مؤقتاً.'
          : 'Offline Mode — Cached climate data & tiles are active.'}
      </span>
    </div>
  );
};
