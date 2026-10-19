import type { ProjectStatus } from './projects';

/**
 * Who may perform a transition. These describe the actor's relation to the project,
 * not a role: services map the user's scoped permission (`project:status:own`,
 * `project:status:assigned`, `project:status:any`) to one of these.
 */
export const TRANSITION_ACTORS = ['system', 'owner', 'assigned-freelancer', 'admin'] as const;
export type TransitionActor = (typeof TRANSITION_ACTORS)[number];

const OWNER_OR_ADMIN = ['owner', 'admin'] as const satisfies readonly TransitionActor[];

type TransitionMap = Record<
  ProjectStatus,
  Partial<Record<ProjectStatus, readonly TransitionActor[]>>
>;

export const PROJECT_STATUS_TRANSITIONS: TransitionMap = {
  // Only accepting a proposal moves a project to in-progress.
  open: { 'in-progress': ['system'], closed: OWNER_OR_ADMIN, cancelled: OWNER_OR_ADMIN },
  closed: { open: OWNER_OR_ADMIN, cancelled: OWNER_OR_ADMIN },
  'in-progress': {
    'in-review': ['assigned-freelancer', 'admin'],
    'on-hold': OWNER_OR_ADMIN,
    cancelled: OWNER_OR_ADMIN,
  },
  'on-hold': { 'in-progress': OWNER_OR_ADMIN },
  // Moving back to in-progress means the owner requested changes.
  'in-review': { completed: OWNER_OR_ADMIN, 'in-progress': OWNER_OR_ADMIN },
  completed: {},
  cancelled: {},
};

export function canTransition(
  from: ProjectStatus,
  to: ProjectStatus,
  actor: TransitionActor,
): boolean {
  return PROJECT_STATUS_TRANSITIONS[from][to]?.includes(actor) ?? false;
}

export function getAllowedTransitions(
  from: ProjectStatus,
  actors: readonly TransitionActor[],
): ProjectStatus[] {
  const targets = Object.keys(PROJECT_STATUS_TRANSITIONS[from]) as ProjectStatus[];
  return targets.filter((to) => actors.some((actor) => canTransition(from, to, actor)));
}
