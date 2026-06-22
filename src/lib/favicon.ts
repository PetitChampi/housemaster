// Google's favicon service returns a site's icon from its domain
export function faviconUrl(url: string, size = 64): string | null {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=${size}`;
  } catch {
    return null;
  }
}
