module.exports = {
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
  async redirects() {
    return [
      {
        source: '/docs/:slug*.md',
        destination: '/docs/:slug*',
        permanent: true,
      },
      {
        source: '/docs/guides/identity-providers/:slug*',
        destination: '/docs/identity-providers/:slug*',
        permanent: true,
      },
      {
        source: '/docs/configuration/identity-providers/:slug*',
        destination: '/docs/identity-providers/:slug*',
        permanent: true,
      },
      {
        source: '/docs/getting-started/introduction',
        destination: '/docs/getting-started/what-is-infra',
        permanent: true,
      },
      {
        source: '/docs/install/configure/custom-domain',
        destination: '/docs/install/custom-domain',
        permanent: true,
      },
      {
        source: '/docs/install/configure/encryption',
        destination: '/docs/reference/helm-reference#encryption',
        permanent: true,
      },
      {
        source: '/docs/install/configure/postgres',
        destination: '/docs/reference/helm-reference#postgres-database',
        permanent: true,
      },
      {
        source: '/docs/install/configure/secrets',
        destination: '/docs/reference/helm-reference#secrets',
        permanent: true,
      },
      {
        source: '/docs/install/configure/custom-domain',
        destination: '/docs/install/custom-domain',
        permanent: true,
      },
      {
        source: '/docs/install/configure/custom-domain',
        destination: '/docs/install/custom-domain',
        permanent: true,
      },
      {
        source: '/docs/guides/:slug*',
        destination: '/docs/configuration/:slug*',
        permanent: true,
      },
      {
        source: '/docs',
        destination: '/docs/getting-started/what-is-infra',
        permanent: true,
      },
      {
        source: '/docs/getting-started/key-concepts',
        destination: '/docs/reference/how-infra-works',
        permanent: true,
      },
    ]
  },
}
