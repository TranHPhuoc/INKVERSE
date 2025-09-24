import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";

/** Thuộc tính chung có thể spread cho cả <a> và <Link> (không bao gồm href/to) */
type CommonLinkAttrs = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  React.AriaAttributes;

export type PillNavItem = {
  label: React.ReactNode; // icon + text
  href: string; // internal hoặc external
  ariaLabel?: string;
  linkProps?: Partial<CommonLinkAttrs>; // id, title, onClick, data-*, aria-*
};

export interface PillNavProps {
  items: PillNavItem[];
  activeHref?: string;
  className?: string;

  /** Tuỳ biến hiệu ứng & màu sắc */
  ease?: string; // ví dụ: "power2.easeOut"
  pillColor?: string; // nền pill (mặc định #fff)
  hoverCircleColor?: string; // màu vòng tròn khi hover (mặc định #0f172a)
  hoveredTextColor?: string; // màu chữ khi hover (mặc định #fff)
  textColor?: string; // màu chữ bình thường (mặc định #0f172a)
  borderColor?: string; // màu viền pill (mặc định #CBD5E1 - slate-300)

  /** Kích thước & khoảng cách */
  navHeight?: string; // chiều cao pill: "44px" | "46px"...
  gap?: string; // khoảng cách giữa các pill
  fontSize?: string; // "16px" | "17px"...
}

const PillNav: React.FC<PillNavProps> = ({
  items,
  activeHref,
  className = "",
  ease = "power3.easeOut",
  pillColor = "#ffffff",
  hoverCircleColor = "#0f172a",
  hoveredTextColor = "#ffffff",
  textColor = "#0f172a",
  borderColor = "#CBD5E1",
  navHeight = "46px",
  gap = "8px",
  fontSize = "16px",
}) => {
  const circleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tlRefs = useRef<(gsap.core.Timeline | null)[]>([]);
  const activeTweenRefs = useRef<(gsap.core.Tween | null)[]>([]);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return;
        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        // Tính kích thước vòng tròn phủ hết pill khi scale
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

        const label = pill.querySelector<HTMLElement>(".pill-label");
        const white = pill.querySelector<HTMLElement>(".pill-label-hover");
        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const i = circleRefs.current.indexOf(circle);
        if (i === -1) return;

        tlRefs.current[i]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0);
        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" }, 0);
        }
        tlRefs.current[i] = tl;
      });
    };

    layout();
    const onResize = () => layout();
    window.addEventListener("resize", onResize);

    // gõ kiểu an toàn cho document.fonts
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    fonts?.ready.then(layout).catch(() => {});

    return () => window.removeEventListener("resize", onResize);
  }, [items, ease]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: "auto",
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: "auto" });
  };

  const isExternal = (href: string) =>
    /^https?:\/\//.test(href) ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#");

  // CSS variables dùng cho inline styles
  const cssVars = {
    ["--pill-bg"]: pillColor,
    ["--hover-circle"]: hoverCircleColor,
    ["--hover-text"]: hoveredTextColor,
    ["--pill-text"]: textColor,
    ["--pill-border"]: borderColor,
    ["--nav-h"]: navHeight,
    ["--pill-gap"]: gap,
    ["--pill-pad-x"]: "18px",
    ["--pill-font"]: fontSize,
  } as React.CSSProperties;

  return (
    <nav
      className={`inline-flex items-center ${className}`}
      aria-label="Header actions"
      style={cssVars}
    >
      <ul
        role="menubar"
        className="m-0 flex list-none items-center p-0"
        style={{ gap: "var(--pill-gap)" }}
      >
        {items.map((item) => {
          const active = activeHref === item.href;

          const pillStyle: React.CSSProperties = {
            background: "var(--pill-bg)",
            color: "var(--pill-text)",
            border: `1px solid var(--pill-border)`,
            height: "var(--nav-h)",
            paddingLeft: "var(--pill-pad-x)",
            paddingRight: "var(--pill-pad-x)",
            fontSize: "var(--pill-font)",
          };

          const PillContent = (
            <>
              {/* vòng tròn hover */}
              <span
                className="hover-circle pointer-events-none absolute bottom-0 left-1/2 z-[1] block rounded-full"
                style={{ background: "var(--hover-circle)", willChange: "transform" }}
                ref={(el) => {
                  circleRefs.current[items.indexOf(item)] = el;
                }}
              />
              {/* stack label */}
              <span className="label-stack relative z-[2] inline-block leading-[1]">
                <span
                  className="pill-label relative z-[2] inline-flex items-center gap-1.5 leading-[1]"
                  style={{ willChange: "transform" }}
                >
                  {item.label}
                </span>
                <span
                  className="pill-label-hover absolute top-0 left-0 z-[3] inline-flex items-center gap-1.5"
                  style={{ color: "var(--hover-text)", willChange: "transform, opacity" }}
                  aria-hidden="true"
                >
                  {item.label}
                </span>
              </span>

              {/* chấm active (tuỳ thích giữ lại) */}
              {active && (
                <span
                  className="absolute -bottom-[6px] left-1/2 z-[4] h-3 w-3 -translate-x-1/2 rounded-full"
                  style={{ background: "var(--hover-circle)" }}
                  aria-hidden="true"
                />
              )}
            </>
          );

          const common: CommonLinkAttrs = {
            role: "menuitem",
            className:
              "relative overflow-hidden inline-flex items-center justify-center no-underline rounded-full box-border font-semibold md:font-bold leading-none whitespace-nowrap cursor-pointer select-none",
            style: pillStyle,
            "aria-label": item.ariaLabel,
            onMouseEnter: () => handleEnter(items.indexOf(item)),
            onMouseLeave: () => handleLeave(items.indexOf(item)),
            ...(item.linkProps ?? {}),
          };

          return (
            <li key={item.href} role="none">
              {isExternal(item.href) ? (
                <a href={item.href} {...common}>
                  {PillContent}
                </a>
              ) : (
                <Link to={item.href} {...common}>
                  {PillContent}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default PillNav;
