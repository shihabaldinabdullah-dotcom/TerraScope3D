/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * TerraScope 3D - Comprehensive TypeScript Types
 */

export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark';
export type MapViewMode = '3d' | 'osm' | 'satellite';

export type ClimateLayerId = 
  | 'none' 
  | 'temp_anomaly' 
  | 'vegetation_ndvi' 
  | 'co2_distribution' 
  | 'sea_ice' 
  | 'thermal_wildfires';

export type CameraPreset = 'global' | 'satellite' | 'poles' | 'equator' | 'coordinate';

export interface LatLonCoordinate {
  lat: number;
  lon: number;
  name: string;
  display?: string;
  country?: string;
  admin1?: string;
  placeType?: string;
  boundingBox?: [number, number, number, number];
}

export interface Satellite {
  id: string;
  name: string;
  nameAr: string;
  agency: string;
  orbitType: string;
  orbitTypeAr: string;
  altitudeKm: number;
  velocityKmS: number;
  inclinationDeg: number;
  launchYear: number;
  status: 'active' | 'operational';
  statusAr: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  descriptionEn: string;
  descriptionAr: string;
  instrumentsEn: string[];
  instrumentsAr: string[];
  keyMissionEn: string;
  keyMissionAr: string;
}

export interface ClimateLayerInfo {
  id: ClimateLayerId;
  nameEn: string;
  nameAr: string;
  unit: string;
  unitAr: string;
  descriptionEn: string;
  descriptionAr: string;
  satelliteSource: string;
  nasaProgram: string;
  minScaleLabel: string;
  maxScaleLabel: string;
  legendGradient: string;
}

export type ClimateDataStatus = 'historical_finalized' | 'provisional' | 'preliminary_ytd';

export interface ClimateYearData {
  year: number;
  globalTempAnomaly: number;
  tempUncertainty?: number;
  co2Ppm: number;
  co2Uncertainty?: number;
  arcticIceAreaMillionKm2: number;
  globalNdviIndex: number;
  activeWildfiresIndex: number;
  seaLevelRiseMm: number;
  seaLevelUncertainty?: number;
  summaryEn: string;
  summaryAr: string;
  dataStatus?: ClimateDataStatus;
  isYearComplete?: boolean;
  statusLabelAr?: string;
  statusLabelEn?: string;
  primaryDoi?: string;
  sourceAgency?: string;
}

export interface ScientificIndicatorDoc {
  id: 'temp_anomaly' | 'co2_global_monthly' | 'co2_mauna_loa_weekly' | 'sea_level' | 'arctic_sea_ice';
  titleAr: string;
  titleEn: string;
  currentValue: number;
  currentValueDisplay: string;
  unit: string;
  unitAr: string;
  measurementDateAr: string;
  measurementDateEn: string;
  referenceBaselineAr: string;
  referenceBaselineEn: string;
  scientificAgencyAr: string;
  scientificAgencyEn: string;
  directUrl: string;
  doiOrIdentifier: string;
  lastUpdatedAr: string;
  lastUpdatedEn: string;
  dataStatus: 'finalized' | 'provisional' | 'preliminary_incomplete';
  dataStatusLabelAr: string;
  dataStatusLabelEn: string;
  uncertaintyMargin: string;
  interpretationAr: string;
  interpretationEn: string;
  distinctionNotesAr?: string;
  distinctionNotesEn?: string;
}

export interface CityClimateProfile {
  id: string;
  nameEn: string;
  nameAr: string;
  countryEn: string;
  countryAr: string;
  lat: number;
  lon: number;
  baselineTempC: number; // Historical baseline (1951-1980)
  currentTempC: number;  // Current 2020-2026 average
  tempChangeDelta: number; // +°C
  annualRainfallMm: number;
  rainfallTrend: 'decreasing' | 'increasing' | 'unstable';
  rainfallTrendAr: string;
  rainfallTrendEn: string;
  vulnerabilityLevel: 'Moderate' | 'High' | 'Severe' | 'Critical';
  vulnerabilityLevelAr: string;
  primaryRiskEn: string;
  primaryRiskAr: string;
  nasaStationId: string;
  climateZone: string;
  climateZoneAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ClimateHotspot {
  id: string;
  nameEn: string;
  nameAr: string;
  category: 'cryosphere' | 'ocean' | 'forest' | 'arid' | 'coastal';
  categoryAr: string;
  categoryEn: string;
  lat: number;
  lon: number;
  riskRating: 'Critical' | 'Severe' | 'High';
  riskRatingAr: string;
  headlineEn: string;
  headlineAr: string;
  detailsEn: string;
  detailsAr: string;
  nasaObservationEn: string;
  nasaObservationAr: string;
}

export interface OfficialDataSource {
  id: string;
  nameEn: string;
  nameAr: string;
  organization: string;
  datasetName: string;
  timeCoverage: string;
  updateFrequency: string;
  updateFrequencyAr: string;
  lastUpdated: string;
  doiOrIdentifier: string;
  directUrl: string;
  scientificMethodEn: string;
  scientificMethodAr: string;
}

export interface ClimateImpactTopic {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  categoryAr: string;
  headlineEn: string;
  headlineAr: string;
  factsEn: string[];
  factsAr: string[];
  humanImpactEn: string;
  humanImpactAr: string;
  actionSolutionsEn: string[];
  actionSolutionsAr: string[];
}
