import { METRIC_KEYS } from './metrics.js';

/** All threshold breaches present in a single reading. */
export function evaluate(reading, thresholds) {
  const out = [];
  for (const metric of METRIC_KEYS) {
    const value = reading[metric];
    const t = thresholds[metric];
    if (value === null || value === undefined || !t) continue;
    if (value > t.max) out.push({ metric, value, level: 'high', limit: t.max });
    else if (value < t.min) out.push({ metric, value, level: 'low', limit: t.min });
  }
  return out;
}

/**
 * Edge-triggered alerting: emits an event only when a metric *enters* breach,
 * not on every sample while it stays out of range. `active` is a Set that
 * tracks ongoing breaches and is mutated in place.
 */
export function detectAlerts(reading, thresholds, active) {
  const events = [];
  const current = new Set();

  for (const b of evaluate(reading, thresholds)) {
    const key = `${reading.device}:${b.metric}`;
    current.add(key);
    if (!active.has(key)) {
      events.push({
        id: `${reading.timestamp}-${key}`,
        timestamp: reading.timestamp,
        device: reading.device,
        ...b,
      });
    }
  }

  for (const key of [...active]) {
    if (key.startsWith(`${reading.device}:`) && !current.has(key)) active.delete(key);
  }
  for (const key of current) active.add(key);

  return events;
}

/** Run edge-triggered detection across a batch of readings (e.g. an imported CSV). */
export function scanAlerts(readings, thresholds) {
  const active = new Set();
  return readings.flatMap((r) => detectAlerts(r, thresholds, active));
}
