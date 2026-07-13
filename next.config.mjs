/** @type {import('next').NextConfig} */
const nextConfig = {
  // Plus de transcodage : on garde juste le SDK S3 hors bundle.
  serverExternalPackages: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
};

export default nextConfig;
