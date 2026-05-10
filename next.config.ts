import type { NextConfig } from "next";

/**
 * Security headers applied to every response.
 *
 * Notes:
 *  - HSTS: 2 years with preload — only enabled in production so localhost dev
 *    on http://localhost:3000 still works without the cached HSTS upgrade.
 *  - Permissions-Policy: WebBluetooth is REQUIRED for live device streaming
 *    (Mendi fNIRS, Muse), so we allow it for "self". Camera/mic/geo/payment
 *    are explicitly disabled.
 *  - X-Frame-Options=DENY blocks clickjacking. If you ever embed EEGBase in
 *    an iframe (e.g. inside an EHR), change to SAMEORIGIN or use frame-ancestors
 *    in CSP.
 *  - Content-Security-Policy: starter policy that locks down the most-abused
 *    surface (frame-ancestors, base-uri, form-action, object-src) without
 *    requiring a full inline-script/style audit. script-src and style-src
 *    intentionally left default so Next.js inline RSC scripts + Tailwind
 *    inline styles continue to work. Tighten further once a nonce strategy
 *    is in place.
 */
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "bluetooth=(self)", // required for Mendi / Muse device streaming
      "camera=()",        // not used; explicitly deny
      "microphone=()",    // not used; explicitly deny
      "geolocation=()",   // not used; explicitly deny
      "payment=()",       // not used; explicitly deny
      "usb=()",           // not used; explicitly deny
      "midi=()",          // not used; explicitly deny
    ].join(", "),
  },
  {
    // Starter CSP — locks down clickjacking, base-tag injection, form
    // hijacking, and legacy plugin objects without breaking Next.js
    // inline RSC scripts or Tailwind inline styles. Tighten with nonces
    // for script-src/style-src in a follow-up.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.anthropic.com https://plausible.io",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const productionOnlyHeaders = [
  {
    key: "Strict-Transport-Security",
    // 2 years; includeSubDomains so api.eegbase.com etc. inherit HSTS;
    // preload allows submission to the browser preload list once stable.
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Powered-by header leaks framework info; turn it off.
  poweredByHeader: false,

  // Tree-shake commonly imported barrel packages more aggressively.
  experimental: {
    optimizePackageImports: ["lucide-react", "drizzle-orm"],
  },

  async headers() {
    const all = [
      ...securityHeaders,
      ...(process.env.NODE_ENV === "production" ? productionOnlyHeaders : []),
    ];
    return [
      {
        // Apply to every route.
        source: "/:path*",
        headers: all,
      },
    ];
  },
};

export default nextConfig;
