import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Link } from "react-router-dom";
import type { ComponentPropsWithoutRef } from "react";

function MdLink(props: ComponentPropsWithoutRef<"a">) {
  const { href = "", children, ...rest } = props;
  if (href.startsWith("/")) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

// GFM task-list checkboxes are disabled inputs without labels; render them as inert glyphs instead.
function MdInput(props: ComponentPropsWithoutRef<"input">) {
  if (props.type === "checkbox") {
    return (
      <span aria-hidden="true" className="inline-block w-4 mr-1 select-none">
        {props.checked ? "☑" : "☐"}
      </span>
    );
  }
  return <input {...props} />;
}

export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{ a: MdLink, input: MdInput }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
