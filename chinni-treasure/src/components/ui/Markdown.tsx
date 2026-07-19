"use client";

import dynamic from "next/dynamic";

// react-markdown pulls in a sizeable unified/remark/rehype graph. Product
// descriptions render on the homepage, catalogue, category and product pages,
// so statically importing it would push that graph into the main client bundle
// every visitor downloads and executes. Loading it via next/dynamic keeps the
// server-rendered HTML (good for SEO + first paint) while moving the library
// into a separate async chunk that does not block initial parse/compile.
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: true });

export interface MarkdownProps {
  children: string;
  className?: string;
}

export default function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
