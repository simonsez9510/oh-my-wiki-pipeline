import { describe, it, expect } from 'vitest';
import { DraftListState } from './draftListState';
import type { DraftSection } from '../ai/draft';

const mk = (beatTitle: string, blocking = false): DraftSection => ({
  beatTitle,
  prose: `${beatTitle} 산문`,
  sources: blocking ? [] : ['인물 — 김가원'],
  flags: [],
  blocking
});

const sections: DraftSection[] = [mk('A'), mk('B'), mk('C')];

describe('DraftListState', () => {
  it('accepts every non-blocking section by default', () => {
    const state = new DraftListState(sections);
    expect(state.selected().map((s) => s.beatTitle)).toEqual(['A', 'B', 'C']);
  });

  it('toggle removes a section from the selection', () => {
    const state = new DraftListState(sections);
    state.toggle(1);
    expect(state.selected().map((s) => s.beatTitle)).toEqual(['A', 'C']);
  });

  it('move reorders sections and clamps at the edges', () => {
    const state = new DraftListState(sections);
    state.move(2, -1);
    expect(state.items.map((i) => i.section.beatTitle)).toEqual(['A', 'C', 'B']);
    state.move(0, -1);
    expect(state.items.map((i) => i.section.beatTitle)).toEqual(['A', 'C', 'B']);
  });

  it('edits prose without losing accepted state', () => {
    const state = new DraftListState(sections);
    state.toggle(0);
    state.setProse(0, '고쳐 쓴 산문');
    expect(state.items[0].section.prose).toBe('고쳐 쓴 산문');
    expect(state.items[0].accepted).toBe(false);
  });

  it('never accepts a blocking section', () => {
    const state = new DraftListState([mk('blocked', true)]);
    expect(state.items[0].accepted).toBe(false);
    state.toggle(0);
    expect(state.items[0].accepted).toBe(false);
    expect(state.selected()).toHaveLength(0);
  });
});
