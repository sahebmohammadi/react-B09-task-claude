export const USER_STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
