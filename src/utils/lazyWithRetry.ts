import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Automatically retries dynamic module imports when a network glitch or a new deployment
 * (chunk hash mismatch) occurs.
 *
 * 1. Retries the import after 500ms for temporary mobile network drops.
 * 2. If it's a chunk hash mismatch from a new deployment, auto-refreshes the page once
 *    so the user seamlessly receives the latest app bundle instead of seeing a crash screen.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('chunk_force_refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('chunk_force_refreshed', 'false');
      return component;
    } catch (error: any) {
      // First, retry once after 500ms for momentary network hiccups
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const component = await componentImport();
        window.sessionStorage.setItem('chunk_force_refreshed', 'false');
        return component;
      } catch (retryError: any) {
        const isChunkError =
          retryError?.name === 'ChunkLoadError' ||
          retryError?.message?.includes('dynamically imported module') ||
          retryError?.message?.includes('Loading chunk') ||
          retryError?.message?.includes('Failed to fetch') ||
          retryError?.message?.includes('Unexpected token');

        if (isChunkError && !pageHasBeenForceRefreshed) {
          window.sessionStorage.setItem('chunk_force_refreshed', 'true');
          window.location.reload();
          // Return an unresolved promise to prevent ErrorBoundary from rendering before reload
          return new Promise(() => {});
        }

        window.sessionStorage.setItem('chunk_force_refreshed', 'false');
        throw retryError;
      }
    }
  });
}
