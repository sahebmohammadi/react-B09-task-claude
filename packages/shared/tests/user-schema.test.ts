import { describe, expect, it } from 'vitest';
import { USER_LIMITS, userEmailSchema, userNameSchema, userTitleSchema } from '../src/schemas/user';

describe('userEmailSchema', () => {
  it('trims and lowercases the email', () => {
    expect(userEmailSchema.parse('  Ann@Example.COM ')).toBe('ann@example.com');
  });

  it('rejects an invalid email', () => {
    expect(userEmailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('userNameSchema', () => {
  it('accepts names at both length bounds', () => {
    expect(userNameSchema.safeParse('a'.repeat(USER_LIMITS.nameMin)).success).toBe(true);
    expect(userNameSchema.safeParse('a'.repeat(USER_LIMITS.nameMax)).success).toBe(true);
  });

  it('rejects names outside the length bounds', () => {
    expect(userNameSchema.safeParse('a'.repeat(USER_LIMITS.nameMin - 1)).success).toBe(false);
    expect(userNameSchema.safeParse('a'.repeat(USER_LIMITS.nameMax + 1)).success).toBe(false);
  });

  it('counts the length after trimming', () => {
    expect(userNameSchema.safeParse('  a  ').success).toBe(false);
  });
});

describe('userTitleSchema', () => {
  it('rejects a title longer than the limit', () => {
    expect(userTitleSchema.safeParse('a'.repeat(USER_LIMITS.titleMax + 1)).success).toBe(false);
  });
});
