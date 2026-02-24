function normalizeEnum(value, allowed, fallback = 'both') {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v).trim().toLowerCase()).filter(Boolean))].sort();
}

export function normalizeCountryFeature(item = {}) {
  return {
    iso_a2: String(item.iso_a2 ?? '')
      .trim()
      .toUpperCase(),
    name: String(item.name ?? '').trim(),
    hemisphere: normalizeEnum(item.hemisphere, ['north', 'south', 'both']),
    driving_side: normalizeEnum(item.driving_side, ['left', 'right', 'both']),
    languages: normalizeArray(item.languages),
    scripts: normalizeArray(item.scripts),
    avg_elevation_m:
      typeof item.avg_elevation_m === 'number' && Number.isFinite(item.avg_elevation_m)
        ? item.avg_elevation_m
        : undefined,
    notes: item.notes ? String(item.notes) : undefined
  };
}

export function collectOptions(features = []) {
  const languages = new Set();
  const scripts = new Set();

  for (const country of features) {
    (country.languages ?? []).forEach((language) => languages.add(language));
    (country.scripts ?? []).forEach((script) => scripts.add(script));
  }

  return {
    languages: [...languages].sort(),
    scripts: [...scripts].sort()
  };
}

export function joinGeoWithFeatures(geojson, featureRows) {
  const normalizedRows = featureRows.map(normalizeCountryFeature);
  const byIso = new Map(normalizedRows.map((row) => [row.iso_a2, row]));

  return {
    ...geojson,
    features: (geojson.features ?? []).map((feature) => {
      const iso = String(feature?.properties?.ISO_A2 ?? '').toUpperCase();
      const match = byIso.get(iso);

      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...(match ?? {})
        }
      };
    })
  };
}
