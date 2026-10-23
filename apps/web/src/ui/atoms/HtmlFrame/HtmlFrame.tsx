export interface HtmlFrameProps {
  title: string;
  html: string;
}

/**
 * Renders trusted-but-untouched HTML in a frame so its styles cannot leak. Scripts are allowed
 * because Anki card templates rely on them (hints, toggles, audio); same-origin is needed for
 * cookie-authenticated media. Only render content from the user's own collection here.
 */
export function HtmlFrame({ title, html }: HtmlFrameProps) {
  return <iframe title={title} sandbox="allow-same-origin allow-scripts" srcDoc={html} className="html-frame" />;
}
