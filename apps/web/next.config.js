/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@pixelstock/database",
    "@pixelstock/search",
    "@pixelstock/shared",
    "@pixelstock/storage",
    "@pixelstock/queue",
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
