function parseIsoList(value) {
  return value
    .split(',')
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);
}

export default function FiltersPanel({ constraints, options, onChange, onReset }) {
  const update = (patch) => onChange((prev) => ({ ...prev, ...patch }));

  const toggleScript = (script) => {
    const current = new Set(constraints.scripts);
    if (current.has(script)) {
      current.delete(script);
    } else {
      current.add(script);
    }
    update({ scripts: [...current].sort() });
  };

  return (
    <section className="panel">
      <div className="field-group">
        <label htmlFor="hemisphere">Hemisphere</label>
        <select
          id="hemisphere"
          value={constraints.hemisphere}
          onChange={(event) => update({ hemisphere: event.target.value })}
        >
          <option value="">Any</option>
          <option value="north">North</option>
          <option value="south">South</option>
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="driving-side">Driving side</label>
        <select
          id="driving-side"
          value={constraints.driving_side}
          onChange={(event) => update({ driving_side: event.target.value })}
        >
          <option value="">Any</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="language">Language</label>
        <select
          id="language"
          value={constraints.language}
          onChange={(event) => update({ language: event.target.value })}
        >
          <option value="">Any</option>
          {options.languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="field-group" aria-label="Script filters">
        <legend>Scripts</legend>
        <div className="script-grid">
          {options.scripts.map((script) => (
            <label key={script}>
              <input
                type="checkbox"
                checked={constraints.scripts.includes(script)}
                onChange={() => toggleScript(script)}
              />
              {script}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-group">
        <label htmlFor="include-iso">Include ISO (comma separated)</label>
        <input
          id="include-iso"
          type="text"
          value={constraints.includeIso.join(',')}
          onChange={(event) => update({ includeIso: parseIsoList(event.target.value) })}
          placeholder="NO,FR"
        />
      </div>

      <div className="field-group">
        <label htmlFor="exclude-iso">Exclude ISO (comma separated)</label>
        <input
          id="exclude-iso"
          type="text"
          value={constraints.excludeIso.join(',')}
          onChange={(event) => update({ excludeIso: parseIsoList(event.target.value) })}
          placeholder="RU,CN"
        />
      </div>

      <button type="button" onClick={onReset} className="ghost-btn">
        Reset all filters
      </button>
    </section>
  );
}