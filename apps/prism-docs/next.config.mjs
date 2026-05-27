/* global process */
import nextra from 'nextra'
import withBundleAnalyzer from '@next/bundle-analyzer'

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

export default process.env.ANALYZE === 'true'
  ? withBundleAnalyzer()(finalConfig)
  : finalConfig
