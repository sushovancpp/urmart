/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // This uses your Render backend when on Vercel, but keeps localhost for local development!
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;