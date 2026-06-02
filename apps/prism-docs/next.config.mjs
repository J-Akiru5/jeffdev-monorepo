/* global process */
import nextra from 'nextra'
import { withSentry } from "@syntaxure/sentry-config";

const withNextra = nextra({
  defaultShowCopyCode: true,
  search: {
    codeblocks: true
  }
})

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.tsx'
    }
  }
}

const nextraConfig = withNextra(nextConfig)

export default async function config() {
  const configWithSentry = withSentry(nextraConfig, "prism-docs", {
    tracesSampleRate: 0.1,
  });
  if (process.env.ANALYZE === 'true') {
    const withBundleAnalyzer = (await import('@next/bundle-analyzer')).default;
    return withBundleAnalyzer()(configWithSentry);
  }
  return configWithSentry;
}
