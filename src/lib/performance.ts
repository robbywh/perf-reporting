// Performance optimization utilities

/**
 * Preloads critical resources to improve FCP and LCP
 */
export function preloadCriticalResources() {
  if (typeof window !== "undefined") {
    // Preload critical CSS
    const criticalCssLink = document.createElement("link");
    criticalCssLink.rel = "preload";
    criticalCssLink.href = "/styles/critical.css";
    criticalCssLink.as = "style";
    document.head.appendChild(criticalCssLink);

    // Prefetch likely next resources
    const prefetchLink = document.createElement("link");
    prefetchLink.rel = "prefetch";
    prefetchLink.href = "/api/dashboard";
    document.head.appendChild(prefetchLink);
  }
}

/**
 * Creates an intersection observer for lazy loading components
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit,
) {
  if (typeof window === "undefined") return null;

  return new IntersectionObserver(callback, {
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  });
}

/**
 * Debounces a function to improve performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Creates a performance mark for measuring
 */
export function markPerformance(name: string) {
  if (typeof window !== "undefined" && "performance" in window) {
    performance.mark(name);
  }
}

/**
 * Measures performance between two marks
 */
export function measurePerformance(
  measureName: string,
  startMark: string,
  endMark: string,
) {
  if (typeof window !== "undefined" && "performance" in window) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      console.log(`${measureName}: ${measure.duration}ms`);
      return measure.duration;
    } catch (error) {
      console.warn("Performance measurement failed:", error);
    }
  }
  return 0;
}
