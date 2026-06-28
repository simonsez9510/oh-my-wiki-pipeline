import { Notice, TFile } from 'obsidian';
import type OmwPipelinePlugin from '../main';
import type { DraftInput } from '../ai/draft';
import { revalidateDraftSections } from '../ai/draft';
import { normalizeLanguage } from '../ai/beats';
import { AnthropicError, requestDraft } from '../ai/client';
import { DraftApprovalModal } from '../ui/DraftApprovalModal';
import { loadLocalKey } from '../secret';
import { sanitizeVaultFolder } from '../vault/serialize';
import { checkVaultGuard, collectApprovedBeats, saveDraftNote } from '../vault/notes';

export async function proposeDraftCommand(plugin: OmwPipelinePlugin): Promise<void> {
  const { app, settings } = plugin;

  const file = app.workspace.getActiveFile();
  if (!(file instanceof TFile)) {
    new Notice('장(목차) 노트를 먼저 여세요.');
    return;
  }

  const guard = checkVaultGuard(app, settings.expectedVaultPath);
  if (!guard.ok) {
    new Notice(guard.reason ?? 'vault 경로 가드에 막혀 중단했습니다.');
    return;
  }

  const requestedFolder = settings.beatFolder !== '' ? settings.beatFolder : file.parent?.path ?? '';
  const folder = sanitizeVaultFolder(requestedFolder);
  if (folder === null) {
    new Notice('비트/초안 노트 폴더 경로가 올바르지 않습니다. 설정에서 vault 내부 상대 경로로 지정하세요.');
    return;
  }

  const { beats, cards } = await collectApprovedBeats(app, file);
  if (beats.length === 0) {
    new Notice('이 장에 승인된 비트(stage:비트·status:승인)가 없습니다. 먼저 비트를 제안·승인하세요.');
    return;
  }

  const language = normalizeLanguage(app.metadataCache.getFileCache(file)?.frontmatter?.lang);

  const generate = async (feedback?: string): Promise<void> => {
    const input: DraftInput = {
      chapterTitle: file.basename,
      beats,
      cards,
      feedback,
      language
    };

    const progress = new Notice('초안 생성 중…', 0);
    let sections;
    try {
      sections = await requestDraft(loadLocalKey(), settings.model, input);
    } catch (error) {
      progress.hide();
      new Notice(error instanceof AnthropicError ? error.message : '초안 생성에 실패했습니다.');
      return;
    }
    progress.hide();

    if (sections.length === 0) {
      new Notice('생성된 초안이 없습니다. 비트 내용을 확인하거나 다시 시도하세요.');
      return;
    }

    new DraftApprovalModal(app, sections, {
      onApprove: async (selected) => {
        const revalidated = revalidateDraftSections(selected, input);
        if (revalidated.length === 0) {
          new Notice('채택된 초안이 출처 미연결·미검증이라 저장하지 않았습니다.');
          return;
        }
        const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
        if (!saveGuard.ok) {
          new Notice(saveGuard.reason ?? 'vault 경로 가드에 막혀 저장을 중단했습니다.');
          return;
        }
        try {
          const created = await saveDraftNote(app, revalidated, file, beats, cards, folder);
          if (created === null) {
            new Notice('저장 가능한 초안 단락이 없어 저장하지 않았습니다.');
            return;
          }
          const dropped = selected.length - revalidated.length;
          const skipped = dropped > 0 ? ` (미검증 ${dropped}건 제외)` : '';
          new Notice(`초안 노트를 저장했습니다${skipped}.`);
        } catch (error) {
          new Notice('초안 노트 저장에 실패했습니다.');
        }
      },
      onRegenerate: async (feedbackText) => {
        await generate(feedbackText);
      }
    }).open();
  };

  await generate();
}
