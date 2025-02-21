module.exports = {
  reactStrictMode: true,
  generateBuildId: async () => {
    if (process.env.NEXT_BUILD_ID) {
      return process.env.NEXT_BUILD_ID
    }

    return null
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ]
  },
  output: 'standalone',
}
