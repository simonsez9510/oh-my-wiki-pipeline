import { extractYears, languageDirective, type ResearchCard, type WritingLanguage } from './beats';

export interface SourceBeat {
  title: string;
  line: string;
  sources: string[];
  path?: string;
}

export interface DraftInput {
  chapterTitle: string;
  beats: SourceBeat[];
  cards: ResearchCard[];
  feedback?: string;
  language?: WritingLanguage;
}

export interface DraftSection {
  beatTitle: string;
  prose: string;
  sources: string[];
  flags: string[];
  blocking: boolean;
}

interface DraftSectionDraft {
  beatTitle: string;
  prose: string;
  sources: string[];
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function draftToolSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        minItems: 1,
        maxItems: 30,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['beatTitle', 'prose', 'sources'],
          properties: {
            beatTitle: { type: 'string', description: '이 산문이 살을 붙이는 승인된 비트의 제목(정확히 일치)' },
            prose: { type: 'string', description: '그 비트를 펼친 산문 단락 (출력 언어 지시에 따름)' },
            sources: {
              type: 'array',
              items: { type: 'string' },
              description: '이 단락의 근거 카드 제목 — 반드시 해당 비트의 sources 중에서만'
            }
          }
        }
      }
    }
  };
}

export function buildDraftMessages(input: DraftInput): { system: string; user: string } {
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const beats = input.beats.map((beat) => ({
    title: beat.title,
    line: beat.line,
    sources: beat.sources,
    evidence: beat.sources
      .map((title) => {
        const card = cardByTitle.get(title);
        return card ? `${card.summary} ${card.evidence}`.trim() : '';
      })
      .filter((text) => text !== '')
  }));

  return {
    system:
      '당신은 한국어 책의 집필 조교다. 저자가 아니라 조교다. 승인된 비트(장면 뼈대)들을 받아 각각을 자연스러운 산문 단락으로 펼친다. 비트의 순서를 유지하고, 비트마다 정확히 한 단락을 쓴다. 도구를 정확히 한 번 호출한다. 각 비트의 line과 그 비트가 인용한 카드 근거(evidence)에 있는 사실만으로 산문을 써라. 비트·카드에 없는 사실·연도·인명·장소를 절대 새로 만들지 마라. 불확실하면 단정하지 말고 그 취지를 드러내라. 각 단락은 해당 비트의 sources만 인용한다.' +
      languageDirective(input.language, 'draft'),
    user: JSON.stringify({
      instruction:
        '아래 승인된 비트들을 순서대로 각각 산문 단락으로 펼쳐라(출력 언어는 시스템 지시를 따른다). 각 항목은 {beatTitle, prose, sources}. beatTitle은 아래 비트 제목과 정확히 일치, sources는 그 비트의 sources 중에서만.',
      chapter: input.chapterTitle,
      beats,
      ...(input.feedback && input.feedback.trim() !== ''
        ? { revisionFeedback: input.feedback.trim() }
        : {})
    })
  };
}

function evaluateSection(
  draft: DraftSectionDraft,
  beatByTitle: Map<string, SourceBeat>,
  cardByTitle: Map<string, ResearchCard>
): DraftSection | null {
  const beatTitle = draft.beatTitle.trim();
  const prose = draft.prose.trim();
  if (prose === '') {
    return null;
  }
  const beat = beatByTitle.get(beatTitle);
  if (!beat) {
    return null;
  }

  const allowed = new Set(beat.sources);
  const sources = [...new Set(draft.sources.filter((title) => allowed.has(title) && cardByTitle.has(title)))];

  const citedText = collapseWhitespace(
    [beat.line, ...sources.map((title) => {
      const card = cardByTitle.get(title);
      return card ? `${card.summary} ${card.evidence}` : '';
    })].join(' ')
  );
  const citedYears = new Set(extractYears(citedText));

  const flags: string[] = [];
  let blocking = false;
  if (sources.length === 0) {
    flags.push('출처 없음 — 비트의 근거 카드를 연결하세요 (저장 불가)');
    blocking = true;
  }
  const novelYears = extractYears(prose).filter((year) => !citedYears.has(year));
  if (novelYears.length > 0) {
    flags.push(`비트·카드에 없는 연도(${novelYears.join(', ')}) — 사실 확인 필요`);
  }

  return { beatTitle, prose, sources, flags, blocking };
}

export function normalizeDraftSections(input: DraftInput, raw: unknown): DraftSection[] {
  const beatByTitle = new Map(input.beats.map((beat) => [beat.title, beat]));
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));

  const rawSections =
    raw && typeof raw === 'object' && Array.isArray((raw as { sections?: unknown }).sections)
      ? (raw as { sections: unknown[] }).sections
      : [];

  const result: DraftSection[] = [];
  for (const entry of rawSections) {
    const section = (entry ?? {}) as { beatTitle?: unknown; prose?: unknown; sources?: unknown };
    const draft: DraftSectionDraft = {
      beatTitle: typeof section.beatTitle === 'string' ? section.beatTitle : '',
      prose: typeof section.prose === 'string' ? section.prose : '',
      sources: Array.isArray(section.sources)
        ? section.sources.filter((value): value is string => typeof value === 'string')
        : []
    };
    const evaluated = evaluateSection(draft, beatByTitle, cardByTitle);
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}

export function revalidateDraftSections(sections: DraftSection[], input: DraftInput): DraftSection[] {
  const beatByTitle = new Map(input.beats.map((beat) => [beat.title, beat]));
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));
  const result: DraftSection[] = [];
  for (const section of sections) {
    const evaluated = evaluateSection(
      { beatTitle: section.beatTitle, prose: section.prose, sources: section.sources },
      beatByTitle,
      cardByTitle
    );
    if (evaluated) {
      result.push(evaluated);
    }
  }
  return result;
}

export interface SavableDraftSection {
  section: DraftSection;
  beat: SourceBeat;
  sourceCards: ResearchCard[];
}

export function selectSavableDraftSections(sections: DraftSection[], input: DraftInput): SavableDraftSection[] {
  const beatByTitle = new Map(input.beats.map((beat) => [beat.title, beat]));
  const cardByTitle = new Map(input.cards.map((card) => [card.title, card]));

  const result: SavableDraftSection[] = [];
  for (const section of sections) {
    if (section.prose.trim() === '') {
      continue;
    }
    const beat = beatByTitle.get(section.beatTitle);
    if (!beat) {
      continue;
    }
    const allowed = new Set(beat.sources);
    const sourceCards = section.sources
      .filter((title) => allowed.has(title))
      .map((title) => cardByTitle.get(title))
      .filter((card): card is ResearchCard => card !== undefined);
    if (section.blocking || sourceCards.length === 0) {
      continue;
    }
    result.push({ section, beat, sourceCards });
  }
  return result;
}
