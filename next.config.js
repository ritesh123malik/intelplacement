/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Move serverComponentsExternalPackages to the correct location
  serverExternalPackages: ['@supabase/supabase-js', 'groq-sdk'],
  // Remove any experimental.serverComponentsExternalPackages if present
  experimental: {
    // Remove this line if it exists:
    // serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig
