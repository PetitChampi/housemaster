import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "GUEST" | "MEMBER" | "ADMIN";

export interface User {
  name: string;
  role: UserRole;
  avatarUrl: string;
}

// How long a sign-in lasts before the login screen comes back.
// Kept generous on purpose: this would in theory run on a shared household device, and being asked to log in several times a day is the kind of friction that makes people stop using a thing.
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface AuthState {
  user: User | null;
  expiresAt: number | null;
  signIn: (user: User) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      expiresAt: null,
      signIn: (user) => set({ user, expiresAt: Date.now() + SESSION_TTL_MS }),
      signOut: () => set({ user: null, expiresAt: null }),
    }),
    { name: "housemaster-session" }
  )
);

// The active user, or null once the session has lapsed.
// Treating an expired session as signed-out keeps the expiry check in one place.
export function useCurrentUser(): User | null {
  return useAuthStore((s) =>
    s.user && s.expiresAt && s.expiresAt > Date.now() ? s.user : null
  );
}
