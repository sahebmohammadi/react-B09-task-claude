export const ROLES = ['admin', 'owner', 'freelancer'] as const;
export type Role = (typeof ROLES)[number];

/** Roles a person can pick when they register. Admins are created only by the seed script. */
export const REGISTRATION_ROLES = ['owner', 'freelancer'] as const satisfies readonly Role[];
export type RegistrationRole = (typeof REGISTRATION_ROLES)[number];
