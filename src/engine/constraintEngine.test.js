import { describe, expect, it } from 'vitest';
import { applyConstraints } from './constraintEngine';

const sample = [
  {
    iso_a2: 'GB',
    hemisphere: 'north',
    driving_side: 'left',
    languages: ['english'],
    scripts: ['latin']
  },
  {
    iso_a2: 'AU',
    hemisphere: 'south',
    driving_side: 'left',
    languages: ['english'],
    scripts: ['latin']
  },
  {
    iso_a2: 'RU',
    hemisphere: 'north',
    driving_side: 'right',
    languages: ['russian'],
    scripts: ['cyrillic']
  }
];

describe('applyConstraints strict mode', () => {
  it('filters by hemisphere and driving side', () => {
    const result = applyConstraints(sample, [
      { type: 'hemisphere', value: 'south' },
      { type: 'driving_side', value: 'left' }
    ]);

    expect(result.matchingIso).toEqual(['AU']);
  });

  it('supports include and exclude ISO', () => {
    const result = applyConstraints(sample, [
      { type: 'country_include', value: 'RU' },
      { type: 'country_exclude', value: 'GB' }
    ]);

    expect(result.matchingIso).toEqual(['RU']);
  });

  it('matches script and language filters', () => {
    const result = applyConstraints(sample, [
      { type: 'script', value: 'latin' },
      { type: 'language', value: 'english' }
    ]);

    expect(result.matchingIso).toEqual(['GB', 'AU']);
  });
});

describe('applyConstraints weighted mode', () => {
  it('keeps near-matches with weights', () => {
    const weighted = applyConstraints(
      sample,
      [
        { type: 'hemisphere', value: 'north', weight: 2 },
        { type: 'driving_side', value: 'left', weight: 1 }
      ],
      { mode: 'weighted', threshold: 0.5 }
    );

    expect(weighted.matchingIso).toContain('GB');
    expect(weighted.matchingIso).toContain('RU');
    expect(weighted.scores.GB).toBeGreaterThan(weighted.scores.RU);
  });
});
