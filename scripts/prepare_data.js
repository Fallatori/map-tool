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

function normalizeRow(row) {
  return {
    ...row,
    iso_a2: String(row.iso_a2 ?? '')
      .trim()
      .toUpperCase(),
    name: String(row.name ?? '').trim(),
    hemisphere: normalizeString(row.hemisphere),
    driving_side: normalizeString(row.driving_side),
    languages: Array.isArray(row.languages)
      ? [...new Set(row.languages.map(normalizeString).filter(Boolean))].sort()
      : [],
    scripts: Array.isArray(row.scripts)
      ? [...new Set(row.scripts.map(normalizeString).filter(Boolean))].sort()
      : []
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
    (row) => !allowedHemisphere.has(row.hemisphere) || !allowedDriving.has(row.driving_side)
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
