export type UserRole = "customer" | "professional" | "admin";

export const USER_ROLES: readonly UserRole[] = [
  "customer",
  "professional",
  "admin",
];

export interface Profile {
  id: string;
  role: UserRole;
  fullName: string | null;
  phone: string | null;
  avatarPath: string | null;
}
