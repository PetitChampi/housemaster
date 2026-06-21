import type { User } from "@/store/authStore";

// The household stands in for a tenant of the app.
// For now its members live here as static seed data, later this is where a real backend would slot in.
export interface Member extends User {
  // SHA-256 of the member's password (see src/lib/password.ts)
  passwordHash: string;
}

export const household = {
  name: "The Haddons",
  pictureUrl: "/img/household-default.jpg",
};

// Anyone without an account (a friend round for dinner etc) signs in as the guest.
// No password, and the lowest role.
export const guest: User = {
  name: "Reginald",
  role: "GUEST",
  avatarUrl: "/img/reginald-penguin.jpg",
};

export const members: Member[] = [
  {
    name: "Esther",
    role: "ADMIN",
    avatarUrl: "/img/household-default.jpg",
    passwordHash:
      "d9fb92e3bbe65be1f1aad4a82eef4567f7a1ebe2cd110c8049b9698be7a70c88",
  },
  {
    name: "Michael",
    role: "MEMBER",
    avatarUrl: "/img/reginald-penguin.jpg",
    passwordHash:
      "dc12c22f0cab5fd6943c2870d9b8eaf55902c02ced0519a66cdb96bc47ac698a",
  },
];
