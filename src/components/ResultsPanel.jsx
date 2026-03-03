function formatList(values = []) {
  return values.length ? values.join(', ') : '—';
}

function formatHemisphere(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—';
  }
  return value || '—';
}

export default function ResultsPanel({ matchingFeatures, totalCount }) {
  return (
    <section className="panel results-panel" aria-live="polite">
      <h2>Results</h2>
      <p>
        <strong>{matchingFeatures.length}</strong> / {totalCount} countries match.
      </p>

      {matchingFeatures[0] && (
        <article className="country-card" aria-label="Top country card">
          <h3>{matchingFeatures[0].name}</h3>
          <p>ISO: {matchingFeatures[0].iso_a2}</p>
          <p>Hemisphere: {formatHemisphere(matchingFeatures[0].hemisphere)}</p>
          <p>Driving: {matchingFeatures[0].driving_side}</p>
          <p>Scripts: {formatList(matchingFeatures[0].scripts)}</p>
        </article>
      )}

      <ol className="results-list">
        {matchingFeatures.slice(0, 50).map((country) => (
          <li key={country.iso_a2}>
            <strong>{country.name}</strong> ({country.iso_a2}) — {formatHemisphere(country.hemisphere)},
            drive:{' '}
            {country.driving_side}
          </li>
        ))}
      </ol>
    </section>
  );
}