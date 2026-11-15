/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Comprehensive Student Presentation Kit & Code Architecture Explainer
 * Designed specifically for beginner student teams to understand every line of code
 * and confidently pitch their project to NASA Space Apps Challenge judges.
 */

import React, { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  Code2, 
  Users, 
  Rocket, 
  Database, 
  CheckCircle2, 
  FileCode, 
  ChevronRight, 
  Sparkles,
  Cpu,
  Layers,
  Award
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';

interface CodeExplainerModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExplainerModal: React.FC<CodeExplainerModalProps> = ({
  language,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'code' | 'pitch' | 'future'>('overview');

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
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t.modalTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                {t.modalSubtitle}
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
        <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border)] bg-[var(--surface)]/70 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{t.tabOverview}</span>
          </button>

          <button
            onClick={() => setActiveTab('tech')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tech'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? '2. التقنيات المختارة' : '2. Tech Stack'}</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'code'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{t.tabCode}</span>
          </button>

          <button
            onClick={() => setActiveTab('pitch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'pitch'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabPitch}</span>
          </button>

          <button
            onClick={() => setActiveTab('future')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'future'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-[var(--text)] hover:bg-slate-200/70 dark:hover:bg-slate-800/60'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{t.tabFuture}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm leading-relaxed bg-[var(--bg)]">
          {/* TAB 1: Problem & Solution */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  {t.problemTitle}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  {t.problemDesc}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {t.solutionTitle}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  {t.solutionDesc}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-[var(--text)]">
                  {language === 'ar' ? 'المميزات الرئيسية التي بنيناها في المشروع:' : 'Key Project Highlights Built:'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs block mb-1">
                      {language === 'ar' ? '1. محاكاة 3D تفاعلية كاملة' : '1. Full 3D Interactive Simulation'}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {language === 'ar' 
                        ? 'كوكب أرض ثلاثي الأبعاد مع الغلاف الجوي المتوهج وطبقات الغيوم المتحركة وتتبع الأقمار الصناعية بمدارات حقيقية.'
                        : 'Interactive 3D Earth with atmospheric Rayleigh glow, swirling dynamic clouds, and realistic satellite orbits.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs block mb-1">
                      {language === 'ar' ? '2. خمس طبقات مناخية علمية' : '2. 5 Scientific Climate Layers'}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {language === 'ar'
                        ? 'شذوذ درجات الحرارة (GISTEMP)، صحة الغطاء النباتي (NDVI)، تركيز CO₂، انحسار الجليد القطبي، ومواقع الحرائق النشطة.'
                        : 'Surface temperature anomalies, NDVI vegetation health, atmospheric CO₂ ppm, Arctic sea ice extent, and thermal wildfire hotspots.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-xs block mb-1">
                      {language === 'ar' ? '3. خط زمني تاريخي تفاعلي (1990-2026)' : '3. Historical Climate Time-Lapse (1990-2026)'}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {language === 'ar'
                        ? 'يمكن للحكام سحب شريط السنوات لمشاهدة ذوبان الجليد وتغير مؤشرات الحرارة بشكل مرئي ومتزامن.'
                        : 'Judges can scrub through decades to witness polar ice shrinkage and temperature escalation with synchronized NASA metrics.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="font-bold text-purple-600 dark:text-purple-400 text-xs block mb-1">
                      {language === 'ar' ? '4. ثنائي اللغة بالكامل (عربي / إنجليزي)' : '4. 100% Fully Bilingual (AR / EN)'}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {language === 'ar'
                        ? 'يدعم التبديل الفوري بنقرة واحدة لتمكين الفريق من العرض أمام الحكام المحليين أو الحكام الدوليين لناسا.'
                        : 'Instant one-click switching enables seamless presentations for both local Arabic panels and global international NASA judges.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tech Stack Rationale */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text)] mb-2">
                {language === 'ar' ? 'لماذا اخترنا هذه التقنيات بالتحديد؟' : 'Why We Chose This Tech Stack:'}
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      Three.js & WebGL
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? '(محرك الرسوميات ثلاثية الأبعاد)' : '(3D Graphics Engine)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'مكتبة رائدة تسمح بتشغيل كروت الشاشة (Hardware GPU Acceleration) مباشرة داخل المتصفح بدون تثبيت أي برامج إضافية. كما تدعم ACES Filmic Tone Mapping لإنتاج مظهر سينمائي فضائي واقعي.'
                      : 'Industry-standard WebGL framework running directly on the GPU inside any standard browser with zero plugins. Supports ACES Filmic Tone Mapping for authentic astronomical visualization.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      React 19 & TypeScript
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? '(هيكلية الواجهة وتأمين الكود)' : '(Modern UI Framework & Type Safety)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'تساعدنا في بناء مكونات برمجية مجزأة وسهلة الصيانة (Modular Components)، بينما يمنع TypeScript أي أخطاء إملائية أو برمجية في أسماء المتغيرات والأنواع.'
                      : 'Enables clean modular component architecture, while TypeScript enforces strict type checking preventing runtime typos or missing properties.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      Procedural Canvas Textures
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? '(خوارزميات التوليد الرياضي للخامات)' : '(Algorithmic Texture Synthesis)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'بدلاً من تحميل صور خارجية ضخمة قد تنقطع عن العمل (404) أثناء العرض أمام الحكام، برمجنا خوارزميات ترسم الأرض وأضواء المدن والحرائق عبر الكود مباشرة وبسرعة فائقة.'
                      : 'Instead of relying on fragile external image URLs that fail offline or return 404 errors, our Canvas 2D math algorithms render continents and climate heatmaps dynamically in code.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: How the Code Works (Beginner Breakdown) */}
          {activeTab === 'code' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2">
                  {t.threejsIntroTitle}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">
                  {t.threejsIntroDesc}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-[var(--bg)] border border-[var(--border)]">
                    <span className="font-bold text-amber-600 dark:text-amber-400">1. {t.conceptScene}</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.conceptScene.split(': ')[1]}</p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg)] border border-[var(--border)]">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">2. {t.conceptCamera}</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.conceptCamera.split(': ')[1]}</p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg)] border border-[var(--border)]">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">3. {t.conceptRenderer}</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.conceptRenderer.split(': ')[1]}</p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg)] border border-[var(--border)]">
                    <span className="font-bold text-purple-600 dark:text-purple-400">4. {t.conceptMesh}</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">{t.conceptMesh.split(': ')[1]}</p>
                  </div>
                </div>
              </div>

              {/* Satellite Orbital Math */}
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <h4 className="text-sm font-bold text-cyan-700 dark:text-cyan-300 mb-2">
                  {t.satellitesMathTitle}
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">
                  {t.satellitesMathDesc}
                </p>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-black/60 font-mono text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 mb-2">
                  {t.satellitesMathFormula}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t.satellitesMathNote}
                </p>
              </div>

              {/* File by File Guide */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--text)]">
                  {language === 'ar' ? 'فهرس ملفات المشروع ووظيفة كل ملف:' : 'Project File Guide:'}
                </h4>
                <div className="divide-y divide-[var(--border)] text-xs">
                  <div className="py-2 flex items-start gap-2">
                    <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-semibold text-[var(--text)]">src/components/EarthCanvas.tsx</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {language === 'ar' 
                          ? 'يحتوي على دورة حياة Three.js، رسم كوكب الأرض، الغيوم، الغلاف الجوي، تحريك الأقمار، وحركة الكاميرا.'
                          : 'Encapsulates the Three.js lifecycle, Earth rendering, clouds, atmosphere glow, satellite orbits, and damping.'}
                      </p>
                    </div>
                  </div>

                  <div className="py-2 flex items-start gap-2">
                    <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-semibold text-[var(--text)]">src/utils/textureGenerator.ts</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {language === 'ar'
                          ? 'توليد الخامات الحسابية (القارات، التضاريس، أضواء المدن ليلاً، والطبقات المناخية التفاعلية).'
                          : 'Procedural canvas drawing for Earth base maps, bump relief, city night lights, and climate heatmaps.'}
                      </p>
                    </div>
                  </div>

                  <div className="py-2 flex items-start gap-2">
                    <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-semibold text-[var(--text)]">src/utils/satelliteModelBuilder.ts</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {language === 'ar'
                          ? 'بناء مجسمات الأقمار ثلاثية الأبعاد بـ 6 إلى 8 أجزاء واقعية (ألواح شمسية، هوائيات، رادارات، وطبقة ذهبية).'
                          : 'Assembles realistic 6-8 part procedural satellite groups (solar arrays, parabolic dishes, radar altimeters).'}
                      </p>
                    </div>
                  </div>

                  <div className="py-2 flex items-start gap-2">
                    <FileCode className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-semibold text-[var(--text)]">src/data/nasaData.ts</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {language === 'ar'
                          ? 'قاعدة بيانات الأقمار الصناعية ومواصفاتها، وطبقات المناخ، وسجلات درجات الحرارة وتركيز الكربون من 1990 إلى 2026.'
                          : 'Authoritative NASA satellite parameters, climate layers metadata, and historical 1990-2026 climate time-series.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Pitching to Judges & Team Roles */}
          {activeTab === 'pitch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
                <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 mb-2">
                  {t.teamRolesTitle}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-[var(--bg)] border border-purple-200 dark:border-purple-900/40">
                    <span className="font-bold text-amber-600 dark:text-amber-300 block mb-0.5">
                      {language === 'ar' ? 'العضو الأول (مقدم الفكرة والقصة):' : 'Member 1 (Story & Context):'}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{t.role1.split(': ')[1]}</p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg)] border border-purple-200 dark:border-purple-900/40">
                    <span className="font-bold text-blue-600 dark:text-blue-300 block mb-0.5">
                      {language === 'ar' ? 'العضو الثاني (شارح التقنية والكود):' : 'Member 2 (Architecture & Code):'}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{t.role2.split(': ')[1]}</p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--bg)] border border-purple-200 dark:border-purple-900/40">
                    <span className="font-bold text-emerald-600 dark:text-emerald-300 block mb-0.5">
                      {language === 'ar' ? 'العضو الثالث (محلل البيانات والأثر):' : 'Member 3 (Data Science & Impact):'}
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{t.role3.split(': ')[1]}</p>
                  </div>
                </div>
              </div>

              {/* 4-Minute Pitch Script Formula */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--text)]">
                  {language === 'ar' ? 'الخطة الزمنية المقترحة لعرض الـ 4 دقائق أمام الحكام:' : 'Recommended 4-Minute Presentation Flow:'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-blue-600 dark:text-blue-400 font-mono font-bold block">0:00 - 0:45</span>
                    <span className="font-semibold text-[var(--text)] block my-0.5">
                      {language === 'ar' ? 'المقدمة والمشكلة' : 'Hook & Problem'}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'صعوبة وصول الجمهور لبيانات ناسا المناخية.' : 'Why climate data remains inaccessible.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold block">0:45 - 2:00</span>
                    <span className="font-semibold text-[var(--text)] block my-0.5">
                      {language === 'ar' ? 'استعراض المحاكاة' : 'Live Simulation Demo'}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'تدوير الكوكب وتفعيل طبقات المناخ وتتبع قمر.' : 'Rotate 3D globe, toggle layers, track Landsat.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold block">2:00 - 3:15</span>
                    <span className="font-semibold text-[var(--text)] block my-0.5">
                      {language === 'ar' ? 'تحليل الخط الزمني' : 'Timeline Analysis'}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'سحب السنين من 1990 إلى 2026 وإبراز أثر الاحترار.' : 'Scrub 1990-2026, showing ice decline and CO₂.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-purple-600 dark:text-purple-400 font-mono font-bold block">3:15 - 4:00</span>
                    <span className="font-semibold text-[var(--text)] block my-0.5">
                      {language === 'ar' ? 'الأثر والتطوير القادم' : 'Impact & Roadmap'}
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'كيف سيساعد الطلاب والمجتمع والتوسع القادم.' : 'How it impacts education and future expansion.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Scalability & Future Roadmap */}
          {activeTab === 'future' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[var(--text)] mb-2">
                {t.futureIdeasTitle}
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 border border-blue-300 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-[var(--text)] text-xs mb-0.5">
                      {language === 'ar' ? '1. ربط مباشر مع واجهات ناسا الرسمية (NASA GIBS / CMR API)' : '1. Live NASA GIBS / Earthdata API Integration'}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t.future1}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-[var(--text)] text-xs mb-0.5">
                      {language === 'ar' ? '2. مساعد ذكاء اصطناعي مناخي مدمج (Gemini Climate Assistant)' : '2. Embedded Gemini Climate Resilience Briefs'}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t.future2}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-[var(--text)] text-xs mb-0.5">
                      {language === 'ar' ? '3. محاكاة كوكبية مقارنة (Mars & Venus Atmosphere Comparison)' : '3. Multi-Planetary Atmospheric Comparison'}
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {t.future3}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {language === 'ar' ? 'تحدي NASA Space Apps Challenge 2026' : 'NASA Space Apps Challenge 2026'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            {t.closeModal}
          </button>
        </div>
      </div>
    </div>
  );
};
