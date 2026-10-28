import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // PDFs de notas fiscais enviados pelas ações do servidor (padrão é 1 MB)
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
