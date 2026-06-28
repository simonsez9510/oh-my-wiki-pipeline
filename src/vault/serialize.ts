import type { Beat, ResearchCard } from '../ai/beats';

export function stripFrontmatter(markdown: string): string {
  if (!markdown.startsWith('---')) {
    return markdown.trim();
  }
  const close = markdown.indexOf('\n---', 3);
  if (close === -1) {
    return markdown.trim();
  }
  const afterLine = markdown.indexOf('\n', close + 1);
  return (afterLine === -1 ? '' : markdown.slice(afterLine + 1)).trim();
}

export function extractSection(markdown: string, heading: string): string {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const collected: string[] = [];
  let capturing = false;
  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      if (capturing) {
        break;
      }
      const title = headingMatch[1].trim();
      capturing = title === heading || title.startsWith(heading);
      continue;
    }
    if (capturing) {
      collected.push(line);
    }
  }
  return collected.join('\n').trim();
}

export function firstParagraph(markdown: string): string {
  for (const block of stripFrontmatter(markdown).split(/\r?\n\s*\r?\n/)) {
    const trimmed = block.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      return trimmed;
    }
  }
  return '';
}

export function toResearchCard(title: string, path: string, markdown: string): ResearchCard {
  const summary = extractSection(markdown, '요약') || firstParagraph(markdown);
  const evidence = extractSection(markdown, '원문 근거') || extractSection(markdown, '근거');
  return { title, path, summary, evidence };
}

function parentDir(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? '' : path.slice(0, slash);
}

export function disambiguateTitles<T extends { title: string; path?: string }>(items: T[]): T[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.title, (counts.get(item.title) ?? 0) + 1);
  }
  return items.map((item) => {
    if ((counts.get(item.title) ?? 0) <= 1) {
      return item;
    }
    const dir = item.path ? parentDir(item.path) : '';
    return dir === '' ? item : { ...item, title: `${item.title} (${dir})` };
  });
}

export function disambiguateCardTitles(cards: ResearchCard[]): ResearchCard[] {
  return disambiguateTitles(cards);
}

export function wikiLink(linktext: string): string {
  return `[[${linktext.replace(/[\r\n]+/g, ' ').trim()}]]`;
}

function yamlScalar(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

function yamlBlockList(values: string[]): string {
  if (values.length === 0) {
    return ' []';
  }
  return `\n${values.map((value) => `  - ${yamlScalar(value)}`).join('\n')}`;
}

export function buildBeatNoteContent(beat: Beat, chapterLink: string, sourceLinks: string[]): string {
  const frontmatter = [
    'page_type: beat',
    'stage: 비트',
    'status: 승인',
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `sources:${yamlBlockList(sourceLinks.map(wikiLink))}`,
    `flags:${yamlBlockList(beat.flags)}`
  ].join('\n');

  const sourceLines = sourceLinks.length > 0
    ? sourceLinks.map((link) => `- ${wikiLink(link)}`).join('\n')
    : '- (출처 미연결)';
  const flagBlock = beat.flags.length > 0
    ? `\n## 확인 필요\n${beat.flags.map((flag) => `- ⚠️ ${flag}`).join('\n')}`
    : '';

  const body = [`# ${beat.title}`, '', beat.line, '', '## 출처', sourceLines, flagBlock]
    .join('\n')
    .trimEnd();

  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

export function extractWikiLinks(value: string): string[] {
  const links: string[] = [];
  const pattern = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
  let match = pattern.exec(value);
  while (match !== null) {
    links.push(match[1].trim());
    match = pattern.exec(value);
  }
  return links;
}

export function extractWikiLink(value: string): string | null {
  return extractWikiLinks(value)[0] ?? null;
}

export function parseBeatNote(markdown: string, basename: string): { title: string; line: string } {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  let title = basename.replace(/^비트 — /, '').trim();
  let line = '';
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^#\s+(.*)$/);
    if (heading) {
      title = heading[1].trim();
      bodyStart = i + 1;
      break;
    }
  }
  for (let i = bodyStart; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed === '') {
      continue;
    }
    if (trimmed.startsWith('#')) {
      break;
    }
    line = trimmed;
    break;
  }
  return { title, line };
}

export interface DraftNoteSection {
  prose: string;
  beatLink: string;
  sourceLinks: string[];
  flags: string[];
}

export function buildDraftNoteContent(
  chapterHeading: string,
  chapterLink: string,
  sections: DraftNoteSection[]
): string {
  const allSources = [...new Set(sections.flatMap((section) => [section.beatLink, ...section.sourceLinks]))];
  const allFlags = [...new Set(sections.flatMap((section) => section.flags))];

  const frontmatter = [
    'page_type: draft',
    'stage: 초안',
    'status: 승인',
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `sources:${yamlBlockList(allSources.map(wikiLink))}`,
    `flags:${yamlBlockList(allFlags)}`
  ].join('\n');

  const body = sections
    .map((section) => {
      const grounding = [section.beatLink, ...section.sourceLinks].map(wikiLink).join(' · ');
      const flagLines = section.flags.length > 0 ? `\n${section.flags.map((flag) => `> ⚠️ ${flag}`).join('\n')}` : '';
      return `${section.prose}\n\n> 근거: ${grounding}${flagLines}`;
    })
    .join('\n\n');

  return `---\n${frontmatter}\n---\n\n# ${chapterHeading} (초안)\n\n${body}\n`;
}

export function parseDraftNote(markdown: string): { prose: string; grounding: string[]; flags: string[] }[] {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const sections: { prose: string; grounding: string[]; flags: string[] }[] = [];
  let prose: string[] = [];
  let current: { prose: string; grounding: string[]; flags: string[] } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,6}\s/.test(trimmed)) {
      continue;
    }
    if (trimmed.startsWith('> 근거:')) {
      const text = prose.join('\n').trim();
      prose = [];
      if (text !== '') {
        current = { prose: text, grounding: extractWikiLinks(trimmed), flags: [] };
        sections.push(current);
      } else {
        current = null;
      }
      continue;
    }
    if (trimmed.startsWith('> ⚠️')) {
      if (current) {
        current.flags.push(trimmed.replace(/^>\s*⚠️\s*/, '').trim());
      }
      continue;
    }
    if (trimmed.startsWith('>')) {
      continue;
    }
    prose.push(line);
  }
  return sections;
}

export interface RevisionNoteSection {
  prose: string;
  grounding: string[];
  flags: string[];
}

export function buildRevisionNoteContent(
  chapterHeading: string,
  chapterLink: string,
  sections: RevisionNoteSection[]
): string {
  const allSources = [...new Set(sections.flatMap((section) => section.grounding))];
  const allFlags = [...new Set(sections.flatMap((section) => section.flags))];

  const frontmatter = [
    'page_type: revision',
    'stage: 퇴고',
    'status: 승인',
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `sources:${yamlBlockList(allSources.map(wikiLink))}`,
    `flags:${yamlBlockList(allFlags)}`
  ].join('\n');

  const body = sections
    .map((section) => {
      const grounding = section.grounding.map(wikiLink).join(' · ');
      const flagLines = section.flags.length > 0 ? `\n${section.flags.map((flag) => `> ⚠️ ${flag}`).join('\n')}` : '';
      return `${section.prose}\n\n> 근거: ${grounding}${flagLines}`;
    })
    .join('\n\n');

  return `---\n${frontmatter}\n---\n\n# ${chapterHeading} (퇴고)\n\n${body}\n`;
}

export interface ManuscriptNoteData {
  paragraphs: string[];
  sources: string[];
  flags: string[];
  assembledFrom: string;
  fromStage: string;
}

export function buildManuscriptNoteContent(
  chapterHeading: string,
  chapterLink: string,
  data: ManuscriptNoteData
): string {
  const frontmatter = [
    'page_type: manuscript',
    'stage: 원고',
    'status: 승인',
    `chapter: ${yamlScalar(wikiLink(chapterLink))}`,
    `source_stage: ${yamlScalar(data.fromStage)}`,
    `assembled_from: ${yamlScalar(wikiLink(data.assembledFrom))}`,
    `sources:${yamlBlockList(data.sources.map(wikiLink))}`,
    `flags:${yamlBlockList(data.flags)}`
  ].join('\n');

  const proseBody = data.paragraphs.join('\n\n');
  const flagSection = data.flags.length > 0
    ? `\n\n## 확인 필요\n${data.flags.map((flag) => `- ⚠️ ${flag.replace(/[\r\n]+/g, ' ').trim()}`).join('\n')}`
    : '';

  return `---\n${frontmatter}\n---\n\n# ${chapterHeading} (원고)\n\n${proseBody}${flagSection}\n`;
}

export function vaultPathMatches(
  basePath: string | null,
  expectedVaultPath: string
): { ok: boolean; reason?: string } {
  const expected = expectedVaultPath.trim();
  if (expected === '') {
    return { ok: true };
  }
  if (basePath === null) {
    return { ok: false, reason: 'vault 경로를 확인할 수 없어 저장을 중단합니다 (데스크톱 전용).' };
  }
  const normalize = (path: string) => path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  if (normalize(basePath) !== normalize(expected)) {
    return {
      ok: false,
      reason: `활성 vault(${basePath})가 설정된 정본 경로(${expected})와 다릅니다. 잘못된 사본일 수 있어 저장을 중단합니다.`
    };
  }
  return { ok: true };
}

export function sanitizeVaultFolder(folder: string): string | null {
  const trimmed = folder.trim().replace(/\\/g, '/');
  if (trimmed === '') {
    return '';
  }
  if (/^[a-zA-Z]:/.test(trimmed) || trimmed.startsWith('/')) {
    return null;
  }
  const segments = trimmed.split('/').filter((segment) => segment !== '');
  for (const segment of segments) {
    if (segment === '..' || segment === '.' || segment.includes(':')) {
      return null;
    }
  }
  return segments.join('/');
}

export function uniqueBasename(desired: string, existing: Set<string>): string {
  const cleaned = desired.replace(/[\\/:*?"<>|#\[\]^]/g, ' ').replace(/\s+/g, ' ').trim() || '비트';
  if (!existing.has(cleaned)) {
    return cleaned;
  }
  let suffix = 2;
  while (existing.has(`${cleaned} ${suffix}`)) {
    suffix += 1;
  }
  return `${cleaned} ${suffix}`;
}
