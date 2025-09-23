import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText as GSAPSplitText } from "gsap-trial/SplitText";

gsap.registerPlugin(GSAPSplitText);

export type SplitTextProps = {
  text: string;
  className?: string;
  splitType?: "chars" | "words" | "lines" | "words, chars";
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  delay?: number;
  duration?: number;
  ease?: string | ((t: number) => number);
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  textAlign?: React.CSSProperties["textAlign"];
  onComplete?: () => void;
};

type WithSplitCache = HTMLElement & { _split?: GSAPSplitText };

const SplitText: React.FC<SplitTextProps> = ({
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
  const ref = useRef<HTMLParagraphElement>(null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const d = document as unknown as { fonts?: FontFaceSet };
    if (d.fonts) {
      if (d.fonts.status === "loaded") setFontsReady(true);
      else d.fonts.ready.then(() => setFontsReady(true));
    } else setFontsReady(true);
  }, []);

  useEffect(() => {
    const el = ref.current as WithSplitCache | null;
    if (!el || !fontsReady) return;

    el._split?.revert();
    el._split = undefined;

    // Tách text
    const split = new GSAPSplitText(el, {
      type: splitType,
      smartWrap: true,
      autoSplit: splitType === "lines",
      linesClass: "split-line",
      wordsClass: "split-word",
      charsClass: "split-char",
      reduceWhiteSpace: false,
    });
    el._split = split;

    let targets: Element[] = [];
    if (splitType.includes("chars") && split.chars?.length) targets = split.chars;
    if (!targets.length && splitType.includes("words") && split.words?.length)
      targets = split.words;
    if (!targets.length && splitType.includes("lines") && split.lines?.length)
      targets = split.lines;
    if (!targets.length)
      targets = (split.chars || split.words || split.lines) as unknown as Element[];

    const tween = gsap.fromTo(
      targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        force3D: true,
        onComplete: onComplete,
        willChange: "transform,opacity",
      },
    );

    return () => {
      tween.kill();
      try {
        split.revert();
      } catch {
        /* ignore */
      }
      el._split = undefined;
    };
  }, [
    text,
    splitType,
    JSON.stringify(from),
    JSON.stringify(to),
    delay,
    duration,
    ease,
    fontsReady,
    onComplete,
  ]);

  const style: React.CSSProperties = {
    textAlign,
    wordWrap: "break-word",
    willChange: "transform,opacity",
  };
  const classes = `split-parent block overflow-hidden whitespace-normal ${className}`;

  switch (tag) {
    case "h1":
      return (
        <h1 ref={ref} style={style} className={classes}>
          {text}
        </h1>
      );
    case "h2":
      return (
        <h2 ref={ref} style={style} className={classes}>
          {text}
        </h2>
      );
    case "h3":
      return (
        <h3 ref={ref} style={style} className={classes}>
          {text}
        </h3>
      );
    case "h4":
      return (
        <h4 ref={ref} style={style} className={classes}>
          {text}
        </h4>
      );
    case "h5":
      return (
        <h5 ref={ref} style={style} className={classes}>
          {text}
        </h5>
      );
    case "h6":
      return (
        <h6 ref={ref} style={style} className={classes}>
          {text}
        </h6>
      );
    case "span":
      return (
        <span ref={ref} style={style} className={classes}>
          {text}
        </span>
      );
    default:
      return (
        <p ref={ref} style={style} className={classes}>
          {text}
        </p>
      );
  }
};

export default SplitText;
