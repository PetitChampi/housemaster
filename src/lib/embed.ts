// Some hosts forbid iframing via X-Frame-Options or CSP, and a page can't override that
// We can't detect it generically, so we name the common ones and open them in a new tab
const BLOCKED_EMBED_HOSTS: Record<string, string> = {
  "youtube.com": "YouTube",
  "www.youtube.com": "YouTube",
  "m.youtube.com": "YouTube",
  "youtu.be": "YouTube",
};

// Friendly platform name when the host is known to block embedding, else null
export function blockedEmbedLabel(url: string): string | null {
  try {
    return BLOCKED_EMBED_HOSTS[new URL(url).hostname] ?? null;
  } catch {
    return null;
  }
}
