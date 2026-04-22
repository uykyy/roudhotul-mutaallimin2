import * as Astronomy from 'astronomy-engine';
import { IrsyadulMurid } from './irsyadulmurid';

export interface EphemerisData {
  date: Date;
  sunAltitude: number;
  sunAzimuth: number;
  moonAltitude: number;
  moonAzimuth: number;
  moonPhase: number;
  elongation: number;
  moonAge: number; // in days since last new moon
}

export interface IjtimaData {
  time: Date;
  moonAgeAtSunset: number;
}

export type CriteriaType = 'MABIMS' | 'WujudulHilal' | 'LAPAN';
export type AlgorithmType = 'JeanMeeus' | 'IrsyadulMurid';

export interface HilalData {
  altitude: number;
  azimuth: number;
  sunAzimuth: number;
  elongation: number;
  isVisible: boolean;
  criteriaUsed: CriteriaType;
  algorithmUsed: AlgorithmType;
}

export function getEphemeris(date: Date, lat: number, lon: number, algorithm: AlgorithmType = 'JeanMeeus'): EphemerisData {
  if (algorithm === 'IrsyadulMurid') {
    const tz = -new Date().getTimezoneOffset() / 60;
    const irsyad = IrsyadulMurid.calculate(date, lat, lon, tz, 10);
    return {
      date,
      sunAltitude: irsyad.sunAltitude || 0, // Need to make sure I return all fields
      sunAzimuth: irsyad.sunAzimuth,
      moonAltitude: irsyad.altitude,
      moonAzimuth: irsyad.azimuth,
      moonPhase: irsyad.moonPhase,
      elongation: irsyad.elongation,
      moonAge: irsyad.moonAge,
    };
  }
  
  const observer = new Astronomy.Observer(lat, lon, 0);
  // @ts-ignore - astronomy-engine types can be tricky
  const time = Astronomy.MakeTime(date);

  const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, time, observer, true, true);
  const sunHorizon = Astronomy.Horizon(time, observer, sunEquator.ra, sunEquator.dec, 'normal');

  const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, time, observer, true, true);
  const moonHorizon = Astronomy.Horizon(time, observer, moonEquator.ra, moonEquator.dec, 'normal');

  const phase = Astronomy.MoonPhase(time);
  
  // Approximate moon age
  const moonAge = (phase / 360) * 29.53; 

  return {
    date,
    sunAltitude: sunHorizon.altitude,
    sunAzimuth: sunHorizon.azimuth,
    moonAltitude: moonHorizon.altitude,
    moonAzimuth: moonHorizon.azimuth,
    moonPhase: phase,
    elongation: phase > 180 ? 360 - phase : phase,
    moonAge,
  };
}

export function getIjtima(date: Date): Date {
  // @ts-ignore
  const time = Astronomy.MakeTime(date);
  const q = Astronomy.SearchMoonQuarter(time);
  // We want the new moon (quarter 0)
  let nextQ = q;
  for (let i = 0; i < 8; i++) {
    if (nextQ.quarter === 0) return nextQ.time.date;
    // @ts-ignore
    nextQ = Astronomy.NextMoonQuarter(nextQ);
  }
  return q.time.date;
}

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi\'ul Awwal', 'Rabi\'ul Akhir',
  'Jumadil Ula', 'Jumadil Akhira', 'Rajab', 'Sya\'ban',
  'Ramadhan', 'Syawwal', 'Dzulqa\'dah', 'Dzulhijjah'
];

export function getIjtimaByHijri(hMonth: number, hYear: number, algorithm: AlgorithmType = 'JeanMeeus'): Date {
  if (algorithm === 'IrsyadulMurid') {
    const jd = IrsyadulMurid.getIjtima(hMonth, hYear);
    // Convert JD to Date
    const L = jd + 68569;
    const N = Math.floor((4 * L) / 146097);
    const L1 = L - Math.floor((146097 * N + 3) / 4);
    const I = Math.floor((4000 * (L1 + 1)) / 1461001);
    const L2 = L1 - Math.floor((1461 * I) / 4) + 31;
    const J = Math.floor((80 * L2) / 2447);
    const day = L2 - Math.floor((2447 * J) / 80);
    const L3 = Math.floor(J / 11);
    const month = J + 2 - (12 * L3);
    const year = 100 * (N - 49) + I + L3;
    
    const frac = (jd + 0.5) % 1;
    const hours = Math.floor(frac * 24);
    const minutes = Math.floor((frac * 24 - hours) * 60);
    const seconds = Math.floor(((frac * 24 - hours) * 60 - minutes) * 60);

    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  }
  
  // Reference ijtima: 1 Muharram 1446 H is approx 6 July 2024
  // We use the synodic month length: 29.530588 days
  // Total months since 1 Muharram 1446:
  const referenceYear = 1446;
  const totalMonths = (hYear - referenceYear) * 12 + (hMonth - 1);
  const referenceIjtima = new Date('2024-07-06T00:00:00Z');
  
  const estimatedDate = new Date(referenceIjtima.getTime() + totalMonths * 29.530588 * 24 * 60 * 60 * 1000);
  
  // Refine using astronomy-engine
  // @ts-ignore
  const time = Astronomy.MakeTime(estimatedDate);
  const quarter = Astronomy.SearchMoonQuarter(time);
  
  // Quarter 0 is New Moon. SearchMoonQuarter returns the NEXT quarter.
  // We might need to go backwards if the quarter returned is not New Moon.
  let current = quarter;
  // If not new moon (0), find the closest new moon
  // Actually SearchMoonQuarter might return any quarter (0,1,2,3).
  // We want the new moon (0) that is closest to our estimate.
  
  // Better approach: use SearchNewMoon directly if available or loop
  // SearchMoonQuarter returns {time, index} where index 0=New, 1=First, 2=Full, 3=Third
  
  // Simple refinement:
  // @ts-ignore
  const q = Astronomy.SearchMoonQuarter(Astronomy.MakeTime(new Date(estimatedDate.getTime() - 15 * 24 * 60 * 60 * 1000)));
  // Search from 15 days before to find the new moon of that month
  let nextQ = q;
  for (let i = 0; i < 8; i++) {
    if (nextQ.quarter === 0 && Math.abs(nextQ.time.date.getTime() - estimatedDate.getTime()) < 15 * 24 * 60 * 60 * 1000) {
      return nextQ.time.date;
    }
    // @ts-ignore
    nextQ = Astronomy.NextMoonQuarter(nextQ);
  }

  return quarter.time.date;
}

export function getHijriMonthYear(date: Date): { month: number; year: number } {
  // Simple approximate Hijri from Gregorian
  const referenceIjtima = new Date('2024-07-06T00:00:00Z');
  const referenceYear = 1446;
  const daysDiff = (date.getTime() - referenceIjtima.getTime()) / (24 * 60 * 60 * 1000);
  const totalMonths = Math.floor(daysDiff / 29.530588);
  
  let year = referenceYear + Math.floor(totalMonths / 12);
  let month = (totalMonths % 12) + 1;
  if (month <= 0) {
    month += 12;
    year -= 1;
  }
  return { month, year };
}

export function getHilalData(date: Date, lat: number, lon: number, criteria: CriteriaType = 'MABIMS', algorithm: AlgorithmType = 'JeanMeeus'): HilalData {
  if (algorithm === 'IrsyadulMurid') {
    const tz = -new Date().getTimezoneOffset() / 60;
    const irsyad = IrsyadulMurid.calculate(date, lat, lon, tz, 10);
    
    let isVisible = false;
    if (criteria === 'MABIMS') {
      isVisible = irsyad.altitude > 3 && irsyad.elongation > 6.4;
    } else if (criteria === 'WujudulHilal') {
      isVisible = irsyad.altitude > 0;
    } else if (criteria === 'LAPAN') {
      isVisible = irsyad.altitude > 2 && irsyad.elongation > 3;
    }

    return {
      altitude: irsyad.altitude,
      azimuth: irsyad.azimuth,
      sunAzimuth: irsyad.sunAzimuth,
      elongation: irsyad.elongation,
      isVisible,
      criteriaUsed: criteria,
      algorithmUsed: algorithm,
    };
  }

  const observer = new Astronomy.Observer(lat, lon, 0);
  // @ts-ignore
  const time = Astronomy.MakeTime(date);

  const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, time, observer, true, true);
  const sunHorizon = Astronomy.Horizon(time, observer, sunEquator.ra, sunEquator.dec, 'normal');

  const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, time, observer, true, true);
  const moonHorizon = Astronomy.Horizon(time, observer, moonEquator.ra, moonEquator.dec, 'normal');

  const phase = Astronomy.MoonPhase(time);
  const elongation = phase > 180 ? 360 - phase : phase;

  let isVisible = false;
  
  // Logic remains consistent, but we could add algorithm-specific adjustments here
  if (criteria === 'MABIMS') {
    isVisible = moonHorizon.altitude > 3 && elongation > 6.4;
  } else if (criteria === 'WujudulHilal') {
    isVisible = moonHorizon.altitude > 0;
  } else if (criteria === 'LAPAN') {
    isVisible = moonHorizon.altitude > 2 && elongation > 3;
  }

  return {
    altitude: moonHorizon.altitude,
    azimuth: moonHorizon.azimuth,
    sunAzimuth: sunHorizon.azimuth,
    elongation,
    isVisible,
    criteriaUsed: criteria,
    algorithmUsed: algorithm,
  };
      }
