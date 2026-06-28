import type { DraftSection } from '../ai/draft';

export interface DraftItem {
  section: DraftSection;
  accepted: boolean;
}

export class DraftListState {
  items: DraftItem[];

  constructor(sections: DraftSection[]) {
    this.items = sections.map((section) => ({ section, accepted: !section.blocking }));
  }

  toggle(index: number): void {
    const item = this.items[index];
    if (!item || item.section.blocking) {
      return;
    }
    item.accepted = !item.accepted;
  }

  move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (index < 0 || index >= this.items.length || target < 0 || target >= this.items.length) {
      return;
    }
    const swapped = this.items[index];
    this.items[index] = this.items[target];
    this.items[target] = swapped;
  }

  setProse(index: number, prose: string): void {
    const item = this.items[index];
    if (item) {
      item.section = { ...item.section, prose };
    }
  }

  selected(): DraftSection[] {
    return this.items.filter((item) => item.accepted).map((item) => item.section);
  }
}
