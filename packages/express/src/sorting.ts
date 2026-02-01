import type { Route } from 'fossyl';

/**
 * Sorts routes so static paths come before dynamic params.
 * This ensures Express matches routes correctly.
 *
 * Example ordering:
 * /users/list     <- static, comes first
 * /users/search
 * /users/:id      <- dynamic, comes after static
 * /users/:id/posts
 */
export function sortRoutes(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => {
    const aSegments = a.path.split('/');
    const bSegments = b.path.split('/');

    const maxLen = Math.max(aSegments.length, bSegments.length);
    for (let i = 0; i < maxLen; i++) {
      const aSeg = aSegments[i] ?? '';
      const bSeg = bSegments[i] ?? '';

      const aIsParam = aSeg.startsWith(':');
      const bIsParam = bSeg.startsWith(':');

      // Static segments come before dynamic
      if (!aIsParam && bIsParam) return -1;
      if (aIsParam && !bIsParam) return 1;

      const cmp = aSeg.localeCompare(bSeg);
      if (cmp !== 0) return cmp;
    }

    return aSegments.length - bSegments.length;
  });
}
