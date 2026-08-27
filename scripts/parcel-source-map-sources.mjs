const PARCEL_SYNTHETIC_SOURCE = '<anon>';

export function normalizeParcelSources(sources) {
  return sources.filter(source => source !== PARCEL_SYNTHETIC_SOURCE);
}
