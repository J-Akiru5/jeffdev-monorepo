/* global process */
import nextra from 'nextra'

const withNextra = nextra({
  defaultShowCopyCode: true,
  search: {
    codeblocks: true
  }
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.tsx'
    }
  }
}

const finalConfig = withNextra(nextConfig)

export default async function config() {
  if (process.env.ANALYZE === 'true') {
    const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default;
    return withBundleAnalyzer()(finalConfig);
  }
  return finalConfig;
}
