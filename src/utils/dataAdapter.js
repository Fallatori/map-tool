function normalizeEnum(value, allowed, fallback = 'both') {
  if (Array.isArray(value)) {
    const hit = value
      .map((v) => String(v ?? '').trim().toLowerCase())
      .find((v) => allowed.includes(v));
    return hit ?? fallback;
  }

  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeIso(value) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    return '';
  }

  if (normalized === 'ZZ') {
    return '';
  }

  return normalized;
}

export function getFeatureIsoA2(featureOrProperties) {
  const properties = featureOrProperties?.properties ?? featureOrProperties ?? {};
  const candidates = [
    properties.iso_a2,
    properties.ISO_A2,
    properties.ISO_A2_EH,
    properties.WB_A2,
    properties.ADM0_A3_US
  ];

  for (const candidate of candidates) {
    const iso = normalizeIso(candidate);
    if (iso) {
      return iso;
    }
  }

  return '';
}

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((v) => String(v ?? '').trim().toLowerCase()).filter(Boolean))].sort();
}

function normalizeEnumArray(values, allowed, fallback = ['both']) {
  const arr = Array.isArray(values) ? values : [values];
  const normalized = [...new Set(arr.map((v) => String(v ?? '').trim().toLowerCase()).filter(Boolean))];
  const filtered = normalized.filter((v) => allowed.includes(v));

  if (!filtered.length) return fallback;
  if (filtered.includes('both')) return ['both'];
  return filtered;
}

export function normalizeCountryFeature(item = {}) {
  const hemisphere = normalizeEnumArray(item.hemisphere, ['north', 'south', 'both'], ['both']);
  const drivingRaw = normalizeEnumArray(item.driving_side, ['left', 'right', 'both'], ['both']);
  const driving_side =
    drivingRaw.includes('both') || drivingRaw.length > 1 ? 'both' : drivingRaw[0] ?? 'both';

  return {
    iso_a2: String(item.iso_a2 ?? '')
      .trim()
      .toUpperCase(),
    name: String(item.name ?? '').trim(),
    hemisphere,
    driving_side,
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
      const iso = getFeatureIsoA2(feature);
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
