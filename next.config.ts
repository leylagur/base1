import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { webpack }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Ignore React Native modules for web builds (both server and client)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      fs: false,
      path: false,
    };
    
    // Ignore the module completely using IgnorePlugin (both server and client)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    );
    
    return config;
  },
  // Enable experimental features for Frames
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Transpile OnchainKit to fix CSS issues
  transpilePackages: ['@coinbase/onchainkit'],
};

export default nextConfig;
