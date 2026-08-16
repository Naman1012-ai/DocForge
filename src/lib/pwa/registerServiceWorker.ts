/**
 * DocFrame — PWA Service Worker Registration & Lifecycle Manager
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Only register service worker in production environments to avoid stale caches during active development
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update is available
                  console.info('[DocFrame PWA] New update available. Refresh to apply.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[DocFrame PWA] Service Worker registration skipped or failed:', error);
        });
    });
  }
}
