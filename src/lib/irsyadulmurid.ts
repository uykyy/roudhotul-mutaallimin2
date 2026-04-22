
/**
 * Ported from lib-hisab-irsyadulmurid (Andi Hasan A / hasanelfalakiy)
 * Implementation of Hisab Irsyadul Murid algorithms.
 */

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export class IrsyadulMurid {
  static getIjtima(month: number, year: number): number {
    const HY = year + ((month * 29.53) / 354.3671);
    const K = Math.round((HY - 1410) * 12);
    const T = K / 1200.0;
    const JD = 2447740.652 + 29.53058868 * K + 0.0001178 * Math.pow(T, 2);
    
    const M = mod(207.9587074 + 29.10535608 * K + -0.0000333 * Math.pow(T, 2), 360);
    const M1 = mod(111.1791307 + 385.81691806 * K + 0.0107306 * Math.pow(T, 2), 360);
    const F = mod(164.2162296 + 390.67050646 * K + -0.0016528 * Math.pow(T, 2), 360);

    const T1 = (0.1734 - 0.000393 * T) * Math.sin(toRadians(M));
    const T2 = 0.0021 * Math.sin(toRadians(2 * M));
    const T3 = -0.4068 * Math.sin(toRadians(M1));
    const T4 = 0.0161 * Math.sin(toRadians(2 * M1));
    const T5 = -0.0004 * Math.sin(toRadians(3 * M1));
    const T6 = 0.0104 * Math.sin(toRadians(2 * F));
    const T7 = -0.0051 * Math.sin(toRadians(M + M1));
    const T8 = -0.0074 * Math.sin(toRadians(M - M1));
    const T9 = 0.0004 * Math.sin(toRadians(2 * F + M));
    const T10 = -0.0004 * Math.sin(toRadians(2 * F - M));
    const T11 = -0.0006 * Math.sin(toRadians(2 * F + M1));
    const T12 = 0.0010 * Math.sin(toRadians(2 * F - M1));
    const T13 = 0.0005 * Math.sin(toRadians(M + 2 * M1));

    const MT = T1 + T2 + T3 + T4 + T5 + T6 + T7 + T8 + T9 + T10 + T11 + T12 + T13;
    return JD + 0.5 + MT;
  }

  static getDataMatahari(Th: number) {
    const S = mod(280.46645 + 36000.76983 * Th, 360);
    const mM = mod(357.52910 + 35999.05030 * Th, 360);
    const N = mod(125.04 - 1934.136 * Th, 360);
    
    const K1 = (17.264 / 3600) * Math.sin(toRadians(N)) + (0.206 / 3600) * Math.sin(toRadians(2 * N));
    const K2 = (-1.264 / 3600) * Math.sin(toRadians(2 * S));
    
    const R1 = (9.23 / 3600) * Math.cos(toRadians(N)) - (0.090 / 3600) * Math.cos(toRadians(2 * N));
    const R2 = (0.548 / 3600) * Math.cos(toRadians(2 * S));
    
    const Q1 = 23.43929111 + R1 + R2 - (46.8150 / 3600) * Th;
    const E = (6898.06 / 3600) * Math.sin(toRadians(mM)) + (72.095 / 3600) * Math.sin(toRadians(2 * mM)) + (0.966 / 3600) * Math.sin(toRadians(3 * mM));
    const S1 = S + E + K1 + K2 - (20.47 / 3600);

    return { mM, K1, K2, Q1, S1 };
  }

  static getDataBulan(Th: number) {
    const M = mod(218.31617 + 481267.88088 * Th, 360);
    const A = mod(134.96292 + 477198.86753 * Th, 360);
    const F = mod(93.27283 + 483202.01873 * Th, 360);
    const D = mod(297.85027 + 445267.11135 * Th, 360);
    
    const T1 = (22640.0 / 3600) * Math.sin(toRadians(A));
    const T2 = (-4586.0 / 3600) * Math.sin(toRadians(A - 2 * D));
    const T3 = (2370.0 / 3600) * Math.sin(toRadians(2 * D));
    const T4 = (769.0 / 3600) * Math.sin(toRadians(2 * A));
    
    const sunData = this.getDataMatahari(Th);
    const mM = sunData.mM;
    
    const T5 = (-668.0 / 3600) * Math.sin(toRadians(mM));
    const T6 = (-412.0 / 3600) * Math.sin(toRadians(2 * F));
    const T7 = (-212.0 / 3600) * Math.sin(toRadians(2 * A - 2 * D));
    const T8 = (-206.0 / 3600) * Math.sin(toRadians(A + mM - 2 * D));
    const T9 = (192.0 / 3600) * Math.sin(toRadians(A + 2 * D));
    const T10 = (-165.0 / 3600) * Math.sin(toRadians(mM - 2 * D));
    const T11 = (148.0 / 3600) * Math.sin(toRadians(A - mM));
    const T12 = (-125.0 / 3600) * Math.sin(toRadians(D));
    const T13 = (-110.0 / 3600) * Math.sin(toRadians(A + mM));
    const T14 = (-55.0 / 3600) * Math.sin(toRadians(2 * F - 2 * D));
    
    const C = T1 + T2 + T3 + T4 + T5 + T6 + T7 + T8 + T9 + T10 + T11 + T12 + T13 + T14;
    const Mo = M + C + sunData.K1 + sunData.K2 - (20.47 / 3600);
    const A1 = A + T2 + T3 + T5;
    const L1 = (18461.0 / 3600) * Math.sin(toRadians(F)) + (1010.0 / 3600) * Math.sin(toRadians(A + F)) + (1000.0 / 3600) * Math.sin(toRadians(A - F)) - (624.0 / 3600) * Math.sin(toRadians(F - 2 * D)) - (199.0 / 3600) * Math.sin(toRadians(A - F - 2 * D)) - (167.0 / 3600) * Math.sin(toRadians(A + F - 2 * D));
    const x = toDegrees(Math.atan(Math.sin(toRadians(Mo)) * Math.tan(toRadians(sunData.Q1))));
    const y = L1 + x;
    
    return { T1, Mo, A1, L1, x, y };
  }

  static calculate(date: Date, lat: number, lon: number, timeZone: number, elevation: number) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    let m = month;
    let y = year;
    if (m < 3) {
      m += 12;
      y -= 1;
    }

    const kBDeci = y + m / 100 + day / 10000;
    const Bh = kBDeci < 1582.1015 ? 0 : 2 - Math.floor(y / 100) + Math.floor(Math.floor(y / 100) / 4);
    
    // We assume maghrib around 18:00 if not calculated yet
    const maghribApprox = 18.0; 
    const JDh = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + ((maghribApprox - timeZone) / 24) + Bh - 1524.5;
    const Th = (JDh - 2451545) / 36525;

    const sun = this.getDataMatahari(Th);
    const moon = this.getDataBulan(Th);

    const dekM = toDegrees(Math.asin(Math.sin(toRadians(sun.S1)) * Math.sin(toRadians(sun.Q1))));
    const PTM = toDegrees(Math.atan(Math.sin(toRadians(sun.S1)) * Math.cos(toRadians(sun.Q1)))); // Simplified? No, tan(S1)*cos(Q1) in original
    const PTMFix = sun.S1 >= 0 && sun.S1 <= 90 ? toDegrees(Math.atan(Math.tan(toRadians(sun.S1)) * Math.cos(toRadians(sun.Q1)))) :
                   sun.S1 <= 270 ? toDegrees(Math.atan(Math.tan(toRadians(sun.S1)) * Math.cos(toRadians(sun.Q1)))) + 180 :
                   toDegrees(Math.atan(Math.tan(toRadians(sun.S1)) * Math.cos(toRadians(sun.Q1)))) + 360;

    const eM = (-1.915 * Math.sin(toRadians(sun.mM)) + -0.02 * Math.sin(toRadians(2 * sun.mM)) + 2.466 * Math.sin(toRadians(2 * sun.S1)) + -0.053 * Math.sin(toRadians(4 * sun.S1))) / 15;
    const sdM = 0.267 / (1 - 0.017 * Math.cos(toRadians(sun.mM)));
    const dip = elevation >= 0 ? (1.76 / 60) * Math.sqrt(elevation) : 0;
    const hSunAtSunset = -(sdM + 0.575 + dip);
    
    const t = toDegrees(Math.acos(-Math.tan(toRadians(lat)) * Math.tan(toRadians(dekM)) + Math.sin(toRadians(hSunAtSunset)) / (Math.cos(toRadians(lat)) * Math.cos(toRadians(dekM)))));
    const AM = toDegrees(Math.atan(-Math.sin(toRadians(lat)) / Math.tan(toRadians(t)) + Math.cos(toRadians(lat)) * Math.tan(toRadians(dekM)) / Math.sin(toRadians(t))));
    const AMUTSB = AM + 270;

    const dekc = toDegrees(Math.asin(Math.sin(toRadians(moon.Mo)) * Math.sin(toRadians(sun.Q1)) * Math.sin(toRadians(moon.y)) / Math.sin(toRadians(moon.x))));
    let PTc = toDegrees(Math.acos(Math.cos(toRadians(moon.Mo)) * Math.cos(toRadians(moon.L1)) / Math.cos(toRadians(dekc))));
    const PTcFix = moon.Mo >= 0 && moon.Mo <= 180 ? PTc : 360 - PTc;
    
    const tc = (PTMFix - PTcFix) + t;
    const altitudeMoon = toDegrees(Math.asin(Math.sin(toRadians(lat)) * Math.sin(toRadians(dekc)) + Math.cos(toRadians(lat)) * Math.cos(toRadians(dekc)) * Math.cos(toRadians(tc))));
    
    const Azc_ = toDegrees(Math.atan(-Math.sin(toRadians(lat)) / Math.tan(toRadians(tc)) + Math.cos(toRadians(lat)) * Math.tan(toRadians(dekc)) / Math.sin(toRadians(tc))));
    const Azc = Azc_ + 270;

    const elongation = toDegrees(Math.acos(Math.cos(toRadians(moon.Mo - sun.S1)) * Math.cos(toRadians(moon.L1))));

    return {
      altitude: altitudeMoon,
      azimuth: Azc,
      sunAltitude: hSunAtSunset,
      sunAzimuth: AMUTSB,
      elongation: elongation,
      moonPhase: (1 + Math.cos(toRadians(toDegrees(Math.acos(-Math.cos(toRadians(elongation))))))) / 2 * 100, // Approximate phase
      moonAge: 0 // Would need WIWD for accurate age
    };
  }
}
