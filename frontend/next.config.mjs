/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // Allow Cloudinary-hosted images and Icons8 CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
    ],
  },
};

export default nextConfig;
