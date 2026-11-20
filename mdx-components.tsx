import type { MDXComponents } from "mdx/types";
import Link from "next/link";

const components: MDXComponents = {
  a: ({ href = "", children, ...rest }) =>
    /^https?:\/\//.test(href) ? (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    ) : (
      <Link href={href} {...rest}>
        {children}
      </Link>
    ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
