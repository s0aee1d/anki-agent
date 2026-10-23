import { useCallback, useEffect, useRef } from "react";

export interface FrameSelection {
  text: string;
  /** Text of the block element holding the selection (context for the selected words). */
  block: string;
  /** Viewport coordinates of the selection's horizontal centre and bottom edge. */
  x: number;
  y: number;
}

export interface HtmlFrameProps {
  title: string;
  html: string;
  /** Called with the current non-empty selection inside the frame, or null when it is cleared or scrolled away. */
  onSelect?: (selection: FrameSelection | null) => void;
}

const BLOCK = "p,li,div,td,h1,h2,h3,h4,h5,h6,blockquote,body";

/**
 * Renders trusted-but-untouched HTML in a frame so its styles cannot leak. Scripts are allowed
 * because Anki card templates rely on them (hints, toggles, audio); same-origin is needed for
 * cookie-authenticated media. Only render content from the user's own collection here.
 */
export function HtmlFrame({ title, html, onSelect }: HtmlFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const timer = useRef<number>();
  const latest = useRef(onSelect);
  latest.current = onSelect;
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const attach = useCallback(() => {
    const frame = ref.current;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow as (Window & typeof globalThis) | null | undefined;
    if (!frame || !doc || !win) return;
    const emit = (v: FrameSelection | null) => latest.current?.(v);
    const report = () => {
      const sel = win.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!sel || sel.isCollapsed || !text) return emit(null);
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      const node = sel.anchorNode;
      const el = node instanceof win.Element ? node : node?.parentElement;
      emit({
        text,
        block: (el?.closest(BLOCK) ?? doc.body).textContent ?? "",
        x: f.left + r.left + r.width / 2,
        y: f.top + r.bottom,
      });
    };
    doc.addEventListener("selectionchange", () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(report, 150);
    });
    win.addEventListener("scroll", () => emit(null));
  }, []);

  return <iframe ref={ref} title={title} sandbox="allow-same-origin allow-scripts" srcDoc={html} className="html-frame" onLoad={attach} />;
}
