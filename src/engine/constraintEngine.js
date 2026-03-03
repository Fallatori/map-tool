function normalizeString(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeIso(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function containsValue(list, value) {
  if (!Array.isArray(list) || !value) {
    return null;
  }
  return list.map(normalizeString).includes(normalizeString(value));
}

function normalizeEnumList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map(normalizeString).filter(Boolean))];
  }

  const normalized = normalizeString(value);
  return normalized ? [normalized] : [];
}

function evaluateConstraint(country, constraint) {
  const type = constraint?.type;
  const value = constraint?.value;
  const hemisphere = normalizeEnumList(country.hemisphere);
  const drivingSide = normalizeEnumList(country.driving_side);

  switch (type) {
    case 'hemisphere': {
      const wanted = normalizeString(value);
      if (!wanted || hemisphere.length === 0) return null;
      return hemisphere.includes('both') || hemisphere.includes(wanted);
    }

    case 'driving_side': {
      const wanted = normalizeString(value);
      if (!wanted || drivingSide.length === 0) return null;
      return drivingSide.includes('both') || drivingSide.includes(wanted);
    }

    case 'language':
      return containsValue(country.languages, value);

    case 'script':
      return containsValue(country.scripts, value);

    case 'country_include': {
      const wanted = normalizeIso(value);
      if (!wanted) return null;
      return normalizeIso(country.iso_a2) === wanted;
    }

    case 'country_exclude': {
      const denied = normalizeIso(value);
      if (!denied) return null;
      return normalizeIso(country.iso_a2) !== denied;
    }

    default:
      return null;
  }
}

export function applyConstraints(featuresArray = [], constraintsArray = [], options = {}) {
  const mode = options.mode ?? 'strict';
  const threshold = options.threshold ?? 0.5;
  const missingScore = options.missingScore ?? 0.35;
  const constraints = constraintsArray.filter((constraint) => constraint?.type);

  const matches = [];
  const scores = {};

  for (const country of featuresArray) {
    const iso = normalizeIso(country.iso_a2);
    if (!iso) continue;

    if (constraints.length === 0) {
      matches.push(iso);
      scores[iso] = 1;
      continue;
    }

    if (mode === 'strict') {
      const strictMatch = constraints.every(
        (constraint) => evaluateConstraint(country, constraint) === true
      );
      if (strictMatch) {
        matches.push(iso);
        scores[iso] = 1;
      } else {
        scores[iso] = 0;
      }
      continue;
    }

    let weightedTotal = 0;
    let weightedScore = 0;

    for (const constraint of constraints) {
      const weight = Number(constraint.weight ?? 1);
      const result = evaluateConstraint(country, constraint);
      weightedTotal += weight;

      if (result === true) {
        weightedScore += weight;
      } else if (result === null) {
        weightedScore += weight * missingScore;
      }
    }

    const countryScore = weightedTotal > 0 ? weightedScore / weightedTotal : 0;
    scores[iso] = Number(countryScore.toFixed(4));
    if (countryScore >= threshold) {
      matches.push(iso);
    }
  }

  const matchingIso = matches.sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
  return { matchingIso, scores };
}
