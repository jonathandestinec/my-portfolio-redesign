import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [{ source: "/playground", destination: "/works", permanent: true }];
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({
  options: {
    rehypePlugins: [
      [
        "@shikijs/rehype",
        { themes: { light: "github-light", dark: "github-dark-dimmed" } },
      ],
    ],
  },
});

export default withMDX(nextConfig);
