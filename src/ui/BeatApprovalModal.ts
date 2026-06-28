import { App, Modal } from 'obsidian';
import type { Beat } from '../ai/beats';
import { BeatListState } from './beatListState';

export interface BeatApprovalCallbacks {
  onApprove: (selected: Beat[]) => void | Promise<void>;
  onRegenerate: (feedback: string) => void | Promise<void>;
}

export class BeatApprovalModal extends Modal {
  private readonly state: BeatListState;
  private readonly callbacks: BeatApprovalCallbacks;

  constructor(app: App, beats: Beat[], callbacks: BeatApprovalCallbacks) {
    super(app);
    this.state = new BeatListState(beats);
    this.callbacks = callbacks;
  }

  onOpen(): void {
    this.modalEl.addClass('omw-beat-modal');
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '비트 제안 — 승인 전 무저장' });
    contentEl.createEl('p', {
      text: '채택할 비트를 고르고, 필요하면 편집·재배열하세요. 승인 시 채택분만 vault에 저장됩니다.'
    });

    const list = contentEl.createDiv({ cls: 'omw-beat-list' });
    this.state.items.forEach((item, index) => {
      const row = list.createDiv({ cls: 'omw-beat-row' });
      if (!item.accepted) {
        row.addClass('omw-beat-rejected');
      }
      if (item.beat.flags.length > 0) {
        row.addClass('omw-beat-flagged');
      }

      const header = row.createDiv({ cls: 'omw-beat-header' });

      const accept = header.createEl('input', { type: 'checkbox' });
      accept.checked = item.accepted;
      accept.disabled = item.beat.blocking;
      accept.addEventListener('change', () => {
        this.state.toggle(index);
        this.render();
      });
      if (item.beat.blocking) {
        header.createEl('span', { cls: 'omw-beat-blocked', text: '저장 불가' });
      }

      const titleInput = header.createEl('input', { type: 'text', cls: 'omw-beat-title' });
      titleInput.value = item.beat.title;
      titleInput.addEventListener('input', () => this.state.setTitle(index, titleInput.value));

      const up = header.createEl('button', { text: '↑' });
      up.addEventListener('click', () => {
        this.state.move(index, -1);
        this.render();
      });
      const down = header.createEl('button', { text: '↓' });
      down.addEventListener('click', () => {
        this.state.move(index, 1);
        this.render();
      });

      const lineInput = row.createEl('textarea', { cls: 'omw-beat-line' });
      lineInput.value = item.beat.line;
      lineInput.rows = 2;
      lineInput.addEventListener('input', () => this.state.setLine(index, lineInput.value));

      const sources = item.beat.sources.length > 0 ? item.beat.sources.join(', ') : '(출처 미연결)';
      row.createEl('div', { cls: 'omw-beat-sources', text: `출처: ${sources}` });

      for (const flag of item.beat.flags) {
        row.createEl('div', { cls: 'omw-beat-flag', text: `⚠️ ${flag}` });
      }
    });

    const feedbackWrap = contentEl.createDiv({ cls: 'omw-beat-feedback' });
    feedbackWrap.createEl('label', { text: '피드백 주고 다시 제안 (선택):' });
    const feedbackInput = feedbackWrap.createEl('textarea', { cls: 'omw-beat-feedback-input' });
    feedbackInput.rows = 2;

    const footer = contentEl.createDiv({ cls: 'omw-beat-footer' });

    const approve = footer.createEl('button', { text: '승인 — 채택분 저장', cls: 'mod-cta' });
    approve.addEventListener('click', async () => {
      const selected = this.state.selected();
      this.close();
      await this.callbacks.onApprove(selected);
    });

    const regenerate = footer.createEl('button', { text: '피드백으로 다시 제안' });
    regenerate.addEventListener('click', async () => {
      const feedback = feedbackInput.value.trim();
      this.close();
      await this.callbacks.onRegenerate(feedback);
    });

    const cancel = footer.createEl('button', { text: '취소' });
    cancel.addEventListener('click', () => this.close());
  }
}
