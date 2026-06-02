export function getQuery(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export function getPositiveInt(searchParams: URLSearchParams, key: string, fallback?: number) {
  const raw = searchParams.get(key);
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
