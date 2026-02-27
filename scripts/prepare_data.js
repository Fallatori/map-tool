import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const geoPath = path.join(root, 'public/data/countries.geojson');
const featurePath = path.join(root, 'public/data/country_features.json');

const allowedHemisphere = new Set(['north', 'south', 'both']);
const allowedDriving = new Set(['left', 'right', 'both']);

function normalizeString(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase();
}

function normalizeArray(values) {
  const arr = Array.isArray(values) ? values : [values];
  return [...new Set(arr.map(normalizeString).filter(Boolean))].sort();
}

function normalizeRow(row) {
  const hemisphereRaw = normalizeArray(row.hemisphere).filter((value) => allowedHemisphere.has(value));
  const hemisphere = hemisphereRaw.length ? hemisphereRaw : ['both'];

  const drivingRaw = normalizeArray(row.driving_side).filter((value) => allowedDriving.has(value));
  const driving_side =
    drivingRaw.length === 0
      ? 'both'
      : drivingRaw.includes('both') || drivingRaw.length > 1
        ? 'both'
        : drivingRaw[0];

  return {
    ...row,
    iso_a2: String(row.iso_a2 ?? '')
      .trim()
      .toUpperCase(),
    name: String(row.name ?? '').trim(),
    hemisphere,
    driving_side,
    languages: normalizeArray(row.languages),
    scripts: normalizeArray(row.scripts)
  };
}

async function main() {
  const [geoRaw, featureRaw] = await Promise.all([
    fs.readFile(geoPath, 'utf8'),
    fs.readFile(featurePath, 'utf8')
  ]);

  const geo = JSON.parse(geoRaw);
  const features = JSON.parse(featureRaw).map(normalizeRow);
  const byIso = new Map(features.map((row) => [row.iso_a2, row]));

  const geoIso = new Set(
    (geo.features ?? []).map((feature) => String(feature?.properties?.ISO_A2 ?? '').toUpperCase())
  );

  const missing = [];
  for (const iso of geoIso) {
    if (!byIso.has(iso)) missing.push(iso);
  }

  const invalidEnums = features.filter(
    (row) =>
      !Array.isArray(row.hemisphere) ||
      row.hemisphere.length === 0 ||
      !row.hemisphere.every((h) => allowedHemisphere.has(h)) ||
      !allowedDriving.has(row.driving_side)
  );

  if (invalidEnums.length) {
    throw new Error(`Invalid enum values in ${invalidEnums.length} rows.`);
  }

  if (missing.length) {
    throw new Error(`Missing country_features entries for: ${missing.join(', ')}`);
  }

  await fs.writeFile(featurePath, `${JSON.stringify(features, null, 2)}\n`, 'utf8');
  console.log(`Validated ${features.length} country feature rows with full GeoJSON coverage.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
