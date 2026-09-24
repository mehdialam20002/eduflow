/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shared/ ships TypeScript sources through the npm workspace link, so Next has to compile it.
  transpilePackages: ['@eduflow/shared'],
  // Linting is its own step (`npm run lint`), so a lint error never hides a build error.
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

export default nextConfig;
