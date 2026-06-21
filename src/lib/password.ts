// Soft auth for a household, not a security boundary.
// Everything here runs in the browser, so a determined person with dev tools can get past it; the point is to keep the kids out of the accounting board, not to repel attackers.
// We still hash rather than compare plaintext, so a glance at the source or storage doesn't hand over anyone's password.

export async function hashPassword(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
