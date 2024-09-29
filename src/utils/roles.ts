export const ROLES = {
  ADMIN: 'admin',
  GURU_PIKET: 'gurupiket',
  WAKIL: 'wakil',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export interface User {
  uid: string;
  email: string;
  role: RoleType;
}