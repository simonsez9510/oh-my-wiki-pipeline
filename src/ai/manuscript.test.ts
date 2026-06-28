import { describe, it, expect } from 'vitest';
import { assembleManuscript, manuscriptHasFlags, type ManuscriptInput } from './manuscript';

const input = (overrides: Partial<ManuscriptInput> = {}): ManuscriptInput => ({
  chapterTitle: '01장 나라 없는 사람들',
  fromStage: '퇴고',
  sections: [
    { prose: '새벽 4시의 어머니.', grounding: ['비트 — 새벽 4시의 어머니', '어머니 콜호스 — 증언'], flags: [] },
    { prose: '강제이주라는 시작점.', grounding: ['비트 — 강제이주', '1937 강제이주 — 사건'], flags: [] }
  ],
  ...overrides
});

describe('assembleManuscript', () => {
  it('keeps paragraph order and trims prose', () => {
    const result = assembleManuscript(input());
    expect(result.paragraphs).toEqual(['새벽 4시의 어머니.', '강제이주라는 시작점.']);
    expect(result.chapterTitle).toBe('01장 나라 없는 사람들');
    expect(result.fromStage).toBe('퇴고');
  });

  it('drops empty or whitespace-only paragraphs', () => {
    const result = assembleManuscript(
      input({
        sections: [
          { prose: '  ', grounding: ['비트 — A'], flags: [] },
          { prose: '실문장.', grounding: ['비트 — B'], flags: [] }
        ]
      })
    );
    expect(result.paragraphs).toEqual(['실문장.']);
    expect(result.sources).toEqual(['비트 — B']);
  });

  it('unions grounding into sources, deduped and order-preserved', () => {
    const result = assembleManuscript(
      input({
        sections: [
          { prose: 'a', grounding: ['비트 — X', '카드 — Y'], flags: [] },
          { prose: 'b', grounding: ['카드 — Y', '비트 — Z'], flags: [] }
        ]
      })
    );
    expect(result.sources).toEqual(['비트 — X', '카드 — Y', '비트 — Z']);
  });

  it('carries unresolved flags, deduped', () => {
    const result = assembleManuscript(
      input({
        sections: [
          { prose: 'a', grounding: ['비트 — X'], flags: ['연도 확인 필요'] },
          { prose: 'b', grounding: ['비트 — Y'], flags: ['연도 확인 필요', '당사자 확인'] }
        ]
      })
    );
    expect(result.flags).toEqual(['연도 확인 필요', '당사자 확인']);
    expect(manuscriptHasFlags(result)).toBe(true);
  });

  it('reports no flags for a clean manuscript', () => {
    expect(manuscriptHasFlags(assembleManuscript(input()))).toBe(false);
  });

  it('ignores blank grounding and flag entries', () => {
    const result = assembleManuscript(
      input({
        sections: [{ prose: 'a', grounding: ['', '  ', '비트 — X'], flags: ['', ' '] }]
      })
    );
    expect(result.sources).toEqual(['비트 — X']);
    expect(result.flags).toEqual([]);
  });

  it('unions authoritative note-level flags so a body-parse miss cannot silently drop them', () => {
    const result = assembleManuscript(
      input({
        sections: [{ prose: 'a', grounding: ['비트 — X'], flags: [] }],
        noteFlags: ['연도(1801) 확인 필요']
      })
    );
    expect(result.flags).toEqual(['연도(1801) 확인 필요']);
    expect(manuscriptHasFlags(result)).toBe(true);
  });

  it('dedupes note-level flags against paragraph flags', () => {
    const result = assembleManuscript(
      input({
        sections: [{ prose: 'a', grounding: ['비트 — X'], flags: ['F1', 'F2'] }],
        noteFlags: ['F1', 'F3']
      })
    );
    expect(result.flags).toEqual(['F1', 'F2', 'F3']);
  });
});

describe('assembleManuscript — 적대적/엣지 입력', () => {
  it('returns an empty manuscript for no sections (caller refuses to save)', () => {
    const result = assembleManuscript(input({ sections: [] }));
    expect(result.paragraphs).toEqual([]);
    expect(result.sources).toEqual([]);
    expect(result.flags).toEqual([]);
  });

  it('returns no paragraphs when every section is whitespace-only', () => {
    const result = assembleManuscript(
      input({
        sections: [
          { prose: '   ', grounding: ['비트 — X'], flags: [] },
          { prose: '\n\t', grounding: ['비트 — Y'], flags: [] }
        ]
      })
    );
    expect(result.paragraphs).toEqual([]);
  });

  it('still surfaces note-level flags even when no paragraph survives', () => {
    const result = assembleManuscript(
      input({ sections: [{ prose: '   ', grounding: [], flags: [] }], noteFlags: ['확인 필요'] })
    );
    expect(result.paragraphs).toEqual([]);
    expect(result.flags).toEqual(['확인 필요']);
  });

  it('handles a very long paragraph without truncation or crash', () => {
    const long = '가'.repeat(60000);
    const result = assembleManuscript(input({ sections: [{ prose: long, grounding: ['비트 — X'], flags: [] }] }));
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].length).toBe(60000);
  });

  it('passes adversarial link/flag text through verbatim (escaping is the serializer\'s job)', () => {
    const evil = '비트 — A]] injected "quote"\nNEWLINE';
    const result = assembleManuscript(
      input({ sections: [{ prose: '문장.', grounding: [evil], flags: ['주입 "공격"'] }] })
    );
    expect(result.sources).toEqual([evil]);
    expect(result.flags).toEqual(['주입 "공격"']);
  });
});
