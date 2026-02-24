import { useEffect, useMemo, useState } from 'react';
import FiltersPanel from './components/FiltersPanel';
import MapView from './components/MapView';
import ResultsPanel from './components/ResultsPanel';
import { applyConstraints } from './engine/constraintEngine';
import { collectOptions, joinGeoWithFeatures } from './utils/dataAdapter';
import { constraintsToSearch, searchToConstraints } from './utils/urlState';
import './App.css';

const defaultConstraints = {
  hemisphere: '',
  driving_side: '',
  language: '',
  scripts: [],
  includeIso: [],
  excludeIso: []
};

const MANAGED_QUERY_KEYS = ['hemisphere', 'driving_side', 'language', 'scripts', 'include', 'exclude'];

function buildConstraintsArray(state) {
  const constraints = [];

  if (state.hemisphere) {
    constraints.push({ type: 'hemisphere', value: state.hemisphere });
  }

  if (state.driving_side) {
    constraints.push({ type: 'driving_side', value: state.driving_side });
  }

  if (state.language) {
    constraints.push({ type: 'language', value: state.language });
  }

  for (const script of state.scripts) {
    constraints.push({ type: 'script', value: script });
  }

  for (const iso of state.includeIso) {
    constraints.push({ type: 'country_include', value: iso });
  }

  for (const iso of state.excludeIso) {
    constraints.push({ type: 'country_exclude', value: iso });
  }

  return constraints;
}

export default function App() {
  const [geojson, setGeojson] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [constraints, setConstraints] = useState(() => ({
    ...defaultConstraints,
    ...searchToConstraints(window.location.search)
  }));

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [geoRes, featureRes] = await Promise.all([
          fetch('/data/countries.geojson'),
          fetch('/data/country_features.json')
        ]);

        if (!geoRes.ok || !featureRes.ok) {
          throw new Error('Failed to load one or more data files from public/data.');
        }

        const [geo, featureData] = await Promise.all([geoRes.json(), featureRes.json()]);
        setFeatures(featureData);
        setGeojson(joinGeoWithFeatures(geo, featureData));
        setError('');
      } catch (err) {
        setError(err.message ?? 'Unknown loading error.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    for (const key of MANAGED_QUERY_KEYS) {
      params.delete(key);
    }

    const managed = new URLSearchParams(constraintsToSearch(constraints));
    for (const [key, value] of managed.entries()) {
      params.set(key, value);
    }

    const query = params.toString();
    const next = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', next);
  }, [constraints]);

  const constraintObjects = useMemo(() => buildConstraintsArray(constraints), [constraints]);

  const result = useMemo(
    () => applyConstraints(features, constraintObjects, { mode: 'strict' }),
    [features, constraintObjects]
  );

  const optionValues = useMemo(() => collectOptions(features), [features]);

  const matchingFeatures = useMemo(() => {
    const scoreMap = result.scores ?? {};
    const wanted = new Set(result.matchingIso);
    return features
      .filter((country) => wanted.has(country.iso_a2))
      .sort((a, b) => (scoreMap[b.iso_a2] ?? 0) - (scoreMap[a.iso_a2] ?? 0));
  }, [features, result.matchingIso, result.scores]);

  if (loading) {
    return <div className="status">Loading country data…</div>;
  }

  if (error) {
    return <div className="status status-error">{error}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="left-pane">
        <h1>GeoGuessr Helper</h1>
        <p className="subtitle">Filter countries by clue constraints and share the result via URL.</p>
        <FiltersPanel
          constraints={constraints}
          options={optionValues}
          onChange={setConstraints}
          onReset={() => setConstraints(defaultConstraints)}
        />
      </aside>

      <main className="map-pane">
        <MapView
          geojson={geojson}
          matchedIso={result.matchingIso}
          excludedIso={constraints.excludeIso}
        />
      </main>

      <aside className="right-pane">
        <ResultsPanel matchingFeatures={matchingFeatures} totalCount={features.length} />
      </aside>
    </div>
  );
}