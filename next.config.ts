import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [{ source: "/playground", destination: "/works", permanent: true }];
  },
  // Content is read from disk (content/projects/*.json, content/blog/*.mdx) so
  // entries added in the admin panel need no code change; ship it with every server function.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
    // Fonts for the proposal PDFs (Noto Sans covers ₦).
    "/api/**": ["./lib/proposals/fonts/*"],
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
    // Posts start with YAML frontmatter (written by the admin panel); it is exported as `meta`.
    remarkPlugins: ["remark-frontmatter", ["remark-mdx-frontmatter", { name: "meta" }]],
    rehypePlugins: [
      [
        "@shikijs/rehype",
        { themes: { light: "github-light", dark: "github-dark-dimmed" } },
      ],
    ],
  },
});

export default withMDX(nextConfig);
