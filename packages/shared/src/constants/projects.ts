export const PROJECT_STATUSES = [
  'open',
  'in-progress',
  'in-review',
  'completed',
  'closed',
  'on-hold',
  'cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TERMINAL_PROJECT_STATUSES = [
  'completed',
  'cancelled',
] as const satisfies readonly ProjectStatus[];

export const PROJECT_CATEGORIES = [
  'web-development',
  'ui-ux-design',
  'seo',
  'ecommerce',
  'wordpress',
  'mobile-app',
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_TYPES = ['fixed-price', 'hourly'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];
