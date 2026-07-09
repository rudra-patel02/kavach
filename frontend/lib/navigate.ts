// A one-line navigation seam. Isolating the raw `window.location` call here
// keeps lib/api testable (tests mock this module rather than fighting jsdom's
// non-configurable window.location).
export const navigateTo = (url: string) => {
  if (typeof window !== "undefined") {
    window.location.assign(url);
  }
};
