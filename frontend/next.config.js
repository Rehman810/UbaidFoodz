/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
let apiPattern = { protocol: "http", hostname: "localhost", port: "4000", pathname: "/uploads/**" };
try {
  const parsed = new URL(apiUrl);
  apiPattern = {
    protocol: parsed.protocol.replace(":", ""),
    hostname: parsed.hostname,
    ...(parsed.port ? { port: parsed.port } : {}),
    pathname: "/uploads/**",
  };
} catch {
  /* keep localhost default */
}

const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      apiPattern,
    ],
  },
};

module.exports = nextConfig;
