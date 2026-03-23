/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" || process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  transpilePackages: [
    "@nepalens/database",
    "@nepalens/search",
    "@nepalens/shared",
    "@nepalens/storage",
    "@nepalens/queue",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

module.exports = nextConfig;
