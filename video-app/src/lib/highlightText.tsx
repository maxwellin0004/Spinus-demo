import { ReactNode } from "react";
import { THEME } from "../theme/tokens";

export const highlightText = (
  text: string,
  accentWords: readonly string[],
): ReactNode => {
  if (accentWords.length === 0) {
    return text;
  }

  const escaped = accentWords
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (escaped.length === 0) {
    return text;
  }

  const matcher = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(matcher);

  return parts.map((part, index) => {
    const isAccent = accentWords.some(
      (word) => word.toLowerCase() === part.toLowerCase(),
    );

    if (!isAccent) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return (
      <span key={`${part}-${index}`} style={{ color: THEME.colors.accent }}>
        {part}
      </span>
    );
  });
};
