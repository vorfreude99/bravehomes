/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ships untranspiled ESM examples; let Next handle them.
  transpilePackages: ['three'],
  images: {
    // Next 16 only honours quality values listed here; anything else
    // silently falls back to 75. The hero is a full-bleed photograph and
    // is worth the extra bytes.
    qualities: [75, 90],
  },
  experimental: {
    optimizePackageImports: ['@react-three/drei'],
  },
};

export default nextConfig;
