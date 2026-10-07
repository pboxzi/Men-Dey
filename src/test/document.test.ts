import {describe, expect, it} from 'vitest';

import {parseDocument} from '../lib/document';

describe('parseDocument', () => {
  it('reflows hard-wrapped copy into one flowing paragraph', () => {
    const doc = parseDocument('\nPlease read this\nbefore creating your account.\n');

    expect(doc.intro).toBe('Please read this before creating your account.');
    expect(doc.sections).toHaveLength(0);
  });

  it('splits numbered sections and keeps each body in order', () => {
    const content = [
      'Intro line one',
      'still the intro',
      '',
      '1. First title',
      'body wrapped',
      'across two lines',
      '',
      '2. Second title',
      'more body',
    ].join('\n');

    const doc = parseDocument(content);

    expect(doc.intro).toBe('Intro line one still the intro');
    expect(doc.sections).toEqual([
      {number: '1', title: 'First title', body: 'body wrapped across two lines'},
      {number: '2', title: 'Second title', body: 'more body'},
    ]);
  });

  it('keeps a line that only looks like a heading as body copy', () => {
    const doc = parseDocument('1. First\nbody mentions 2. twice\nand more text');

    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].body).toBe('body mentions 2. twice and more text');
  });

  it('ignores numbering that breaks the sequence', () => {
    const doc = parseDocument('1. First\nbody\n3. Third');

    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].body).toBe('body 3. Third');
  });
});
