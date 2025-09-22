import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/u/**",
      },
    ],
  },
};

const nextConfig = withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  skipWaiting: false,
  buildExcludes: [/middleware-manifest.json$/],
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      // Cache Google Fonts
      urlPattern:
        /^https:\/\/(fonts\.gstatic\.com|fonts\.googleapis\.com)\/.*$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Cross-origin avatars and other images
      urlPattern: /^https:\/\/avatars\.githubusercontent\.com\/.*$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "remote-images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Same-origin images/assets
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      // API GETs (exclude auth and github)
      urlPattern: ({ url }: { url: URL }) => {
        const isSameOrigin =
          typeof self !== "undefined" &&
          (self as unknown as { origin: string }).origin === url.origin;
        const isApi = url.pathname.startsWith("/api/");
        const isSensitive = /^(\/api\/(auth|github)|.*token)/.test(
          url.pathname
        );
        return isSameOrigin && isApi && !isSensitive;
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 10, // 10 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
})(baseConfig);

export default nextConfig;
