"use client";

import { useEffect } from "react";

import {
  markPerformance,
  measurePerformance,
  preloadCriticalResources,
} from "@/lib/performance";

interface PerformanceMonitorProps {
  pageName: string;
  children: React.ReactNode;
}

export function PerformanceMonitor({
  pageName,
  children,
}: PerformanceMonitorProps) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Mark page start
    markPerformance(`${pageName}-start`);

    // Preload critical resources
    preloadCriticalResources();

    const cleanup: (() => void)[] = [];

    // Monitor core web vitals
    if ("performance" in window && "PerformanceObserver" in window) {
      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            console.log(`FCP: ${entry.startTime}ms`);
            // Log to analytics service
            if (typeof gtag !== "undefined") {
              gtag("event", "web_vitals", {
                metric_name: "FCP",
                metric_value: Math.round(entry.startTime),
                page_name: pageName,
              });
            }
          }
        });
      });

      try {
        paintObserver.observe({ entryTypes: ["paint"] });
        cleanup.push(() => paintObserver.disconnect());
      } catch (error) {
        console.warn("Paint observer not supported:", error);
      }

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.log(`LCP: ${entry.startTime}ms`);
          // Log to analytics service
          if (typeof gtag !== "undefined") {
            gtag("event", "web_vitals", {
              metric_name: "LCP",
              metric_value: Math.round(entry.startTime),
              page_name: pageName,
            });
          }
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        cleanup.push(() => lcpObserver.disconnect());
      } catch (error) {
        console.warn("LCP observer not supported:", error);
      }
    }

    // Mark page loaded
    const loadHandler = () => {
      markPerformance(`${pageName}-loaded`);
      measurePerformance(
        `${pageName}-total`,
        `${pageName}-start`,
        `${pageName}-loaded`
      );
    };

    if (typeof document !== "undefined" && document.readyState === "complete") {
      loadHandler();
    } else if (typeof window !== "undefined") {
      window.addEventListener("load", loadHandler);
      cleanup.push(() => window.removeEventListener("load", loadHandler));
    }

    // Return cleanup function
    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, [pageName]);

  return <>{children}</>;
}

// Type declaration for gtag (Google Analytics)
declare global {
  function gtag(...args: unknown[]): void;
}
