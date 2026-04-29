import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  futureIncomeTracks,
  futureIncomeTracksHeader,
  FUTURE_INCOME_TRACKS_DURATION_IN_FRAMES,
  type FutureIncomeTrack,
} from "../data/futureIncomeTracksData";

export { FUTURE_INCOME_TRACKS_DURATION_IN_FRAMES };

const layout = [
  { top: 488, width: 660, height: 224 },
  { top: 724, width: 744, height: 228 },
  { top: 966, width: 826, height: 232 },
  { top: 1210, width: 910, height: 244 },
  { top: 1466, width: 990, height: 258 },
] as const;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const TrackTier: React.FC<{
  item: FutureIncomeTrack;
  index: number;
}> = ({ item, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tier = layout[index];
  const buildOrder = futureIncomeTracks.length - 1 - index;
  const entrance = spring({
    frame: frame - (18 + buildOrder * 8),
    fps,
    durationInFrames: 28,
    config: { damping: 180 },
  });
  const shimmer = interpolate(
    frame,
    [54 + index * 5, 110 + index * 4],
    [-120, 120],
    clamp,
  );
  const y = interpolate(entrance, [0, 1], [70, 0]);
  const opacity = interpolate(entrance, [0, 0.72, 1], [0, 0.72, 1], clamp);
  const topInset = 7 + index * 1.6;

  return (
    <div
      style={{
        position: "absolute",
        left: (1080 - tier.width) / 2,
        top: tier.top,
        width: tier.width,
        height: tier.height,
        opacity,
        transform: `translateY(${y}px) scale(${0.965 + entrance * 0.035})`,
        filter: `drop-shadow(0 ${18 + index * 3}px ${22 + index * 4}px rgba(0, 0, 0, 0.26))`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `polygon(${topInset}% 0, ${100 - topInset}% 0, 100% 100%, 0 100%)`,
          background: "rgba(2, 12, 8, 0.78)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "2px 3px 3px",
          clipPath: `polygon(${topInset}% 0, ${100 - topInset}% 0, 100% 100%, 0 100%)`,
          background: `linear-gradient(105deg, ${item.softAccent}, rgba(245, 255, 205, 0.94) 52%, ${item.accent})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${shimmer}%`,
            top: -80,
            width: 170,
            height: tier.height + 160,
            transform: "rotate(17deg)",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.52), transparent)",
            opacity: 0.34,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "26px 58px 22px",
            color: "#06110c",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 10,
            fontFamily: "NotoSansSC, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
            }}
          >
            <span
              style={{
                width: 68,
                height: 68,
                borderRadius: 24,
                background: "#07130e",
                color: item.accent,
                display: "grid",
                placeItems: "center",
                fontFamily: "Orbitron, NotoSansSC, sans-serif",
                fontSize: 32,
                fontWeight: 500,
                boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.18)",
              }}
            >
              {String(item.rank).padStart(2, "0")}
            </span>
            <div
              style={{
                fontSize: index >= 3 ? 43 : 41,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.06em",
              }}
            >
              第 {item.rank} 个：{item.title}
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 25,
              lineHeight: 1.2,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            {item.thesis}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "9px 12px",
            }}
          >
            {item.keywords.map((keyword) => (
              <span
                key={keyword}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  background: "rgba(4, 18, 12, 0.12)",
                  border: "1px solid rgba(4, 18, 12, 0.18)",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FutureIncomeTracksComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const titleIn = spring({
    frame,
    fps,
    durationInFrames: 32,
    config: { damping: 160 },
  });
  const cameraPush = interpolate(frame, [0, durationInFrames - 1], [1, 1.035], clamp);
  const glowTravel = interpolate(frame, [0, durationInFrames - 1], [-140, 120], clamp);
  const footerOpacity = interpolate(frame, [82, 118], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 7%, rgba(189, 255, 120, 0.75), transparent 23%), radial-gradient(circle at 18% 78%, rgba(35, 226, 156, 0.42), transparent 25%), linear-gradient(180deg, #0a2a1c 0%, #5ee994 43%, #c9ff79 100%)",
        overflow: "hidden",
        fontFamily: "NotoSansSC, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "linear-gradient(180deg, rgba(0,0,0,0.65), transparent 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${glowTravel}%`,
          top: -210,
          width: 520,
          height: 2350,
          transform: "rotate(18deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 62,
          right: 62,
          top: 52,
          height: 240,
          borderRadius: 48,
          background: "rgba(4, 15, 10, 0.34)",
          border: "1px solid rgba(235, 255, 198, 0.28)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.24)",
          opacity: interpolate(titleIn, [0, 1], [0, 1], clamp),
          transform: `translateY(${interpolate(titleIn, [0, 1], [-34, 0])}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 68,
          left: 70,
          right: 70,
          textAlign: "center",
          transform: `scale(${interpolate(titleIn, [0, 1], [0.94, 1], clamp)})`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(8, 25, 17, 0.82)",
            color: "#dfff86",
            fontSize: 25,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          {futureIncomeTracksHeader.kicker}
        </div>
        <div
          style={{
            marginTop: 18,
            color: "#06110b",
            fontSize: 74,
            lineHeight: 1.08,
            fontWeight: 700,
            letterSpacing: "-0.055em",
            textShadow: "0 4px 0 rgba(208, 255, 95, 0.45), 0 18px 36px rgba(0,0,0,0.2)",
          }}
        >
          {futureIncomeTracksHeader.titleLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${cameraPush})`,
          transformOrigin: "50% 62%",
        }}
      >
        {futureIncomeTracks.map((item, index) => (
          <TrackTier key={item.rank} item={item} index={index} />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          bottom: 82,
          opacity: footerOpacity,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#07130e",
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        <span>收藏前先判断：需求频次 / 客单价 / 复购 / 交付难度</span>
        <span
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(4, 18, 12, 0.16)",
            border: "1px solid rgba(4, 18, 12, 0.18)",
          }}
        >
          {futureIncomeTracksHeader.footnote}
        </span>
      </div>
    </AbsoluteFill>
  );
};
