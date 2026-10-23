export interface HtmlFrameProps {
  title: string;
  html: string;
}

/** Renders trusted-but-untouched HTML in a sandboxed frame so its styles cannot leak. */
export function HtmlFrame({ title, html }: HtmlFrameProps) {
  return <iframe title={title} sandbox="allow-same-origin" srcDoc={html} className="html-frame" />;
}
