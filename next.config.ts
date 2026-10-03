import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aktifkan kompresi response gzip/brotli
  compress: true,

  // Sembunyikan header x-powered-by untuk keamanan & hemat byte
  poweredByHeader: false,

  // Optimasi gambar (Supabase Storage & format modern)
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@radix-ui/react-icons",
    ],
  },

  // HTTP Security & Performance Headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
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
      ],
    },
  ],
};

export default nextConfig;
