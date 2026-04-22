/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Compass, 
  Calendar as CalendarIcon, 
  MapPin, 
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Settings,
  Navigation
} from 'lucide-react';
import { format, addDays, subDays, startOfDay, getYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { getEphemeris, getIjtima, getHilalData, getIjtimaByHijri, getHijriMonthYear, HIJRI_MONTHS, CriteriaType, AlgorithmType } from './lib/astronomy';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lon: number }>({ lat: -6.2088, lon: 106.8456 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [criteria, setCriteria] = useState<CriteriaType>('MABIMS');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('JeanMeeus');
  const [hMonth, setHMonth] = useState(9); // Default Ramadhan
  const [hYear, setHYear] = useState(1447);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [tempLat, setTempLat] = useState("-6.2088");
  const [tempLon, setTempLon] = useState("106.8456");

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(newLoc);
          setTempLat(newLoc.lat.toString());
          setTempLon(newLoc.lon.toString());
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setLoading(false);
          setError("Akses lokasi ditolak. Menggunakan lokasi default: Jakarta.");
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const ephemeris = useMemo(() => {
    return getEphemeris(date, location.lat, location.lon, algorithm);
  }, [date, location, algorithm]);

  const ijtima = useMemo(() => {
    return getIjtima(date);
  }, [date]);

  const hilal = useMemo(() => {
    const sunsetDate = new Date(date);
    sunsetDate.setHours(18, 0, 0, 0);
    return getHilalData(sunsetDate, location.lat, location.lon, criteria, algorithm);
  }, [date, location, criteria, algorithm]);

  useEffect(() => {
    if (isAutoSync) {
      const ijtimaDate = getIjtimaByHijri(hMonth, hYear, algorithm);
      setDate(ijtimaDate);
    }
  }, [hMonth, hYear, algorithm]);

  const handleGregorianChange = (newDate: Date) => {
    setIsAutoSync(false);
    setDate(newDate);
    const hData = getHijriMonthYear(newDate);
    setHMonth(hData.month);
    setHYear(hData.year);
    // Allow auto sync again after a short delay or just keep it off while interacting
    setTimeout(() => setIsAutoSync(true), 100);
  };

  const handleLocationUpdate = () => {
    const lat = parseFloat(tempLat);
    const lon = parseFloat(tempLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setLocation({ lat, lon });
      setIsSettingOpen(false);
    } else {
      setError("Koordinat tidak valid.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-accent" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-white selection:bg-accent/30">
      {/* Top Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
            <Moon className="w-6 h-6 text-accent fill-accent/20" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Falaq Roudhotul Mutaallimin 2</h1>
            <p className="label-micro text-accent/70">Astronomi Presisi & Perhitungan Hilal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSettingOpen(!isSettingOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono hidden md:inline">Pengaturan</span>
          </button>
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono">
              {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
            </span>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card/50 border-b border-white/10 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="label-micro flex items-center gap-2"><Navigation className="w-3 h-3"/> Lokasi Custom</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-text-dim block mb-1">Lintang (Latitude)</label>
                    <input 
                      type="text" 
                      value={tempLat}
                      onChange={(e) => setTempLat(e.target.value)}
                      className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-dim block mb-1">Bujur (Longitude)</label>
                    <input 
                      type="text" 
                      value={tempLon}
                      onChange={(e) => setTempLon(e.target.value)}
                      className="w-full bg-bg border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:border-accent outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleLocationUpdate}
                  className="w-full bg-accent text-bg font-bold py-2 rounded-lg hover:bg-opacity-90 transition-all text-sm"
                >
                  Terapkan Lokasi
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="label-micro flex items-center gap-2"><Eye className="w-3 h-3"/> Kriteria Hisab Hilal</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(['MABIMS', 'WujudulHilal', 'LAPAN'] as CriteriaType[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCriteria(c)}
                      className={cn(
                        "text-left px-4 py-2 rounded-lg border text-sm transition-all",
                        criteria === c 
                          ? "bg-accent/10 border-accent text-accent" 
                          : "bg-bg border-white/5 text-text-dim hover:border-white/20"
                      )}
                    >
                      <div className="font-bold">{c === 'WujudulHilal' ? 'Wujudul Hilal' : c}</div>
                      <div className="text-[10px] opacity-60">
                        {c === 'MABIMS' ? 'Alt > 3°, Elon > 6.4° (Kemenag)' : 
                         c === 'WujudulHilal' ? 'Alt > 0° (Muhammadiyah)' : 
                         'Alt > 2°, Elon > 3° (LAPAN/Lama)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="label-micro flex items-center gap-2"><Compass className="w-3 h-3"/> Algoritma Ephemeris</h3>
                <div className="grid grid-cols-1 gap-2">
                  {(['JeanMeeus', 'IrsyadulMurid'] as AlgorithmType[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAlgorithm(a)}
                      className={cn(
                        "text-left px-4 py-2 rounded-lg border text-sm transition-all",
                        algorithm === a 
                          ? "bg-accent/10 border-accent text-accent" 
                          : "bg-bg border-white/5 text-text-dim hover:border-white/20"
                      )}
                    >
                      <div className="font-bold">{a === 'JeanMeeus' ? 'Jean Meeus (High Precision)' : 'Irsyadul Murid (Metode Kitab)'}</div>
                      <div className="text-[10px] opacity-60">
                        {a === 'JeanMeeus' ? 'Algoritma modern berbasis Nautical Almanac / Astro-Engine.' : 
                         'Perhitungan berdasarkan kitab Irsyadul Murid (Hasan ElFalakiy).'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Date Selector */}
        <section className="flex flex-col md:flex-row items-center justify-between gap-6 glass p-6 rounded-2xl">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
              <label className="label-micro flex items-center gap-2"><Moon className="w-3 h-3 text-accent"/> Pilih Bulan Hijriah</label>
              <div className="flex gap-2">
                <select 
                  value={hMonth}
                  onChange={(e) => setHMonth(parseInt(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none"
                >
                  {HIJRI_MONTHS.map((m, i) => (
                    <option key={m} value={i + 1} className="bg-bg">{m}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={hYear}
                  onChange={(e) => setHYear(parseInt(e.target.value))}
                  className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-micro flex items-center gap-2"><CalendarIcon className="w-3 h-3 text-accent"/> Tanggal Masehi (Lid-Rukyah)</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-serif italic text-accent">
                  {format(date, 'EEEE, d MMMM yyyy', { locale: id })}
                </div>
                <input 
                  type="date" 
                  value={format(date, 'yyyy-MM-dd')}
                  onChange={(e) => handleGregorianChange(new Date(e.target.value))}
                  className="w-12 bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Moon Status */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 glass rounded-3xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-serif italic text-xl flex items-center gap-2">
                <Moon className="w-5 h-5 text-accent" />
                Ephemeris Bulan
              </h2>
              <span className="label-micro bg-accent/10 text-accent px-2 py-1 rounded">Data Astronomis</span>
            </div>
            
            <div className="data-grid">
              <div className="data-cell">
                <span className="label-micro">Tinggi Hilal (Alt)</span>
                <span className="value-mono">{ephemeris?.moonAltitude.toFixed(4)}°</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Azimuth Bulan</span>
                <span className="value-mono">{ephemeris?.moonAzimuth.toFixed(4)}°</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Elongasi</span>
                <span className="value-mono">{ephemeris?.elongation.toFixed(4)}°</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Umur Bulan</span>
                <span className="value-mono">{ephemeris?.moonAge.toFixed(2)} hari</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Tinggi Matahari</span>
                <span className="value-mono">{ephemeris?.sunAltitude.toFixed(4)}°</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Azimuth Matahari</span>
                <span className="value-mono">{ephemeris?.sunAzimuth.toFixed(4)}°</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Fase Bulan</span>
                <span className="value-mono">{(ephemeris?.moonPhase || 0).toFixed(2)}%</span>
              </div>
              <div className="data-cell">
                <span className="label-micro">Ijtima (Konjungsi)</span>
                <span className="value-mono text-sm">{format(ijtima, 'HH:mm:ss')}</span>
                <span className="text-[10px] text-text-dim font-mono">{format(ijtima, 'dd/MM/yyyy')}</span>
              </div>
            </div>

            <div className="p-8 flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-accent/5">
              <div className="relative w-48 h-48 mb-6">
                <div className="absolute inset-0 rounded-full border border-white/10 dashed-radial" />
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="w-32 h-32 rounded-full bg-slate-900 border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-accent/20"
                      style={{ 
                        left: `${(ephemeris?.moonPhase || 0)}%`,
                        transition: 'left 0.5s ease-out'
                      }}
                    />
                  </div>
                </motion.div>
              </div>
              <div className="text-center">
                <p className="label-micro mb-1">Visualisasi Fase</p>
                <p className="text-lg font-serif italic">
                  {ephemeris && ephemeris.moonPhase < 5 ? 'Hilal Baru' : 
                   ephemeris && ephemeris.moonPhase < 45 ? 'Sabit Muda' :
                   ephemeris && ephemeris.moonPhase < 55 ? 'Kuartal Pertama' :
                   ephemeris && ephemeris.moonPhase < 95 ? 'Bulan Besar' : 'Bulan Purnama'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Hilal Visibility */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="glass rounded-3xl p-6 border-l-4 border-accent">
              <h3 className="font-serif italic text-xl mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-accent" />
                Hasil Hisab Hilal
              </h3>
              <p className="text-xs text-text-dim mb-6 leading-relaxed">
                Dihitung pada saat matahari terbenam (sekitar 18:00 waktu lokal) menggunakan kriteria 
                <span className="text-accent font-bold"> {criteria === 'WujudulHilal' ? 'Wujudul Hilal' : criteria}</span>.
              </p>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="label-micro">Tinggi Hakiki</span>
                  <span className={cn("value-mono", hilal && hilal.altitude > (criteria === 'MABIMS' ? 3 : criteria === 'LAPAN' ? 2 : 0) ? "text-emerald-400" : "text-rose-400")}>
                    {hilal?.altitude.toFixed(2)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="label-micro">Elongasi</span>
                  <span className={cn("value-mono", hilal && hilal.elongation > (criteria === 'MABIMS' ? 6.4 : criteria === 'LAPAN' ? 3 : 0) ? "text-emerald-400" : "text-rose-400")}>
                    {hilal?.elongation.toFixed(2)}°
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="label-micro">Selisih Azimuth</span>
                  <span className="value-mono">
                    {hilal && Math.abs(hilal.azimuth - hilal.sunAzimuth).toFixed(2)}°
                  </span>
                </div>
              </div>

              <div className={cn(
                "mt-8 p-6 rounded-2xl text-center border transition-all duration-500",
                hilal?.isVisible 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              )}>
                <div className="label-micro mb-2 opacity-70">Kesimpulan Hisab</div>
                <div className="text-xl font-bold tracking-tight uppercase">
                  {hilal?.isVisible ? 'Sudah Masuk Bulan Baru' : 'Belum Masuk Bulan Baru'}
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-serif italic text-lg mb-4 flex items-center gap-2">
                <Compass className="w-5 h-5 text-accent" />
                Arah Qiblat
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="label-micro">Sudut dari Utara</div>
                  <div className="value-mono">295.14°</div>
                </div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 295 }}
                    className="w-0.5 h-8 bg-accent rounded-full relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full" />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ephemeris Table Section */}
        <section className="glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-serif italic text-xl">Tabel Ephemeris Mingguan</h2>
            <div className="flex gap-2">
              <span className="label-micro px-2 py-1 bg-white/5 rounded">Matahari</span>
              <span className="label-micro px-2 py-1 bg-white/5 rounded">Bulan</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="p-4 label-micro border-b border-white/10">Tanggal</th>
                  <th className="p-4 label-micro border-b border-white/10">Bulan Alt</th>
                  <th className="p-4 label-micro border-b border-white/10">Bulan Azi</th>
                  <th className="p-4 label-micro border-b border-white/10">Matahari Alt</th>
                  <th className="p-4 label-micro border-b border-white/10">Matahari Azi</th>
                  <th className="p-4 label-micro border-b border-white/10">Elongasi</th>
                  <th className="p-4 label-micro border-b border-white/10">Fase</th>
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {[...Array(7)].map((_, i) => {
                  const d = addDays(startOfDay(date), i);
                  const data = getEphemeris(d, location.lat, location.lon);
                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                      <td className="p-4 text-text-dim">{format(d, 'dd MMM', { locale: id })}</td>
                      <td className="p-4">{data?.moonAltitude.toFixed(2)}°</td>
                      <td className="p-4">{data?.moonAzimuth.toFixed(2)}°</td>
                      <td className="p-4">{data?.sunAltitude.toFixed(2)}°</td>
                      <td className="p-4">{data?.sunAzimuth.toFixed(2)}°</td>
                      <td className="p-4">{data?.elongation.toFixed(2)}°</td>
                      <td className="p-4">{data?.moonPhase.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto p-6 border-t border-white/10 mt-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-text-dim" />
          <p className="text-[10px] text-text-dim uppercase tracking-widest font-mono">
            Algoritma berdasarkan Astronomy Engine & Kriteria MABIMS/Hisab Lokal
          </p>
        </div>
        <p className="text-[10px] text-text-dim uppercase tracking-widest font-mono text-center md:text-right">
          &copy; {new Date().getFullYear()} Falaq Roudhotul Mutaallimin 2
        </p>
      </footer>

      {error && (
        <div className="fixed bottom-6 right-6 bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-mono shadow-xl z-50 animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
}
