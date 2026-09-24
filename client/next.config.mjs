/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shared/ ships TypeScript sources through the npm workspace link, so Next has to compile it.
  transpilePackages: ['@eduflow/shared'],
  // Linting is its own step (`npm run lint`), so a lint error never hides a build error.
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  experimental: {
    // This machine's Application Control policy blocks Next's unsigned native SWC binary, so the
    // WebAssembly compiler is used instead. It is slower but produces the same output, and it is
    // the only way to build here. Remove this once the policy allows @next/swc-win32-x64-msvc.
    useWasmBinary: true,
  },
};

export default nextConfig;
