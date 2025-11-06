/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    // Allow Cloudinary-hosted images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
