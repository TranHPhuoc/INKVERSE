declare module "gsap-trial/SplitText" {
  import type { Tween, Timeline } from "gsap";

  export class SplitText {
    constructor(element: HTMLElement, vars?: SplitTextVars);
    revert(): void;
    chars: HTMLElement[];
    words: HTMLElement[];
    lines: HTMLElement[];
  }

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

  export { SplitText as default };
}
