import { describe, it, expect } from 'vitest';
import { BeatListState } from './beatListState';
import type { Beat } from '../ai/beats';

const mk = (title: string, blocking = false): Beat => ({
  title,
  line: title.toLowerCase(),
  quote: '',
  sources: [],
  flags: [],
  blocking
});

const beats: Beat[] = [mk('A'), mk('B'), mk('C')];

describe('BeatListState', () => {
  it('accepts every non-blocking beat by default', () => {
    const state = new BeatListState(beats);
    expect(state.selected().map((b) => b.title)).toEqual(['A', 'B', 'C']);
  });

  it('toggle removes a beat from the selection', () => {
    const state = new BeatListState(beats);
    state.toggle(1);
    expect(state.selected().map((b) => b.title)).toEqual(['A', 'C']);
  });

  it('move reorders items and clamps at the edges', () => {
    const state = new BeatListState(beats);
    state.move(2, -1);
    expect(state.items.map((i) => i.beat.title)).toEqual(['A', 'C', 'B']);
    state.move(0, -1);
    expect(state.items.map((i) => i.beat.title)).toEqual(['A', 'C', 'B']);
  });

  it('edits title and line without losing accepted state', () => {
    const state = new BeatListState(beats);
    state.toggle(0);
    state.setTitle(0, 'A2');
    state.setLine(0, 'a2');
    expect(state.items[0].beat.title).toBe('A2');
    expect(state.items[0].beat.line).toBe('a2');
    expect(state.items[0].accepted).toBe(false);
  });

  it('never accepts a blocking beat', () => {
    const state = new BeatListState([mk('blocked', true)]);
    expect(state.items[0].accepted).toBe(false);
    state.toggle(0);
    expect(state.items[0].accepted).toBe(false);
    expect(state.selected()).toHaveLength(0);
  });
});
