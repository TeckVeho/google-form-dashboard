/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: false, // Loại bỏ mặc định api bị call 2 lần
  output: "standalone",
  trailingSlash: false,
  // env: {
  //   OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  //   BASE_API: process.env.BASE_API,
  // },
}

export default nextConfig
