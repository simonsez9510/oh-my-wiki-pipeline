import { describe, it, expect } from 'vitest';
import {
  draftToolSchema,
  normalizeDraftSections,
  revalidateDraftSections,
  selectSavableDraftSections,
  type DraftInput
} from './draft';

const baseInput = (overrides: Partial<DraftInput> = {}): DraftInput => ({
  chapterTitle: '3장 — 안산 정착',
  beats: [
    { title: '안산역 도착', line: '김가원가 안산역에 내린다.', sources: ['인물 — 김가원'], path: '비트/비트 — 안산역 도착.md' },
    { title: '강제이주 회상', line: '화물열차를 회상한다.', sources: ['인터뷰 — 김가원 20260601'], path: '비트/비트 — 강제이주 회상.md' }
  ],
  cards: [
    { title: '인물 — 김가원', path: '카드/인물 — 김가원.md', summary: '1935년생.', evidence: '1935년 연해주 출생. 안산 정착.' },
    { title: '인터뷰 — 김가원 20260601', path: '카드/인터뷰 — 김가원 20260601.md', summary: '회고.', evidence: '1937년 강제이주를 증언.' }
  ],
  ...overrides
});

describe('normalizeDraftSections', () => {
  it('limits a section to the sources of its own beat (whitelist within beat)', () => {
    const sections = normalizeDraftSections(baseInput(), {
      sections: [{ beatTitle: '안산역 도착', prose: '김가원가 안산역 계단을 내려온다.', sources: ['인물 — 김가원', '인터뷰 — 김가원 20260601'] }]
    });
    expect(sections).toHaveLength(1);
    expect(sections[0].sources).toEqual(['인물 — 김가원']);
  });

  it('drops a section whose beatTitle does not match an approved beat', () => {
    const sections = normalizeDraftSections(baseInput(), {
      sections: [{ beatTitle: '없는 비트', prose: '아무 말.', sources: ['인물 — 김가원'] }]
    });
    expect(sections).toHaveLength(0);
  });

  it('drops a section with empty prose', () => {
    const sections = normalizeDraftSections(baseInput(), {
      sections: [{ beatTitle: '안산역 도착', prose: '   ', sources: ['인물 — 김가원'] }]
    });
    expect(sections).toHaveLength(0);
  });

  it('blocks a nonfiction section with no valid sources', () => {
    const sections = normalizeDraftSections(baseInput(), {
      sections: [{ beatTitle: '안산역 도착', prose: '김가원가 내린다.', sources: [] }]
    });
    expect(sections[0].blocking).toBe(true);
  });

  it('flags a year in the prose that is not in the beat or cited card', () => {
    const sections = normalizeDraftSections(baseInput(), {
      sections: [{ beatTitle: '안산역 도착', prose: '1945년 광복 직후 안산역에 내렸다.', sources: ['인물 — 김가원'] }]
    });
    expect(sections[0].flags.some((flag) => flag.includes('1945'))).toBe(true);
  });

  it('does not flag a year present in the cited evidence', () => {
    const sections = normalizeDraftSections(baseInput(), {
      sections: [{ beatTitle: '강제이주 회상', prose: '1937년의 강제이주를 떠올린다.', sources: ['인터뷰 — 김가원 20260601'] }]
    });
    expect(sections[0].flags).toHaveLength(0);
    expect(sections[0].blocking).toBe(false);
  });
});

describe('selectSavableDraftSections (export boundary)', () => {
  it('excludes a section bound to a non-existent beat', () => {
    const sections = [{ beatTitle: '없는 비트', prose: '글.', sources: ['인물 — 김가원'], flags: [], blocking: false }];
    expect(selectSavableDraftSections(sections, baseInput())).toHaveLength(0);
  });

  it('excludes a card that exists globally but is not in the section beat sources', () => {
    const crossBeat = [
      { beatTitle: '안산역 도착', prose: '글.', sources: ['인터뷰 — 김가원 20260601'], flags: [], blocking: false }
    ];
    expect(selectSavableDraftSections(crossBeat, baseInput())).toHaveLength(0);
  });

  it('excludes a nonfiction section with no real source cards and returns sourceCards otherwise', () => {
    const blocked = [{ beatTitle: '안산역 도착', prose: '글.', sources: [], flags: [], blocking: true }];
    expect(selectSavableDraftSections(blocked, baseInput())).toHaveLength(0);

    const ok = [{ beatTitle: '안산역 도착', prose: '글.', sources: ['인물 — 김가원'], flags: [], blocking: false }];
    const result = selectSavableDraftSections(ok, baseInput());
    expect(result).toHaveLength(1);
    expect(result[0].sourceCards.map((c) => c.title)).toEqual(['인물 — 김가원']);
    expect(result[0].beat.title).toBe('안산역 도착');
  });
});

describe('revalidateDraftSections', () => {
  it('recomputes flags when an edit adds a new ungrounded year', () => {
    const edited = [{ beatTitle: '안산역 도착', prose: '2002년 월드컵 무렵 안산역에 내렸다.', sources: ['인물 — 김가원'], flags: [], blocking: false }];
    const result = revalidateDraftSections(edited, baseInput());
    expect(result[0].flags.some((flag) => flag.includes('2002'))).toBe(true);
  });

  it('drops a section edited to blank prose', () => {
    const edited = [{ beatTitle: '안산역 도착', prose: '   ', sources: ['인물 — 김가원'], flags: [], blocking: false }];
    expect(revalidateDraftSections(edited, baseInput())).toHaveLength(0);
  });
});

describe('draftToolSchema', () => {
  it('requires a sections array with the section item shape', () => {
    const schema = draftToolSchema() as Record<string, any>;
    expect(schema.required).toContain('sections');
    expect(schema.properties.sections.items.required).toEqual(['beatTitle', 'prose', 'sources']);
  });
});
