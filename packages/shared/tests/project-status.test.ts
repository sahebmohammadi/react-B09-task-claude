import { describe, expect, it } from 'vitest';
import { canTransition, getAllowedTransitions } from '../src/constants/project-status';

describe('project status transitions', () => {
  it('lets only the system start an open project', () => {
    expect(canTransition('open', 'in-progress', 'system')).toBe(true);
    expect(canTransition('open', 'in-progress', 'owner')).toBe(false);
    expect(canTransition('open', 'in-progress', 'admin')).toBe(false);
  });

  it('lets the assigned freelancer submit work for review', () => {
    expect(canTransition('in-progress', 'in-review', 'assigned-freelancer')).toBe(true);
    expect(canTransition('in-progress', 'in-review', 'owner')).toBe(false);
  });

  it('has no transitions out of terminal statuses', () => {
    expect(getAllowedTransitions('completed', ['admin', 'owner'])).toEqual([]);
    expect(getAllowedTransitions('cancelled', ['admin', 'owner'])).toEqual([]);
  });

  it('lists the transitions an actor may perform', () => {
    expect(getAllowedTransitions('in-progress', ['owner'])).toEqual(['on-hold', 'cancelled']);
  });
});
