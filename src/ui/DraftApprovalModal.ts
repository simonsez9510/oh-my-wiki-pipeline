import { App, Modal } from 'obsidian';
import type { DraftSection } from '../ai/draft';
import { DraftListState } from './draftListState';

export interface DraftApprovalCallbacks {
  onApprove: (selected: DraftSection[]) => void | Promise<void>;
  onRegenerate: (feedback: string) => void | Promise<void>;
}

export interface DraftApprovalLabels {
  heading: string;
  intro: string;
  approve: string;
  regenerate: string;
}

const DEFAULT_LABELS: DraftApprovalLabels = {
  heading: '초안 제안 — 승인 전 무저장',
  intro: '각 비트를 펼친 산문을 검토·편집하고 채택하세요. 승인 시 채택분만 한 편의 초안 노트로 저장됩니다.',
  approve: '승인 — 초안 저장',
  regenerate: '피드백으로 다시 생성'
};

export class DraftApprovalModal extends Modal {
  private readonly state: DraftListState;
  private readonly callbacks: DraftApprovalCallbacks;
  private readonly labels: DraftApprovalLabels;

  constructor(app: App, sections: DraftSection[], callbacks: DraftApprovalCallbacks, labels?: Partial<DraftApprovalLabels>) {
    super(app);
    this.state = new DraftListState(sections);
    this.callbacks = callbacks;
    this.labels = { ...DEFAULT_LABELS, ...labels };
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
    contentEl.createEl('h2', { text: this.labels.heading });
    contentEl.createEl('p', { text: this.labels.intro });

    const list = contentEl.createDiv({ cls: 'omw-beat-list' });
    this.state.items.forEach((item, index) => {
      const row = list.createDiv({ cls: 'omw-beat-row' });
      if (!item.accepted) {
        row.addClass('omw-beat-rejected');
      }
      if (item.section.flags.length > 0) {
        row.addClass('omw-beat-flagged');
      }

      const header = row.createDiv({ cls: 'omw-beat-header' });

      const accept = header.createEl('input', { type: 'checkbox' });
      accept.checked = item.accepted;
      accept.disabled = item.section.blocking;
      accept.addEventListener('change', () => {
        this.state.toggle(index);
        this.render();
      });
      if (item.section.blocking) {
        header.createEl('span', { cls: 'omw-beat-blocked', text: '저장 불가' });
      }

      header.createEl('span', { cls: 'omw-beat-title', text: item.section.beatTitle });

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

      const proseInput = row.createEl('textarea', { cls: 'omw-beat-line' });
      proseInput.value = item.section.prose;
      proseInput.rows = 5;
      proseInput.addEventListener('input', () => this.state.setProse(index, proseInput.value));

      const sources = item.section.sources.length > 0 ? item.section.sources.join(', ') : '(출처 미연결)';
      row.createEl('div', { cls: 'omw-beat-sources', text: `근거: ${sources}` });

      for (const flag of item.section.flags) {
        row.createEl('div', { cls: 'omw-beat-flag', text: `⚠️ ${flag}` });
      }
    });

    const feedbackWrap = contentEl.createDiv({ cls: 'omw-beat-feedback' });
    feedbackWrap.createEl('label', { text: '피드백 주고 다시 생성 (선택):' });
    const feedbackInput = feedbackWrap.createEl('textarea', { cls: 'omw-beat-feedback-input' });
    feedbackInput.rows = 2;

    const footer = contentEl.createDiv({ cls: 'omw-beat-footer' });

    const approve = footer.createEl('button', { text: this.labels.approve, cls: 'mod-cta' });
    approve.addEventListener('click', async () => {
      const selected = this.state.selected();
      this.close();
      await this.callbacks.onApprove(selected);
    });

    const regenerate = footer.createEl('button', { text: this.labels.regenerate });
    regenerate.addEventListener('click', async () => {
      const feedback = feedbackInput.value.trim();
      this.close();
      await this.callbacks.onRegenerate(feedback);
    });

    const cancel = footer.createEl('button', { text: '취소' });
    cancel.addEventListener('click', () => this.close());
  }
}
