import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import SplitText from "gsap-trial/SplitText";

gsap.registerPlugin(SplitText);

export type SplitTextProps = {
  text: string;
  className?: string;
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  /** milliseconds between elements */
  delay?: number;
  /** seconds per tween */
  duration?: number;
  ease?: string | ((t: number) => number);
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: React.CSSProperties["textAlign"];
  onComplete?: () => void;
};

type WithSplitCache = HTMLElement & { _split?: SplitText };

const SplitTextComponent: React.FC<SplitTextProps> = ({
  text,
  className = "",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  delay = 40,
  duration = 0.6,
  ease = "power3.out",
  tag = "p",
  textAlign = "center",
  onComplete,
}) => {
  const hostRef = useRef<HTMLElement | null>(null);

  // callback ref để hợp với mọi thẻ (h1/h2/p/span…)
  const setHostRef = <T extends HTMLElement>(node: T | null) => {
    hostRef.current = node as HTMLElement | null;
  };

  const [fontsReady, setFontsReady] = useState(false);

  // Memo hoá from/to để thỏa ESLint exhaustive-deps
  const fromVars = useMemo(() => from, [JSON.stringify(from)]);
  const toVars = useMemo(() => to, [JSON.stringify(to)]);

  useEffect(() => {
    const anyDoc = document as unknown as { fonts?: FontFaceSet };
    if (anyDoc.fonts) {
      if (anyDoc.fonts.status === "loaded") setFontsReady(true);
      else anyDoc.fonts.ready.then(() => setFontsReady(true));
    } else {
      setFontsReady(true);
    }
  }, []);

  useEffect(() => {
    const el = hostRef.current as WithSplitCache | null;
    if (!el || !fontsReady) return;

    // Revert lần trước nếu có
    el._split?.revert();
    delete el._split; // ❗ thay vì gán undefined (fix TS2412)

    const split = new SplitText(el, {
      type: splitType,
      smartWrap: true,
      autoSplit: splitType === "lines",
      linesClass: "split-line",
      wordsClass: "split-word",
      charsClass: "split-char",
      reduceWhiteSpace: false,
    });
    el._split = split;

    // chọn targets theo splitType, fallback hợp lý
    const pickTargets = (): Element[] => {
      if (splitType.includes("chars") && split.chars.length) return split.chars;
      if (splitType.includes("words") && split.words.length) return split.words;
      if (splitType.includes("lines") && split.lines.length) return split.lines;
      return split.chars.length ? split.chars : split.words.length ? split.words : split.lines;
    };
    const targets = pickTargets();

    const tween = gsap.fromTo(
      targets,
      { ...fromVars },
      {
        ...toVars,
        duration,
        ease,
        stagger: delay / 1000,
        force3D: true,
        willChange: "transform,opacity",
        ...(onComplete ? { onComplete } : {}), // tránh pass undefined
      },
    );

    return () => {
      tween.kill();
      try {
        split.revert();
      } catch {
        /* ignore */
      }
      delete el._split; // ❗ fix TS2412 lần 2
    };
  }, [text, splitType, fromVars, toVars, delay, duration, ease, fontsReady, onComplete]);

  const style: React.CSSProperties = {
    textAlign,
    wordWrap: "break-word",
    willChange: "transform,opacity",
  };
  const classes = `split-parent block overflow-hidden whitespace-normal ${className}`;

  switch (tag) {
    case "h1":
      return (
        <h1 ref={setHostRef as React.Ref<HTMLHeadingElement>} style={style} className={classes}>
          {text}
        </h1>
      );
    case "h2":
      return (
        <h2 ref={setHostRef as React.Ref<HTMLHeadingElement>} style={style} className={classes}>
          {text}
        </h2>
      );
    case "h3":
      return (
        <h3 ref={setHostRef as React.Ref<HTMLHeadingElement>} style={style} className={classes}>
          {text}
        </h3>
      );
    case "h4":
      return (
        <h4 ref={setHostRef as React.Ref<HTMLHeadingElement>} style={style} className={classes}>
          {text}
        </h4>
      );
    case "h5":
      return (
        <h5 ref={setHostRef as React.Ref<HTMLHeadingElement>} style={style} className={classes}>
          {text}
        </h5>
      );
    case "h6":
      return (
        <h6 ref={setHostRef as React.Ref<HTMLHeadingElement>} style={style} className={classes}>
          {text}
        </h6>
      );
    case "span":
      return (
        <span ref={setHostRef as React.Ref<HTMLSpanElement>} style={style} className={classes}>
          {text}
        </span>
      );
    default:
      return (
        <p ref={setHostRef as React.Ref<HTMLParagraphElement>} style={style} className={classes}>
          {text}
        </p>
      );
  }
};

export default SplitTextComponent;
