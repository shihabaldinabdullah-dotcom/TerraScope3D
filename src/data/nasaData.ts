/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - NASA Earth Observation and Climate Datasets
 */

import { Satellite, ClimateLayerInfo, ClimateYearData } from '../types';

export const SATELLITES: Satellite[] = [
  {
    id: 'landsat-9',
    name: 'Landsat 9',
    nameAr: 'لاندسات 9',
    agency: 'NASA / USGS',
    orbitType: 'Sun-Synchronous Polar',
    orbitTypeAr: 'مدار قطبي متزامن مع الشمس',
    altitudeKm: 705,
    velocityKmS: 7.5,
    inclinationDeg: 98.2,
    launchYear: 2021,
    status: 'operational',
    statusAr: 'يعمل بكفاءة',
    color: '#06B6D4', // laser cyan
    orbitRadius: 2.55,
    orbitSpeed: 0.35,
    orbitInclination: (98.2 * Math.PI) / 180,
    descriptionEn: 'Flagship terrestrial observation satellite continuing a 50+ year legacy of mapping global land use, crop health, urban growth, and water resources.',
    descriptionAr: 'القمر الصناعي الرائد لرصد اليابسة مواصلاً مسيرة تتجاوز 50 عاماً في توثيق استخدامات الأراضي وصحة المحاصيل وتوسع المدن والموارد المائية.',
    instrumentsEn: ['OLI-2 (Operational Land Imager)', 'TIRS-2 (Thermal Infrared Sensor)'],
    instrumentsAr: ['مستشعر تصوير اليابسة OLI-2', 'مستشعر الأشعة تحت الحمراء الحرارية TIRS-2'],
    keyMissionEn: 'Detecting deforestation, tracking agricultural water consumption, and natural disaster recovery.',
    keyMissionAr: 'رصد إزالة الغابات، قياس استهلاك المياه الزراعية، ودعم الاستجابة للكوارث الطبيعية.'
  },
  {
    id: 'sentinel-6',
    name: 'Sentinel-6 Michael Freilich',
    nameAr: 'سينتينل-6 مايكل فرايليك',
    agency: 'NASA / ESA / NOAA / EUMETSAT',
    orbitType: 'Non-Sun-Synchronous',
    orbitTypeAr: 'مدار غير متزامن مع الشمس',
    altitudeKm: 1336,
    velocityKmS: 7.2,
    inclinationDeg: 66.0,
    launchYear: 2020,
    status: 'operational',
    statusAr: 'يعمل بكفاءة',
    color: '#3B82F6', // cobalt blue
    orbitRadius: 2.95,
    orbitSpeed: 0.25,
    orbitInclination: (66.0 * Math.PI) / 180,
    descriptionEn: 'The golden standard for measuring global sea surface height and sea level rise down to millimeter-level precision across all oceans.',
    descriptionAr: 'المعيار الذهبي العالمي لقياس مستوى سطح المحيطات وارتفاع منسوب البحار بدقة تصل للمليمتر عبر جميع محيطات العالم.',
    instrumentsEn: ['Poseidon-4 Radar Altimeter', 'AMR-C Microwave Radiometer', 'GNSS-RO Radio Occultation'],
    instrumentsAr: ['مقياس الارتفاع الراداري بوسيدون-4', 'مقياس إشعاع الميكروويف AMR-C', 'مستقبل الملاحة الراديوية GNSS-RO'],
    keyMissionEn: 'Tracking global sea level rise, predicting hurricane intensification, and ocean current modeling.',
    keyMissionAr: 'تتبع ارتفاع مستوى سطح البحر، والتنبؤ بقوة الأعاصير المدارية، ونمذجة التيارات البحرية.'
  },
  {
    id: 'terra',
    name: 'Terra (EOS AM-1)',
    nameAr: 'تيرا (EOS AM-1)',
    agency: 'NASA EOS Program',
    orbitType: 'Sun-Synchronous Descending',
    orbitTypeAr: 'مدار متزامن مع الشمس صباحي',
    altitudeKm: 705,
    velocityKmS: 7.5,
    inclinationDeg: 98.1,
    launchYear: 1999,
    status: 'active',
    statusAr: 'نشط في المدار',
    color: '#10B981', // emerald green
    orbitRadius: 2.65,
    orbitSpeed: 0.32,
    orbitInclination: (98.1 * Math.PI) / 180,
    descriptionEn: 'The flagship of the Earth Observing System (EOS), observing the interactions among Earth’s atmosphere, land, oceans, and snow/ice.',
    descriptionAr: 'قمر الريادة في منظومة رصد الأرض (EOS) التابعة لناسا، يرصد التفاعل المعقد بين الغلاف الجوي واليابسة والمحيطات والغطاء الجليدي.',
    instrumentsEn: ['MODIS (Moderate Resolution Imaging Spectroradiometer)', 'ASTER', 'CERES', 'MISR', 'MOPITT'],
    instrumentsAr: ['مطياف التصوير المعتدل الدقة MODIS', 'مستشعر ASTER', 'مقياس CERES', 'مستشعر MISR متعدد الزوايا', 'مستشعر MOPITT'],
    keyMissionEn: 'Global vegetation indices (NDVI), atmospheric aerosols, and continuous Earth radiation budget.',
    keyMissionAr: 'حساب مؤشرات الغطاء النباتي (NDVI)، وجزيئات الغلاف الجوي، وميزانية الإشعاع الحراري للأرض.'
  },
  {
    id: 'aqua',
    name: 'Aqua (EOS PM-1)',
    nameAr: 'أكوا (EOS PM-1)',
    agency: 'NASA / JAXA / INPE',
    orbitType: 'Sun-Synchronous Ascending',
    orbitTypeAr: 'مدار متزامن مع الشمس مسائي',
    altitudeKm: 705,
    velocityKmS: 7.5,
    inclinationDeg: 98.2,
    launchYear: 2002,
    status: 'active',
    statusAr: 'نشط في المدار',
    color: '#38BDF8', // light ocean blue
    orbitRadius: 2.75,
    orbitSpeed: 0.31,
    orbitInclination: (98.2 * Math.PI) / 180,
    descriptionEn: 'Dedicated to monitoring Earth’s multifaceted water cycle: evaporation from oceans, water vapor in atmosphere, clouds, precipitation, and sea ice.',
    descriptionAr: 'مخصص لمراقبة دورة المياه المعقدة في الأرض: التبخر من المحيطات، بخار الماء في الغلاف الجوي، الغيوم، هطول الأمطار، والجليد البحري.',
    instrumentsEn: ['AIRS (Atmospheric Infrared Sounder)', 'AMSU-A', 'CERES', 'MODIS'],
    instrumentsAr: ['مسبار الغلاف الجوي تحت الأحمر AIRS', 'وحدة السبر بالميكروويف AMSU-A', 'مستشعر CERES', 'مطياف MODIS'],
    keyMissionEn: 'Comprehensive water vapor distribution, global sea-surface temperatures, and cloud properties.',
    keyMissionAr: 'توزيع بخار الماء في الغلاف الجوي، ودرجات حرارة أسطح المحيطات، وخصائص السحب العالمية.'
  },
  {
    id: 'iss',
    name: 'International Space Station (ISS)',
    nameAr: 'محطة الفضاء الدولية (ISS)',
    agency: 'NASA / ESA / JAXA / CSA / Roscosmos',
    orbitType: 'Low Earth Orbit (LEO)',
    orbitTypeAr: 'مدار أرضي منخفض',
    altitudeKm: 420,
    velocityKmS: 7.66,
    inclinationDeg: 51.6,
    launchYear: 1998,
    status: 'active',
    statusAr: 'مأهولة ونشطة',
    color: '#F59E0B', // amber gold
    orbitRadius: 2.35,
    orbitSpeed: 0.45,
    orbitInclination: (51.6 * Math.PI) / 180,
    descriptionEn: 'The premier microgravity laboratory, also hosting cutting-edge Earth science payloads like ECOSTRESS (plant stress) and GEDI (forest canopy lidar).',
    descriptionAr: 'المختبر المداري الأبرز، الذي يستضيف أيضاً حمولات علمية متقدمة لرصد الأرض مثل ECOSTRESS (إجهاد النباتات) ورادار الليزر GEDI لقياس الغابات.',
    instrumentsEn: ['ECOSTRESS (Thermal Plant Stress)', 'GEDI (Forest Canopy Lidar)', 'DESIS (Hyperspectral Imager)'],
    instrumentsAr: ['مستشعر ECOSTRESS لإجهاد النباتات الحراري', 'جهاز GEDI ليدار لقياس قمم الغابات', 'كاميرا DESIS الفائقة الأطياف'],
    keyMissionEn: 'Hourly agricultural stress monitoring, 3D structural carbon mapping of global forests.',
    keyMissionAr: 'مراقبة إجهاد المحاصيل الزراعية على مدار الساعة، ورسم خرائط ثلاثية الأبعاد لمخزون الكربون في الغابات.'
  }
];

export const CLIMATE_LAYERS: ClimateLayerInfo[] = [
  {
    id: 'none',
    nameEn: 'True Color Earth',
    nameAr: 'الأرض بالألوان الطبيعية',
    unit: 'Reflectance',
    unitAr: 'انعكاس بصري',
    descriptionEn: 'High-fidelity natural rendering of Earth’s landforms, oceans, rivers, and polar ice as seen from space.',
    descriptionAr: 'محاكاة بصرية فائقة الدقة لتضاريس الأرض والمحيطات والغطاء الجليدي كما تبدو للعين البشرية من الفضاء الخارجي.',
    satelliteSource: 'MODIS / Landsat True Color Composite',
    nasaProgram: 'NASA Earth Observatory',
    minScaleLabel: 'Ocean',
    maxScaleLabel: 'Land',
    legendGradient: 'linear-gradient(to right, #0d3b66, #2d6a4f, #d4a373, #f8f9fa)'
  },
  {
    id: 'temp_anomaly',
    nameEn: 'Surface Temperature Anomaly',
    nameAr: 'شذوذ درجات الحرارة السطحية',
    unit: '°C deviation from 1951-1980 baseline',
    unitAr: 'درجة مئوية فارق عن خط الأساس (1951-1980)',
    descriptionEn: 'Displays how much warmer or cooler regions are compared to historical averages, illustrating global warming trends.',
    descriptionAr: 'يُظهر مقدار ارتفاع أو انخفاض درجات الحرارة مقارنة بالمتوسطات التاريخية، مما يبرز اتجاهات الاحتباس الحراري العالمي.',
    satelliteSource: 'NASA GISTEMP & AIRS (Aqua)',
    nasaProgram: 'NASA Goddard Institute for Space Studies',
    minScaleLabel: '-1.5 °C (Cooler)',
    maxScaleLabel: '+3.0 °C (Warmer)',
    legendGradient: 'linear-gradient(to right, #2563eb, #93c5fd, #fef08a, #f97316, #dc2626)'
  },
  {
    id: 'vegetation_ndvi',
    nameEn: 'Normalized Difference Vegetation (NDVI)',
    nameAr: 'مؤشر صحة الغطاء النباتي (NDVI)',
    unit: 'Index (0.0 to 1.0)',
    unitAr: 'مؤشر نسبي (0.0 إلى 1.0)',
    descriptionEn: 'Measures chlorophyll absorption to quantify vegetation density, rainforest health, crop vigor, and drought severity.',
    descriptionAr: 'يقيس امتصاص الكلوروفيل لتحديد كثافة الغطاء النباتي، وصحة الغابات المطيرة، وقوة المحاصيل ومناطق الجفاف الحاد.',
    satelliteSource: 'MODIS (Terra/Aqua) & Landsat OLI',
    nasaProgram: 'NASA Land Processes DAAC',
    minScaleLabel: '0.1 (Barren/Desert)',
    maxScaleLabel: '0.9 (Dense Forest)',
    legendGradient: 'linear-gradient(to right, #d4a373, #e9edc9, #a7c957, #386641, #132a13)'
  },
  {
    id: 'co2_distribution',
    nameEn: 'Atmospheric CO₂ Concentration',
    nameAr: 'تركيز ثاني أكسيد الكربون في الجو',
    unit: 'ppm (Parts Per Million)',
    unitAr: 'جزء في المليون (ppm)',
    descriptionEn: 'Tracks greenhouse gas buildup across northern and southern hemispheres, highlighting industrial emissions and seasonal flux.',
    descriptionAr: 'يتتبع تراكم غازات الاحتباس الحراري في نصفي الكرة الأرضية، مبرزاً انبعاثات الأنشطة الصناعية والتنفس النباتي الموسمي.',
    satelliteSource: 'OCO-2 (Orbiting Carbon Observatory-2)',
    nasaProgram: 'NASA Jet Propulsion Laboratory (JPL)',
    minScaleLabel: '380 ppm',
    maxScaleLabel: '430+ ppm',
    legendGradient: 'linear-gradient(to right, #fef08a, #f59e0b, #ea580c, #7f1d1d)'
  },
  {
    id: 'sea_ice',
    nameEn: 'Polar Sea Ice & Cryosphere Extent',
    nameAr: 'انحسار الجليد في القطب الشمالي',
    unit: 'Million Square Kilometers',
    unitAr: 'مليون كيلومتر مربع',
    descriptionEn: 'Visualizes the historic shrinking of Arctic summer sea ice, a key feedback indicator of the Earth’s climate sensitivity.',
    descriptionAr: 'يصور انحسار الجليد البحري في القطب الشمالي على مر العقود، وهو أحد أبرز المؤشرات على حساسية النظام المناخي لكوكبنا.',
    satelliteSource: 'ICESat-2, AMSR-E/Aqua & Sentinel-3',
    nasaProgram: 'National Snow and Ice Data Center (NSIDC)',
    minScaleLabel: 'Open Ocean (0%)',
    maxScaleLabel: 'Multi-year Pack Ice (100%)',
    legendGradient: 'linear-gradient(to right, #0f172a, #38bdf8, #e0f2fe, #ffffff)'
  },
  {
    id: 'thermal_wildfires',
    nameEn: 'Thermal Anomalies & Wildfire Hotspots',
    nameAr: 'النقاط الحرارية والحرائق النشطة',
    unit: 'Thermal Radiative Power (MW)',
    unitAr: 'الطاقة الإشعاعية الحرارية (ميجاوات)',
    descriptionEn: 'Identifies active forest fires, industrial gas flares, and agricultural burn scars captured by spaceborne thermal infrared sensors.',
    descriptionAr: 'يرصد حرائق الغابات النشطة والانفجارات الحرارية عبر الأشعة تحت الحمراء، مما يساعد في حماية التنوع الحيوي والمجتمعات.',
    satelliteSource: 'NASA FIRMS (VIIRS & MODIS)',
    nasaProgram: 'NASA Applied Sciences Disasters Program',
    minScaleLabel: 'Baseline',
    maxScaleLabel: 'High Intensity Fire',
    legendGradient: 'linear-gradient(to right, #1e293b, #f59e0b, #ef4444, #ffffff)'
  }
];

export const CLIMATE_TIMELINE: ClimateYearData[] = [
  {
    year: 1990,
    globalTempAnomaly: 0.45,
    co2Ppm: 354.2,
    arcticIceAreaMillionKm2: 6.2,
    globalNdviIndex: 0.58,
    activeWildfiresIndex: 0.35,
    seaLevelRiseMm: 0.0,
    summaryEn: 'Early space observation era; IPCC publishes First Assessment Report. Global temperatures begin clear upward trajectory.',
    summaryAr: 'بدايات عهد الرصد الفضائي الرقمي؛ نشر التقرير الأول للهيئة الدولية لتغير المناخ وبداية مسار الصعود الحراري.'
  },
  {
    year: 1995,
    globalTempAnomaly: 0.52,
    co2Ppm: 360.8,
    arcticIceAreaMillionKm2: 6.1,
    globalNdviIndex: 0.57,
    activeWildfiresIndex: 0.38,
    seaLevelRiseMm: 12.5,
    summaryEn: 'Establishment of long-term satellite climate observation protocols. Atmospheric CO₂ exceeds 360 ppm.',
    summaryAr: 'تأسيس بروتوكولات الرصد الفضائي الطويلة المدى للمناخ، وتجاوز تركيز ثاني أكسيد الكربون حاجز 360 جزءاً بالمليون.'
  },
  {
    year: 2000,
    globalTempAnomaly: 0.61,
    co2Ppm: 369.5,
    arcticIceAreaMillionKm2: 5.9,
    globalNdviIndex: 0.56,
    activeWildfiresIndex: 0.42,
    seaLevelRiseMm: 28.0,
    summaryEn: 'Launch of NASA EOS flagship satellites (Terra & Aqua). Earth System Science entering high-precision continuous data era.',
    summaryAr: 'إطلاق قمري ناسا الرائدين (تيرا وأكوا)، ودخول علوم كوكب الأرض حقبة البيانات المتزامنة عالية الدقة.'
  },
  {
    year: 2005,
    globalTempAnomaly: 0.76,
    co2Ppm: 379.8,
    arcticIceAreaMillionKm2: 5.3,
    globalNdviIndex: 0.55,
    activeWildfiresIndex: 0.48,
    seaLevelRiseMm: 44.5,
    summaryEn: 'Accelerated Arctic summer melting observed. Hurricane Katrina highlights oceanic thermal energy feedback.',
    summaryAr: 'رصد تسارع ذوبان الجليد الصيفي في القطب الشمالي، وإعصار كاترينا يبرز أثر الطاقة الحرارية للمحيطات.'
  },
  {
    year: 2010,
    globalTempAnomaly: 0.88,
    co2Ppm: 389.9,
    arcticIceAreaMillionKm2: 4.9,
    globalNdviIndex: 0.54,
    activeWildfiresIndex: 0.52,
    seaLevelRiseMm: 60.2,
    summaryEn: 'Record-setting global heatwaves and Russian forest fires detected simultaneously by space thermal sensors.',
    summaryAr: 'موجات حر قياسية عالمية وحرائق غابات واسعة رصدتها المستشعرات الحرارية الفضائية بدقة غير مسبوقة.'
  },
  {
    year: 2015,
    globalTempAnomaly: 1.05,
    co2Ppm: 400.8,
    arcticIceAreaMillionKm2: 4.4,
    globalNdviIndex: 0.53,
    activeWildfiresIndex: 0.62,
    seaLevelRiseMm: 78.6,
    summaryEn: 'Historic milestone: Global atmospheric CO₂ permanently crosses the symbolic 400 ppm threshold.',
    summaryAr: 'محطة تاريخية: تركيز ثاني أكسيد الكربون العالمي يتجاوز رسمياً حاجز 400 جزء في المليون للمرة الأولى في تاريخ البشرية.'
  },
  {
    year: 2020,
    globalTempAnomaly: 1.25,
    co2Ppm: 414.2,
    arcticIceAreaMillionKm2: 3.8,
    globalNdviIndex: 0.52,
    activeWildfiresIndex: 0.74,
    seaLevelRiseMm: 94.8,
    summaryEn: 'One of the hottest years on record. Severe wildfire seasons across Australia, the Amazon, and Western North America.',
    summaryAr: 'أحد أكثر الأعوام دفئاً في التاريخ؛ مواسم حرائق كارثية في أستراليا والأمازون وغرب أمريكا الشمالية.'
  },
  {
    year: 2023,
    globalTempAnomaly: 1.39,
    co2Ppm: 421.1,
    arcticIceAreaMillionKm2: 3.4,
    globalNdviIndex: 0.51,
    activeWildfiresIndex: 0.85,
    seaLevelRiseMm: 104.2,
    summaryEn: 'Unprecedented sea surface temperature records worldwide; Copernicus and NASA confirm warmest year in 174 years of records.',
    summaryAr: 'أرقام قياسية غير مسبوقة لدرجات حرارة المحيطات؛ وكالتا ناسا وكوبرنيكوس تؤكدان أنه العام الأكثر دفئاً منذ 174 عاماً.'
  },
  {
    year: 2024,
    globalTempAnomaly: 1.28,
    co2Ppm: 423.8,
    arcticIceAreaMillionKm2: 4.28,
    globalNdviIndex: 0.50,
    activeWildfiresIndex: 0.88,
    seaLevelRiseMm: 108.5,
    summaryEn: 'NASA GISTEMP confirmed annual average LOTI of +1.28°C relative to 1951-1980 baseline.',
    summaryAr: 'المتوسط السنوي المعتمد لـ GISTEMP يسجل +1.28°C مقارنة بخط أساس 1951-1980.'
  },
  {
    year: 2025,
    globalTempAnomaly: 1.18,
    co2Ppm: 425.2,
    arcticIceAreaMillionKm2: 4.45,
    globalNdviIndex: 0.50,
    activeWildfiresIndex: 0.89,
    seaLevelRiseMm: 112.1,
    summaryEn: 'NASA GISTEMP confirmed annual average LOTI of +1.18°C relative to 1951-1980 baseline.',
    summaryAr: 'المتوسط السنوي المعتمد لـ GISTEMP لعام 2025 يسجل +1.18°C مقارنة بأساس 1951-1980.'
  },
  {
    year: 2026,
    globalTempAnomaly: 1.38,
    co2Ppm: 426.10,
    arcticIceAreaMillionKm2: 4.60,
    globalNdviIndex: 0.50,
    activeWildfiresIndex: 0.90,
    seaLevelRiseMm: 115.8,
    summaryEn: 'Latest published monthly GISTEMP LOTI (+1.38±0.06°C, Sep 2026), NOAA global monthly CO₂ (426.10 ppm), sea level (115.8±4.0 mm since 1993), and Arctic minimum (4.60 M km² on Sep 12).',
    summaryAr: 'أحدث شهر منشور لـ GISTEMP (+1.38±0.06°C، سبتمبر 2026)، وCO₂ عالمي (426.10 ppm)، ومستوى البحر (115.8±4.0 ملم منذ 1993)، والحد الأدنى للجليد (4.60 مليون كم² في 12 سبتمبر).'
  }
];
