/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ces paquets ne doivent pas etre bundles par Next : ils tournent cote Node.
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "music-metadata"],

  // On force l'inclusion du binaire ffmpeg-static dans le deploiement
  // serverless (sinon Vercel ne le trace pas et le transcodage echoue).
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/ffmpeg-static/**"],
    "/**": ["./node_modules/ffmpeg-static/**"],
  },

  experimental: {
    serverActions: { bodySizeLimit: "150mb" },
  },
};

export default nextConfig;
