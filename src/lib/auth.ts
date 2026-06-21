import { members, guest } from "@/data/household";
import { hashPassword } from "@/lib/password";
import type { User } from "@/store/authStore";

// Match a name and password against the household roster.
// Returns the user without their password hash on success, or null if either is wrong.
// The name match is forgiving about case and surrounding spaces; the password is not.
export async function authenticate(
  name: string,
  password: string
): Promise<User | null> {
  const member = members.find(
    (m) => m.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (!member) return null;

  const hash = await hashPassword(password);
  if (hash !== member.passwordHash) return null;

  const { passwordHash: _passwordHash, ...user } = member;
  return user;
}

export { guest };
