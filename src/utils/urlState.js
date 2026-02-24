function parseList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function searchToConstraints(search) {
  const params = new URLSearchParams(search);
  return {
    hemisphere: params.get('hemisphere') ?? '',
    driving_side: params.get('driving_side') ?? '',
    language: params.get('language') ?? '',
    scripts: parseList(params.get('scripts')),
    includeIso: parseList(params.get('include')).map((iso) => iso.toUpperCase()),
    excludeIso: parseList(params.get('exclude')).map((iso) => iso.toUpperCase())
  };
}

export function constraintsToSearch(constraints) {
  const params = new URLSearchParams();

  if (constraints.hemisphere) params.set('hemisphere', constraints.hemisphere);
  if (constraints.driving_side) params.set('driving_side', constraints.driving_side);
  if (constraints.language) params.set('language', constraints.language);
  if (constraints.scripts?.length) params.set('scripts', constraints.scripts.join(','));
  if (constraints.includeIso?.length) params.set('include', constraints.includeIso.join(','));
  if (constraints.excludeIso?.length) params.set('exclude', constraints.excludeIso.join(','));

  return params.toString();
}
