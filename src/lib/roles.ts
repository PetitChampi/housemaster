import type { UserRole } from "@/store/authStore";

// Roles widen outward: a guest can do the least, an admin (ex: a parent) the most.
// Ranking them lets a single comparison answer the question "is this user allowed in here?".
const RANK: Record<UserRole, number> = {
  GUEST: 0,
  MEMBER: 1,
  ADMIN: 2,
};

export function canAccess(role: UserRole, minRole: UserRole): boolean {
  return RANK[role] >= RANK[minRole];
}
