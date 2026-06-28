import type { Beat } from '../ai/beats';

export interface BeatItem {
  beat: Beat;
  accepted: boolean;
}

export class BeatListState {
  items: BeatItem[];

  constructor(beats: Beat[]) {
    this.items = beats.map((beat) => ({ beat, accepted: !beat.blocking }));
  }

  toggle(index: number): void {
    const item = this.items[index];
    if (!item || item.beat.blocking) {
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

  setTitle(index: number, title: string): void {
    const item = this.items[index];
    if (item) {
      item.beat = { ...item.beat, title };
    }
  }

  setLine(index: number, line: string): void {
    const item = this.items[index];
    if (item) {
      item.beat = { ...item.beat, line };
    }
  }

  selected(): Beat[] {
    return this.items.filter((item) => item.accepted).map((item) => item.beat);
  }
}
