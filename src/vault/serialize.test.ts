import { describe, it, expect } from 'vitest';
import {
  buildBeatNoteContent,
  buildDraftNoteContent,
  buildManuscriptNoteContent,
  buildRevisionNoteContent,
  disambiguateCardTitles,
  extractSection,
  extractWikiLink,
  extractWikiLinks,
  parseBeatNote,
  parseDraftNote,
  sanitizeVaultFolder,
  stripFrontmatter,
  toResearchCard,
  uniqueBasename,
  vaultPathMatches
} from './serialize';
import type { Beat, ResearchCard } from '../ai/beats';

const beat = (overrides: Partial<Beat> = {}): Beat => ({
  title: '안산 도착',
  line: '김가원 어르신이 안산역에 내린다.',
  quote: '안산에 도착했다.',
  sources: ['인물 — 김가원', '인터뷰 — 김가원 20260601'],
  flags: [],
  blocking: false,
  ...overrides
});

describe('buildBeatNoteContent', () => {
  it('writes stage/mode/status frontmatter and a quoted chapter wikilink', () => {
    const content = buildBeatNoteContent(beat(), '3장 — 안산 정착', [
      '인물 — 김가원',
      '인터뷰 — 김가원 20260601'
    ]);
    expect(content).toContain('stage: 비트');
    expect(content).toContain('status: 승인');
    expect(content).toContain('chapter: "[[3장 — 안산 정착]]"');
    expect(content).toContain('  - "[[인물 — 김가원]]"');
  });

  it('uses the provided canonical source links, not the raw beat titles', () => {
    const content = buildBeatNoteContent(beat(), '3장', ['카드/인물 — 김가원']);
    expect(content).toContain('  - "[[카드/인물 — 김가원]]"');
  });

  it('serializes empty sources/flags as an inline empty list', () => {
    const content = buildBeatNoteContent(beat({ flags: [] }), '3장', []);
    expect(content).toContain('sources: []');
    expect(content).toContain('flags: []');
    expect(content).toContain('(출처 미연결)');
  });

  it('renders a 확인 필요 block when flags exist', () => {
    const content = buildBeatNoteContent(beat({ flags: ['원문에 없는 연도(1937) — 사실 확인 필요'] }), '3장', [
      '인물 — 김가원'
    ]);
    expect(content).toContain('## 확인 필요');
    expect(content).toContain('1937');
  });
});

describe('stripFrontmatter / extractSection / toResearchCard', () => {
  const md = '---\npage_type: wiki_card\n---\n\n## 요약\n안산에 정착한 어르신.\n\n## 원문 근거\n1935년 출생.\n';

  it('removes the frontmatter block', () => {
    expect(stripFrontmatter(md).startsWith('## 요약')).toBe(true);
  });

  it('extracts a named section body', () => {
    expect(extractSection(md, '요약')).toBe('안산에 정착한 어르신.');
    expect(extractSection(md, '원문 근거')).toBe('1935년 출생.');
  });

  it('builds a research card with its path', () => {
    const card = toResearchCard('인물 — 김가원', '카드/인물 — 김가원.md', md);
    expect(card.path).toBe('카드/인물 — 김가원.md');
    expect(card.summary).toBe('안산에 정착한 어르신.');
    expect(card.evidence).toBe('1935년 출생.');
  });
});

describe('parseDraftNote / buildRevisionNoteContent', () => {
  it('round-trips a draft note body back into prose + grounding sections', () => {
    const draft = buildDraftNoteContent('3장', '3장', [
      { prose: '단락 하나.', beatLink: '비트 — A', sourceLinks: ['카드1'], flags: [] },
      { prose: '단락 둘.', beatLink: '비트 — B', sourceLinks: ['카드2'], flags: ['플래그'] }
    ]);
    const parsed = parseDraftNote(draft);
    expect(parsed).toEqual([
      { prose: '단락 하나.', grounding: ['비트 — A', '카드1'], flags: [] },
      { prose: '단락 둘.', grounding: ['비트 — B', '카드2'], flags: ['플래그'] }
    ]);
  });

  it('writes a stage:퇴고 note that keeps the inherited grounding', () => {
    const content = buildRevisionNoteContent('3장', '3장', [
      { prose: '다듬은 글.', grounding: ['비트 — A', '카드1'], flags: [] }
    ]);
    expect(content).toContain('stage: 퇴고');
    expect(content).toContain('page_type: revision');
    expect(content).toContain('# 3장 (퇴고)');
    expect(content).toContain('> 근거: [[비트 — A]] · [[카드1]]');
  });
});

describe('buildManuscriptNoteContent', () => {
  const data = {
    paragraphs: ['첫 단락.', '둘째 단락.'],
    sources: ['비트 — A', '카드1', '비트 — B'],
    flags: [],
    assembledFrom: '퇴고 — 3장',
    fromStage: '퇴고'
  };

  it('writes stage:원고 frontmatter with chapter, source_stage and assembled_from links', () => {
    const content = buildManuscriptNoteContent('3장', '3장', data);
    expect(content).toContain('page_type: manuscript');
    expect(content).toContain('stage: 원고');
    expect(content).toContain('status: 승인');
    expect(content).toContain('chapter: "[[3장]]"');
    expect(content).toContain('source_stage: "퇴고"');
    expect(content).toContain('assembled_from: "[[퇴고 — 3장]]"');
    expect(content).toContain('  - "[[비트 — A]]"');
    expect(content).toContain('  - "[[카드1]]"');
  });

  it('renders clean paragraphs with no 근거 annotation lines', () => {
    const content = buildManuscriptNoteContent('3장', '3장', data);
    expect(content).toContain('# 3장 (원고)');
    expect(content).toContain('첫 단락.\n\n둘째 단락.');
    expect(content).not.toContain('> 근거:');
  });

  it('surfaces unresolved flags as a 확인 필요 section and frontmatter list', () => {
    const content = buildManuscriptNoteContent('3장', '3장', {
      ...data,
      flags: ['연도(1937) 확인 필요']
    });
    expect(content).toContain('## 확인 필요');
    expect(content).toContain('- ⚠️ 연도(1937) 확인 필요');
  });

  it('serializes empty sources/flags as inline empty lists', () => {
    const content = buildManuscriptNoteContent('3장', '3장', {
      ...data,
      sources: [],
      flags: []
    });
    expect(content).toContain('sources: []');
    expect(content).toContain('flags: []');
    expect(content).not.toContain('## 확인 필요');
  });
});

describe('buildManuscriptNoteContent — 적대적 입력 (YAML/링크 주입)', () => {
  const base = {
    paragraphs: ['문장.'],
    sources: [],
    flags: [],
    assembledFrom: '퇴고 — 3장',
    fromStage: '퇴고'
  };

  it('escapes quotes and collapses newlines in the chapter link so frontmatter stays one line', () => {
    const content = buildManuscriptNoteContent('3장', '평화"의\n장 ]]', base);
    const chapterLine = content.split('\n').find((line) => line.startsWith('chapter:'));
    expect(chapterLine).toBeDefined();
    expect(chapterLine).toContain('\\"');
    expect(chapterLine).not.toMatch(/\n/);
  });

  it('neutralizes quotes/newlines/]] inside a source linktext', () => {
    const content = buildManuscriptNoteContent('3장', '3장', {
      ...base,
      sources: ['카드 — A]] "; injected:\ntrue']
    });
    const sourceLines = content.split('\n').filter((line) => line.trim().startsWith('- "[['));
    expect(sourceLines).toHaveLength(1);
    expect(sourceLines[0]).toContain('\\"');
    expect(sourceLines[0]).not.toMatch(/^\s*-\s*"\[\[.*\n/);
  });

  it('keeps the real frontmatter intact even when a paragraph contains a --- fence', () => {
    const content = buildManuscriptNoteContent('3장', '3장', {
      ...base,
      paragraphs: ['---\npage_type: fake\nstage: 위조\n---', '진짜 문장.']
    });
    expect(content.startsWith('---\npage_type: manuscript\nstage: 원고\n')).toBe(true);
  });

  it('collapses newlines inside a body flag so it cannot inject extra markdown lines', () => {
    const content = buildManuscriptNoteContent('3장', '3장', {
      ...base,
      flags: ['연도 확인 필요\n- ⚠️ 위조된 줄\n## 가짜 제목']
    });
    const flagLines = content.split('\n').filter((line) => line.startsWith('- ⚠️'));
    expect(flagLines).toHaveLength(1);
    expect(flagLines[0]).toBe('- ⚠️ 연도 확인 필요 - ⚠️ 위조된 줄 ## 가짜 제목');
  });
});

describe('uniqueBasename — 경로 탈출 방지', () => {
  it('strips path separators from an adversarial chapter-derived basename', () => {
    const name = uniqueBasename('원고 — ../../secret', new Set());
    expect(name).not.toMatch(/[\\/]/);
  });
});

describe('vaultPathMatches', () => {
  it('passes when no expected path is configured', () => {
    expect(vaultPathMatches('C:/anything', '').ok).toBe(true);
  });

  it('matches ignoring slash direction, trailing slash and case', () => {
    expect(vaultPathMatches('G:\\내 드라이브\\my-vault', 'g:/내 드라이브/my-vault/').ok).toBe(true);
  });

  it('blocks when the active vault differs from the expected canonical path', () => {
    const result = vaultPathMatches('C:/OneDrive/my-vault', 'G:/내 드라이브/my-vault');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('중단');
  });

  it('blocks when the base path is unknown', () => {
    expect(vaultPathMatches(null, 'G:/내 드라이브/my-vault').ok).toBe(false);
  });
});

describe('sanitizeVaultFolder', () => {
  it('passes an empty folder (vault root)', () => {
    expect(sanitizeVaultFolder('')).toBe('');
  });

  it('keeps a normal vault-relative folder and collapses empty segments', () => {
    expect(sanitizeVaultFolder('비트/3장')).toBe('비트/3장');
    expect(sanitizeVaultFolder('비트//3장')).toBe('비트/3장');
    expect(sanitizeVaultFolder('비트\\3장')).toBe('비트/3장');
  });

  it('rejects traversal, absolute and drive-like paths', () => {
    expect(sanitizeVaultFolder('../밖')).toBeNull();
    expect(sanitizeVaultFolder('비트/../밖')).toBeNull();
    expect(sanitizeVaultFolder('/절대경로')).toBeNull();
    expect(sanitizeVaultFolder('C:/드라이브')).toBeNull();
  });
});

describe('disambiguateCardTitles', () => {
  const card = (title: string, path: string): ResearchCard => ({ title, path, summary: '', evidence: '' });

  it('suffixes duplicate basenames with their folder and leaves unique ones alone', () => {
    const result = disambiguateCardTitles([
      card('인터뷰', '자료/A/인터뷰.md'),
      card('인터뷰', '자료/B/인터뷰.md'),
      card('인물 — 김가원', '자료/인물 — 김가원.md')
    ]);
    expect(result.map((c) => c.title)).toEqual(['인터뷰 (자료/A)', '인터뷰 (자료/B)', '인물 — 김가원']);
  });
});

describe('extractWikiLink / extractWikiLinks', () => {
  it('extracts the linktext, dropping any alias', () => {
    expect(extractWikiLink('"[[인물 — 김가원]]"')).toBe('인물 — 김가원');
    expect(extractWikiLink('[[카드/인물|김가원]]')).toBe('카드/인물');
  });

  it('returns null when there is no wikilink', () => {
    expect(extractWikiLink('그냥 텍스트')).toBeNull();
  });

  it('extracts every link when a value holds more than one', () => {
    expect(extractWikiLinks('[[인물 — 김가원]] [[인터뷰 — 김가원 20260601]]')).toEqual([
      '인물 — 김가원',
      '인터뷰 — 김가원 20260601'
    ]);
    expect(extractWikiLinks('링크 없음')).toEqual([]);
  });
});

describe('parseBeatNote', () => {
  const note = '---\nstage: 비트\n---\n\n# 안산역 도착\n\n김가원가 안산역에 내린다.\n\n## 출처\n- [[인물 — 김가원]]\n';

  it('reads the title (H1) and line (first body paragraph)', () => {
    expect(parseBeatNote(note, '비트 — 안산역 도착')).toEqual({ title: '안산역 도착', line: '김가원가 안산역에 내린다.' });
  });

  it('falls back to the basename (minus prefix) when there is no H1', () => {
    const result = parseBeatNote('본문만 있는 노트.', '비트 — 폴백 제목');
    expect(result.title).toBe('폴백 제목');
    expect(result.line).toBe('본문만 있는 노트.');
  });
});

describe('buildDraftNoteContent', () => {
  const sections = [
    { prose: '김가원가 안산역 계단을 내려온다.', beatLink: '비트 — 안산역 도착', sourceLinks: ['인물 — 김가원'], flags: [] },
    { prose: '그는 화물열차의 기억을 떠올린다.', beatLink: '비트 — 강제이주 회상', sourceLinks: ['인터뷰 — 김가원 20260601'], flags: ['비트·카드에 없는 연도(1945) — 사실 확인 필요'] }
  ];

  it('writes stage:초안 frontmatter with a unioned source list', () => {
    const content = buildDraftNoteContent('3장 — 안산 정착', '3장 — 안산 정착', sections);
    expect(content).toContain('stage: 초안');
    expect(content).toContain('page_type: draft');
    expect(content).toContain('chapter: "[[3장 — 안산 정착]]"');
    expect(content).toContain('  - "[[비트 — 안산역 도착]]"');
    expect(content).toContain('  - "[[인물 — 김가원]]"');
    expect(content).toContain('# 3장 — 안산 정착 (초안)');
  });

  it('renders each section prose with a 근거 line and surfaces flags', () => {
    const content = buildDraftNoteContent('3장', '3장', sections);
    expect(content).toContain('> 근거: [[비트 — 안산역 도착]] · [[인물 — 김가원]]');
    expect(content).toContain('> ⚠️ 비트·카드에 없는 연도(1945) — 사실 확인 필요');
  });
});

describe('uniqueBasename', () => {
  it('returns the cleaned name when unused', () => {
    expect(uniqueBasename('비트 — 안산 도착', new Set())).toBe('비트 — 안산 도착');
  });

  it('appends a numeric suffix on collision', () => {
    const existing = new Set(['비트 — 도착', '비트 — 도착 2']);
    expect(uniqueBasename('비트 — 도착', existing)).toBe('비트 — 도착 3');
  });

  it('strips filesystem-illegal characters', () => {
    expect(uniqueBasename('비트: 도착/장면?', new Set())).toBe('비트 도착 장면');
  });
});
