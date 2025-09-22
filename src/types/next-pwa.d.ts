declare module "next-pwa" {
  import type { NextConfig } from "next";

  type WorkboxHandler =
    | "CacheFirst"
    | "NetworkFirst"
    | "NetworkOnly"
    | "StaleWhileRevalidate"
    | "CacheOnly";

  interface WorkboxExpirationOptions {
    maxEntries?: number;
    maxAgeSeconds?: number;
  }

  interface WorkboxCacheableResponseOptions {
    statuses?: number[];
    headers?: Record<string, string>;
  }

  interface WorkboxRouteOptions {
    cacheName?: string;
    networkTimeoutSeconds?: number;
    expiration?: WorkboxExpirationOptions;
    cacheableResponse?: WorkboxCacheableResponseOptions;
  }

  type UrlPatternPredicate = (args: { url: URL }) => boolean;

  interface RuntimeCachingEntry {
    urlPattern: RegExp | string | UrlPatternPredicate;
    handler: WorkboxHandler;
    options?: WorkboxRouteOptions;
  }

  interface PWAOptions {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    buildExcludes?: (RegExp | string)[];
    fallbacks?: { document?: string };
    runtimeCaching?: RuntimeCachingEntry[];
  }

  export default function withPWA(
    options?: PWAOptions
  ): (nextConfig: NextConfig) => NextConfig;
}
