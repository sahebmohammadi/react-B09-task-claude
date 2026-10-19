import { z } from 'zod';
import { ROLES } from '../constants/roles';
import { USER_STATUSES } from '../constants/user-statuses';

/** Length limits shared by the Zod schemas and the Mongoose model. */
export const USER_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  titleMin: 2,
  titleMax: 80,
} as const;

export const userNameSchema = z.string().trim().min(USER_LIMITS.nameMin).max(USER_LIMITS.nameMax);

// Trim and lowercase run before the email check, so " Ann@Example.com " is accepted and stored once.
export const userEmailSchema = z.string().trim().toLowerCase().pipe(z.email());

/** A short headline shown next to the name, e.g. "Senior React Developer". */
export const userTitleSchema = z
  .string()
  .trim()
  .min(USER_LIMITS.titleMin)
  .max(USER_LIMITS.titleMax);

export const userRoleSchema = z.enum(ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

/** The user as the API sends it. Telegram ID and phone never leave the server. */
export const userSchema = z.object({
  id: z.string(),
  name: userNameSchema,
  email: userEmailSchema,
  role: userRoleSchema,
  status: userStatusSchema,
  title: userTitleSchema.optional(),
  telegramUsername: z.string().optional(),
  rejectionReason: z.string().optional(),
  reviewedAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;
