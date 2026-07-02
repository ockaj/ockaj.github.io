export interface Preloadable<T> {
  load: () => Promise<T>;
  getReady: () => boolean;
}

export function makePreloadable<T>(importFn: () => Promise<T>): Preloadable<T> {
  let promise: Promise<T> | null = null;
  let isResolved = false;

  const load = () => {
    if (!promise) {
      promise = importFn().then((val) => {
        isResolved = true;
        return val;
      });
    }
    return promise;
  };

  return {
    load,
    getReady: () => isResolved,
  };
}
