import { useCallback, useEffect, useRef, useState } from 'react';
import { DEVICES, createDevice } from '../lib/simulator.js';
import { detectAlerts, scanAlerts } from '../lib/alerts.js';

const MAX_POINTS = 120;
const MAX_ALERTS = 100;

function makeSimulators() {
  return DEVICES.map((d, i) => createDevice(d.id, 1000 + i * 77));
}

function prefill(sims, intervalMs, points = 60) {
  const now = Date.now();
  const series = Object.fromEntries(sims.map((s) => [s.id, []]));
  for (let i = points; i > 0; i--) {
    const ts = now - i * intervalMs;
    for (const s of sims) series[s.id].push(s.next(ts));
  }
  return series;
}

/**
 * Streams simulated telemetry, keeps a rolling window per device, and raises
 * edge-triggered alerts. Can switch to an imported (CSV) dataset and back.
 */
export function useTelemetry({ thresholds, intervalMs = 1000 }) {
  const simsRef = useRef(null);
  if (simsRef.current === null) simsRef.current = makeSimulators();

  const [series, setSeries] = useState(() => prefill(simsRef.current, intervalMs));
  const [alerts, setAlerts] = useState([]);
  const [paused, setPaused] = useState(false);
  const [source, setSource] = useState('live'); // 'live' | 'imported'

  const thresholdsRef = useRef(thresholds);
  thresholdsRef.current = thresholds;
  const activeRef = useRef(new Set());

  useEffect(() => {
    if (paused || source !== 'live') return undefined;
    const id = setInterval(() => {
      const ts = Date.now();
      const readings = simsRef.current.map((s) => s.next(ts));
      const events = readings.flatMap((r) => detectAlerts(r, thresholdsRef.current, activeRef.current));

      setSeries((prev) => {
        const next = { ...prev };
        for (const r of readings) next[r.device] = [...(prev[r.device] ?? []), r].slice(-MAX_POINTS);
        return next;
      });
      if (events.length) setAlerts((prev) => [...events.reverse(), ...prev].slice(0, MAX_ALERTS));
    }, intervalMs);
    return () => clearInterval(id);
  }, [paused, source, intervalMs]);

  const importReadings = useCallback((readings) => {
    const grouped = {};
    for (const r of readings) (grouped[r.device] ??= []).push(r);
    activeRef.current = new Set();
    setSeries(grouped);
    setAlerts(scanAlerts(readings, thresholdsRef.current).reverse().slice(0, MAX_ALERTS));
    setSource('imported');
  }, []);

  const backToLive = useCallback(() => {
    simsRef.current = makeSimulators();
    activeRef.current = new Set();
    setSeries(prefill(simsRef.current, intervalMs));
    setAlerts([]);
    setSource('live');
  }, [intervalMs]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { series, alerts, paused, setPaused, source, importReadings, backToLive, clearAlerts };
}
