declare module "gsap-trial/SplitText" {
  import type { Tween, Timeline } from "gsap";

  export type SplitTextVars = {
    type?: "chars" | "words" | "lines" | "words, chars";
    smartWrap?: boolean;
    autoSplit?: boolean;
    linesClass?: string;
    wordsClass?: string;
    charsClass?: string;
    reduceWhiteSpace?: boolean;
    onSplit?: (self: SplitText) => Tween | Timeline | Tween[] | void;
  };

  export class SplitText {
    // GSAP nhận Element (không bắt buộc HTMLElement)
    constructor(element: Element, vars?: SplitTextVars);
    revert(): void;

    // GSAP trả về Element[] (không đảm bảo là HTMLElement[])
    chars: Element[];
    words: Element[];
    lines: Element[];
  }

  export { SplitText as default };
}
