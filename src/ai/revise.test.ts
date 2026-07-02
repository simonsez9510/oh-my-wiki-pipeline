import { describe, it, expect } from 'vitest';
import {
  allowedYearsForRevision,
  normalizeRevisions,
  revalidateRevisedSections,
  reviseToolSchema,
  type ReviseInput
} from './revise';

const baseInput = (overrides: Partial<ReviseInput> = {}): ReviseInput => ({
  chapterTitle: '3장 — 안산 정착',
  sections: [
    { prose: '김가원가 안산역에 내린다.', grounding: ['비트 — 안산역 도착', '인물 — 김가원'], flags: [] },
    { prose: '1937년 강제이주를 회상한다.', grounding: ['비트 — 강제이주 회상', '인터뷰 — 김가원 20260601'], flags: ['확인 필요 메모'] }
  ],
  ...overrides
});

describe('normalizeRevisions', () => {
  it('revises each section by index and carries grounding forward', () => {
    const result = normalizeRevisions(baseInput(), {
      sections: [
        { index: 0, prose: '김가원가 천천히 안산역 계단을 내려선다.' },
        { index: 1, prose: '그는 화물열차의 기억을 더듬는다.' }
      ]
    });
    expect(result).toHaveLength(2);
    expect(result[0].prose).toBe('김가원가 천천히 안산역 계단을 내려선다.');
    expect(result[0].grounding).toEqual(['비트 — 안산역 도착', '인물 — 김가원']);
  });

  it('carries the original draft flags into the revision', () => {
    const result = normalizeRevisions(baseInput(), { sections: [{ index: 1, prose: '강제이주를 떠올린다.' }] });
    expect(result[1].flags).toContain('확인 필요 메모');
  });

  it('flags a year the revision introduces that is not anywhere in the draft', () => {
    const result = normalizeRevisions(baseInput(), { sections: [{ index: 0, prose: '김가원가 1945년 안산역에 내린다.' }] });
    expect(result[0].flags.some((flag) => flag.includes('1945'))).toBe(true);
  });

  it('does not flag a year present anywhere in the draft (chapter-level)', () => {
    const result = normalizeRevisions(baseInput(), { sections: [{ index: 0, prose: '1937년에 김가원가 안산역에 내린다.' }] });
    expect(result[0].flags.some((flag) => flag.includes('1937'))).toBe(false);
  });

  it('keeps the original prose for a section the model omitted', () => {
    const result = normalizeRevisions(baseInput(), { sections: [{ index: 0, prose: '다듬은 첫 단락.' }] });
    expect(result[1].prose).toBe('1937년 강제이주를 회상한다.');
  });

  it('drops an out-of-range index and falls back to the original', () => {
    const result = normalizeRevisions(baseInput(), {
      sections: [{ index: 5, prose: '엉뚱한 단락' }, { index: 0, prose: '다듬음' }]
    });
    expect(result).toHaveLength(2);
    expect(result[0].prose).toBe('다듬음');
    expect(result[1].prose).toBe('1937년 강제이주를 회상한다.');
  });

  it('falls back to the original on a duplicate index', () => {
    const result = normalizeRevisions(baseInput(), {
      sections: [{ index: 0, prose: '첫 번째' }, { index: 0, prose: '중복' }]
    });
    expect(result[0].prose).toBe('김가원가 안산역에 내린다.');
  });

  it('falls back to the originals for a malformed payload', () => {
    const result = normalizeRevisions(baseInput(), { sections: 'nope' });
    expect(result.map((section) => section.prose)).toEqual([
      '김가원가 안산역에 내린다.',
      '1937년 강제이주를 회상한다.'
    ]);
  });
});

describe('revalidateRevisedSections', () => {
  it('re-flags an edited year not in the draft and preserves inherited flags', () => {
    const allowed = allowedYearsForRevision(baseInput().sections);
    const edited = [{ prose: '김가원가 2002년 안산역에 내린다.', grounding: ['비트 — 안산역 도착'], flags: ['확인 필요 메모'] }];
    const result = revalidateRevisedSections(edited, allowed);
    expect(result[0].flags).toContain('확인 필요 메모');
    expect(result[0].flags.some((flag) => flag.includes('2002'))).toBe(true);
  });

  it('drops a stale revision year flag when the edit removed the year', () => {
    const allowed = allowedYearsForRevision(baseInput().sections);
    const edited = [
      { prose: '연도 없는 문장.', grounding: ['비트 — A'], flags: ['초안에 없는 연도(2002) — 퇴고가 추가함, 사실 확인 필요'] }
    ];
    const result = revalidateRevisedSections(edited, allowed);
    expect(result[0].flags.some((flag) => flag.includes('초안에 없는 연도'))).toBe(false);
  });
});

describe('reviseToolSchema', () => {
  it('requires a sections array of {index, prose}', () => {
    const schema = reviseToolSchema() as Record<string, any>;
    expect(schema.required).toContain('sections');
    expect(schema.properties.sections.items.required).toEqual(['index', 'prose']);
  });
});
