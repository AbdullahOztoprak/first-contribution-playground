export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = (baseUrl || '').replace(/\/+$/, '');
  return trimmed === '' ? '' : trimmed;
}

export function withBase(baseUrl: string, path: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '') return normalizedPath;
  return `${normalized}${normalizedPath}`;
}
