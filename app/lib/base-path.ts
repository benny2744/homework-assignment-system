/**
 * Prefix absolute paths with Next.js `basePath` when deployed under a subpath.
 *
 * Example:
 * - basePath="/homework"
 * - withBasePath("/api/auth/login") -> "/homework/api/auth/login"
 */
export function withBasePath(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH || '';
  if (!basePath) return path;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Avoid double-prefixing if caller already used basePath
  if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) return normalizedPath;
  return `${basePath}${normalizedPath}`;
}



