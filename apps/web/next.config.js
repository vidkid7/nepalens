/** @type {import('next').NextConfig} */
const nextConfig = {
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
# Trigger redeploy
