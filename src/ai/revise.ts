import { extractYears, languageDirective, type WritingLanguage } from './beats';

export interface DraftRefSection {
  prose: string;
  grounding: string[];
  flags: string[];
}

export interface ReviseInput {
  chapterTitle: string;
  sections: DraftRefSection[];
  feedback?: string;
  language?: WritingLanguage;
}

export interface RevisedSection {
  prose: string;
  grounding: string[];
  flags: string[];
}

const REVISION_YEAR_FLAG_PREFIX = '초안에 없는 연도';

function revisionYearFlag(years: string[]): string {
  return `${REVISION_YEAR_FLAG_PREFIX}(${years.join(', ')}) — 퇴고가 추가함, 사실 확인 필요`;
}

function draftAllowedYears(sections: DraftRefSection[]): Set<string> {
  return new Set(sections.flatMap((section) => extractYears(section.prose)));
}

export function reviseToolSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        minItems: 1,
        maxItems: 60,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['index', 'prose'],
          properties: {
            index: { type: 'integer', description: '다듬을 원본 단락의 번호(0부터)' },
            prose: { type: 'string', description: '다듬은 산문 단락 (출력 언어 지시에 따름)' }
          }
        }
      }
    }
  };
}

export function buildReviseMessages(input: ReviseInput): { system: string; user: string } {
  return {
    system:
      '당신은 한국어 책의 퇴고 편집자다. 주어진 초안 단락들을 더 자연스럽고 리듬 있게 다듬되, 새로운 사실·연도·인명·장소·사건을 절대 추가하지 마라. 원문의 사실과 의미를 보존하고, 출처는 바꾸지 않는다. 각 단락을 같은 번호(index)로 돌려준다. 도구를 정확히 한 번 호출한다.' +
      languageDirective(input.language, 'revise'),
    user: JSON.stringify({
      instruction:
        '아래 번호가 매겨진 초안 단락들을 각각 다듬어라. 각 항목은 {index, prose}. index는 원본 그대로 두고, prose는 다듬은 글. 사실·연도·고유명사를 새로 추가하지 마라.',
      chapter: input.chapterTitle,
      sections: input.sections.map((section, index) => ({ index, prose: section.prose })),
      ...(input.feedback && input.feedback.trim() !== ''
        ? { revisionFeedback: input.feedback.trim() }
        : {})
    })
  };
}

export function normalizeRevisions(input: ReviseInput, raw: unknown): RevisedSection[] {
  const rawSections =
    raw && typeof raw === 'object' && Array.isArray((raw as { sections?: unknown }).sections)
      ? (raw as { sections: unknown[] }).sections
      : [];

  const revisedByIndex = new Map<number, string>();
  const seen = new Set<number>();
  for (const entry of rawSections) {
    const section = (entry ?? {}) as { index?: unknown; prose?: unknown };
    const index = typeof section.index === 'number' ? section.index : Number.NaN;
    if (!Number.isInteger(index) || index < 0 || index >= input.sections.length) {
      continue;
    }
    if (seen.has(index)) {
      revisedByIndex.delete(index);
      continue;
    }
    seen.add(index);
    const prose = typeof section.prose === 'string' ? section.prose.trim() : '';
    if (prose !== '') {
      revisedByIndex.set(index, prose);
    }
  }

  const allowedYears = draftAllowedYears(input.sections);
  const result: RevisedSection[] = [];
  input.sections.forEach((original, index) => {
    const revised = revisedByIndex.get(index);
    const prose = revised && revised !== '' ? revised : original.prose;
    if (prose.trim() === '') {
      return;
    }
    const flags = [...original.flags];
    const novelYears = extractYears(prose).filter((year) => !allowedYears.has(year));
    if (novelYears.length > 0) {
      flags.push(revisionYearFlag(novelYears));
    }
    result.push({ prose, grounding: original.grounding, flags: [...new Set(flags)] });
  });
  return result;
}

export function revalidateRevisedSections(sections: RevisedSection[], allowedYears: Set<string>): RevisedSection[] {
  const result: RevisedSection[] = [];
  for (const section of sections) {
    if (section.prose.trim() === '') {
      continue;
    }
    const keptFlags = section.flags.filter((flag) => !flag.startsWith(REVISION_YEAR_FLAG_PREFIX));
    const novelYears = extractYears(section.prose).filter((year) => !allowedYears.has(year));
    const flags = novelYears.length > 0 ? [...keptFlags, revisionYearFlag(novelYears)] : keptFlags;
    result.push({ prose: section.prose, grounding: section.grounding, flags: [...new Set(flags)] });
  }
  return result;
}

export function allowedYearsForRevision(sections: DraftRefSection[]): Set<string> {
  return draftAllowedYears(sections);
}
