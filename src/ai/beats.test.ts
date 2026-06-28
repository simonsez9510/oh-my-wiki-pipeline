import { describe, it, expect } from 'vitest';
import {
  beatToolSchema,
  buildBeatMessages,
  extractYears,
  languageDirective,
  normalizeBeats,
  normalizeLanguage,
  revalidateBeats,
  selectSavableBeats,
  type Beat,
  type BeatInput
} from './beats';

const baseInput = (overrides: Partial<BeatInput> = {}): BeatInput => ({
  chapterTitle: '3장 — 안산 정착',
  chapterBody: '안산 정착 과정을 다룬다.',
  cards: [
    { title: '인물 — 김올가', path: '카드/인물 — 김올가.md', summary: '1938년생 고려인 어르신.', evidence: '1938년 연해주 출생.' },
    { title: '인터뷰 — 김올가 20260601', path: '카드/인터뷰 — 김올가 20260601.md', summary: '안산 도착 회고.', evidence: '안산에 도착했다.' },
    { title: '사건 — 해방', path: '카드/사건 — 해방.md', summary: '1945년 해방.', evidence: '1945년 해방되었다.' }
  ],
  ...overrides
});

describe('normalizeBeats', () => {
  it('keeps only sources that match real card titles (whitelist grounding)', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '도착', line: '안산역에 내린다.', quote: '1938년 연해주 출생.', sources: ['인물 — 김올가', '없는 카드'] }]
    });
    expect(beats).toHaveLength(1);
    expect(beats[0].sources).toEqual(['인물 — 김올가']);
    expect(beats[0].flags).toHaveLength(0);
  });

  it('blocks a beat with no sources', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '회상', line: '먼 기억을 떠올린다.', quote: '', sources: [] }]
    });
    expect(beats[0].blocking).toBe(true);
    expect(beats[0].flags.some((flag) => flag.includes('출처'))).toBe(true);
  });

  it('flags a year that does not appear in the cited evidence', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '추방', line: '1937년 강제이주가 시작된다.', quote: '1938년 연해주 출생.', sources: ['인물 — 김올가'] }]
    });
    expect(beats[0].flags.some((flag) => flag.includes('1937'))).toBe(true);
  });

  it('only counts years from cited sources, not from uncited cards', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '귀환', line: '1945년 귀환한다.', quote: '1938년 연해주 출생.', sources: ['인물 — 김올가'] }]
    });
    expect(beats[0].flags.some((flag) => flag.includes('1945'))).toBe(true);
  });

  it('does not flag a year that appears in cited card evidence', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '출생', line: '1938년에 태어났다.', quote: '1938년 연해주 출생.', sources: ['인물 — 김올가'] }]
    });
    expect(beats[0].flags).toHaveLength(0);
    expect(beats[0].blocking).toBe(false);
  });

  it('flags a quote that is not found in the cited evidence (possible fabrication)', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '날조', line: '도착한다.', quote: '카드에 없는 원문 구절', sources: ['인물 — 김올가'] }]
    });
    expect(beats[0].flags.some((flag) => flag.includes('지어냈을'))).toBe(true);
  });

  it('does not accept a quote that only appears in the chapter body, not the cited card', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '본문복사', line: '도착한다.', quote: '안산 정착 과정을 다룬다.', sources: ['인물 — 김올가'] }]
    });
    expect(beats[0].flags.some((flag) => flag.includes('지어냈을'))).toBe(true);
  });

  it('flags a quote shorter than the minimum length', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '짧은인용', line: '도착한다.', quote: '도착', sources: ['인물 — 김올가'] }]
    });
    expect(beats[0].flags.some((flag) => flag.includes('짧'))).toBe(true);
  });

  it('deduplicates repeated sources', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [{ title: '도착', line: '도착한다.', quote: '1938년 연해주 출생.', sources: ['인물 — 김올가', '인물 — 김올가'] }]
    });
    expect(beats[0].sources).toEqual(['인물 — 김올가']);
  });

  it('drops malformed beats missing title or line', () => {
    const beats = normalizeBeats(baseInput(), {
      beats: [
        { title: '제목만', line: '', quote: '', sources: [] },
        { title: '', line: '본문만', quote: '', sources: [] }
      ]
    });
    expect(beats).toHaveLength(0);
  });

  it('returns empty array for malformed payloads', () => {
    expect(normalizeBeats(baseInput(), null)).toEqual([]);
    expect(normalizeBeats(baseInput(), { beats: 'nope' })).toEqual([]);
  });
});

describe('revalidateBeats', () => {
  const beat = (overrides: Partial<Parameters<typeof revalidateBeats>[0][number]> = {}) => ({
    title: '도착',
    line: '안산역에 내린다.',
    quote: '1938년 연해주 출생.',
    sources: ['인물 — 김올가'],
    flags: [],
    blocking: false,
    ...overrides
  });

  it('recomputes flags after an edit introduces a new ungrounded year', () => {
    const result = revalidateBeats([beat({ line: '1937년 강제이주가 시작된다.' })], baseInput());
    expect(result[0].flags.some((flag) => flag.includes('1937'))).toBe(true);
  });

  it('drops a beat whose line was edited to blank', () => {
    const result = revalidateBeats([beat({ line: '   ' })], baseInput());
    expect(result).toHaveLength(0);
  });

  it('re-blocks a beat whose sources were edited away in nonfiction', () => {
    const result = revalidateBeats([beat({ sources: [] })], baseInput());
    expect(result[0].blocking).toBe(true);
  });
});

describe('selectSavableBeats (export boundary)', () => {
  const cards = baseInput().cards;
  const mk = (overrides: Partial<Beat> = {}): Beat => ({
    title: '도착',
    line: '안산역에 내린다.',
    quote: '1938년 연해주 출생.',
    sources: ['인물 — 김올가'],
    flags: [],
    blocking: false,
    ...overrides
  });

  it('excludes a beat whose sources are not real cards', () => {
    const result = selectSavableBeats([mk({ sources: ['없는 카드'] })], cards);
    expect(result).toHaveLength(0);
  });

  it('keeps only the real cards as the source set', () => {
    const result = selectSavableBeats([mk({ sources: ['인물 — 김올가', '없는 카드'] })], cards);
    expect(result).toHaveLength(1);
    expect(result[0].sourceCards.map((c) => c.title)).toEqual(['인물 — 김올가']);
  });

  it('excludes blocking and blank beats', () => {
    expect(selectSavableBeats([mk({ blocking: true })], cards)).toHaveLength(0);
    expect(selectSavableBeats([mk({ line: '  ' })], cards)).toHaveLength(0);
  });
});

describe('extractYears', () => {
  it('extracts unique 4-digit years in range', () => {
    expect(extractYears('1937년과 1937년, 그리고 2026년')).toEqual(['1937', '2026']);
  });

  it('ignores non-year numbers', () => {
    expect(extractYears('번호 12345 와 999')).toEqual([]);
  });
});

describe('normalizeLanguage / languageDirective', () => {
  it('maps Russian variants to ru and everything else to ko', () => {
    expect(normalizeLanguage('ru')).toBe('ru');
    expect(normalizeLanguage('RU')).toBe('ru');
    expect(normalizeLanguage('러시아어')).toBe('ru');
    expect(normalizeLanguage('russian')).toBe('ru');
    expect(normalizeLanguage('ko')).toBe('ko');
    expect(normalizeLanguage('한국어')).toBe('ko');
    expect(normalizeLanguage(undefined)).toBe('ko');
  });

  it('only emits a Russian directive for ru, and keeps beatTitle/sources untranslated in draft', () => {
    expect(languageDirective('ru', 'beat')).toContain('러시아어');
    expect(languageDirective('ru', 'draft')).toContain('beatTitle');
    expect(languageDirective('ko', 'beat')).toBe('');
    expect(languageDirective(undefined, 'draft')).toBe('');
  });

  it('adds the Russian directive to the beat system prompt when language is ru', () => {
    const ru = buildBeatMessages(baseInput({ language: 'ru' }));
    const ko = buildBeatMessages(baseInput());
    expect(ru.system).toContain('러시아어');
    expect(ko.system).not.toContain('출력 언어: 러시아어');
  });
});

describe('beatToolSchema', () => {
  it('requires a beats array with the full item shape', () => {
    const schema = beatToolSchema() as Record<string, any>;
    expect(schema.required).toContain('beats');
    expect(schema.properties.beats.items.required).toEqual(['title', 'line', 'quote', 'sources']);
  });
});
