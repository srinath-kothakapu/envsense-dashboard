import { METRIC_KEYS } from './metrics.js';

/** Flatten {deviceId: reading[]} into one time-sorted list. */
export function flatten(series) {
  return Object.values(series)
    .flat()
    .sort((a, b) => a.timestamp - b.timestamp);
}

/** Pivot one metric into chart rows: [{timestamp, 'node-01': v, 'node-02': v}]. */
export function mergeSeries(series, metric) {
  const rows = new Map();
  for (const [device, readings] of Object.entries(series)) {
    for (const r of readings) {
      if (r[metric] === undefined) continue;
      if (!rows.has(r.timestamp)) rows.set(r.timestamp, { timestamp: r.timestamp });
      rows.get(r.timestamp)[device] = r[metric];
    }
  }
  return [...rows.values()].sort((a, b) => a.timestamp - b.timestamp);
}

/** min / max / avg / latest for each metric of one device's readings. */
export function summarize(readings) {
  const out = {};
  for (const metric of METRIC_KEYS) {
    const values = readings.map((r) => r[metric]).filter((v) => typeof v === 'number');
    if (!values.length) {
      out[metric] = null;
      continue;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    out[metric] = {
      latest: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
    };
  }
  return out;
}
