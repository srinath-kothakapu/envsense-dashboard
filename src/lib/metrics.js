export const METRIC_KEYS = ['temperature', 'humidity', 'pressure', 'co2'];

export const METRICS = {
  temperature: { label: 'Temperature', unit: '°C', decimals: 1 },
  humidity: { label: 'Humidity', unit: '%', decimals: 1 },
  pressure: { label: 'Pressure', unit: 'hPa', decimals: 1 },
  co2: { label: 'CO₂', unit: 'ppm', decimals: 0 },
};

export const DEFAULT_THRESHOLDS = {
  temperature: { min: 15, max: 30 },
  humidity: { min: 25, max: 65 },
  pressure: { min: 990, max: 1030 },
  co2: { min: 0, max: 1000 },
};

export function formatValue(metric, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  return Number(value).toFixed(METRICS[metric].decimals);
}

/** Returns 'ok' | 'high' | 'low' for a value against a {min,max} threshold. */
export function statusOf(value, threshold) {
  if (value === null || value === undefined || !threshold) return 'ok';
  if (value > threshold.max) return 'high';
  if (value < threshold.min) return 'low';
  return 'ok';
}
