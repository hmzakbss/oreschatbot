import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LAN IP ile (ör. telefon/tablet) local preview için
  allowedDevOrigins: ["192.168.1.222"],
};

export default nextConfig;
