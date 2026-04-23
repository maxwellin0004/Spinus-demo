import { clsx } from "clsx";
import { CSSProperties, ReactNode } from "react";
import { THEME } from "../theme/tokens";

type HeadlineBlockProps = {
  eyebrow?: string;
  headline: ReactNode;
  supportingText?: string;
  align?: "left" | "center";
};

export const HeadlineBlock: React.FC<HeadlineBlockProps> = ({
  eyebrow,
  headline,
  supportingText,
  align = "center",
}) => {
  const alignmentStyle: CSSProperties = {
    alignItems: align === "center" ? "center" : "flex-start",
    textAlign: align,
  };

  return (
    <div
      className={clsx("flex max-w-[880px] flex-col gap-4", {
        "mx-auto": align === "center",
      })}
      style={alignmentStyle}
    >
      {eyebrow ? (
        <div
          style={{
            color: THEME.colors.accent,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontFamily: THEME.fonts.ui,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          color: THEME.colors.textPrimary,
          fontSize: 92,
          lineHeight: 1,
          fontWeight: 800,
          fontFamily: THEME.fonts.headlineZh,
        }}
      >
        {headline}
      </div>
      {supportingText ? (
        <div
          style={{
            color: THEME.colors.textMuted,
            fontSize: 34,
            lineHeight: 1.35,
            maxWidth: 780,
            fontFamily: THEME.fonts.bodyZh,
          }}
        >
          {supportingText}
        </div>
      ) : null}
    </div>
  );
};
