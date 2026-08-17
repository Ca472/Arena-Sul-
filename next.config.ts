import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const sensitivePageHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-cache, no-store, must-revalidate, max-age=0",
  },
  { key: "Expires", value: "0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/admin/recuperar-senha",
        headers: sensitivePageHeaders,
      },
      {
        source: "/admin/definir-senha",
        headers: sensitivePageHeaders,
      },
    ];
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
            port: "",
            pathname: "/storage/v1/object/sign/event-photos/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
