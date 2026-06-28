import { Notice, TFile } from 'obsidian';
import type OmwPipelinePlugin from '../main';
import type { BeatInput } from '../ai/beats';
import { normalizeLanguage, revalidateBeats } from '../ai/beats';
import { AnthropicError, requestBeats } from '../ai/client';
import { BeatApprovalModal } from '../ui/BeatApprovalModal';
import { loadLocalKey } from '../secret';
import { sanitizeVaultFolder } from '../vault/serialize';
import { checkVaultGuard, collectChapterContext, saveBeatNotes } from '../vault/notes';

export async function proposeBeatsCommand(plugin: OmwPipelinePlugin): Promise<void> {
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
    new Notice('비트 노트 폴더 경로가 올바르지 않습니다. 설정에서 vault 내부 상대 경로로 지정하세요.');
    return;
  }

  const context = await collectChapterContext(app, file);
  if (context.cards.length === 0) {
    new Notice('이 장에 연결된 자료조사 카드가 없습니다. 카드 위키링크를 먼저 연결하세요.');
    return;
  }

  const language = normalizeLanguage(app.metadataCache.getFileCache(file)?.frontmatter?.lang);

  const generate = async (feedback?: string): Promise<void> => {
    const input: BeatInput = {
      chapterTitle: context.title,
      chapterBody: context.body,
      cards: context.cards,
      feedback,
      language
    };

    const progress = new Notice('비트 제안 중…', 0);
    let beats;
    try {
      beats = await requestBeats(loadLocalKey(), settings.model, input);
    } catch (error) {
      progress.hide();
      new Notice(error instanceof AnthropicError ? error.message : '비트 제안에 실패했습니다.');
      return;
    }
    progress.hide();

    if (beats.length === 0) {
      new Notice('제안된 비트가 없습니다. 카드 내용을 확인하거나 다시 시도하세요.');
      return;
    }

    new BeatApprovalModal(app, beats, {
      onApprove: async (selected) => {
        const revalidated = revalidateBeats(selected, input);
        const savable = revalidated.filter((beat) => !beat.blocking);
        const droppedCount = selected.length - savable.length;
        if (savable.length === 0) {
          new Notice(
            droppedCount > 0
              ? '선택한 비트가 출처 미연결·미검증이라 저장하지 않았습니다.'
              : '채택된 비트가 없어 저장하지 않았습니다.'
          );
          return;
        }
        const saveGuard = checkVaultGuard(app, settings.expectedVaultPath);
        if (!saveGuard.ok) {
          new Notice(saveGuard.reason ?? 'vault 경로 가드에 막혀 저장을 중단했습니다.');
          return;
        }
        try {
          const createdNotes = await saveBeatNotes(app, savable, file, context.cards, folder);
          const skipped = droppedCount > 0 ? ` (출처 미연결·미검증 ${droppedCount}건 제외)` : '';
          new Notice(`${createdNotes.length}개 비트 노트를 저장했습니다${skipped}.`);
        } catch (error) {
          new Notice('비트 노트 저장에 실패했습니다.');
        }
      },
      onRegenerate: async (feedbackText) => {
        await generate(feedbackText);
      }
    }).open();
  };

  await generate();
}
