import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES,
  socialPostPreviewData,
} from "../data/socialPostPreviewData";

const cardShadow = "0 28px 80px rgba(0, 0, 0, 0.26)";

export const SocialPostPreviewComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 120 },
  });

  const cardOpacity = interpolate(
    frame,
    [0, 8, SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES - 14, SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const bgScale = interpolate(
    frame,
    [0, SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES],
    [socialPostPreviewData.motion.backgroundScaleFrom, socialPostPreviewData.motion.backgroundScaleTo],
    {
      extrapolateRight: "clamp",
    },
  );
  const bgY = interpolate(
    frame,
    [0, SOCIAL_POST_PREVIEW_DURATION_IN_FRAMES],
    [0, socialPostPreviewData.motion.backgroundShiftY],
    {
      extrapolateRight: "clamp",
    },
  );
  const cardY = interpolate(intro, [0, 1], [socialPostPreviewData.motion.cardTranslateYIn, 0]);
  const cardScale = interpolate(intro, [0, 1], [socialPostPreviewData.motion.cardScaleFrom, 1]);
  const glowOpacity = interpolate(frame, [0, 16, 60], [0, socialPostPreviewData.motion.glowPeakOpacity, 0.28], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#17110a",
        overflow: "hidden",
        fontFamily: "NotoSansSC, sans-serif",
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${bgScale}) translateY(${bgY}px)`,
        }}
      >
        <Img
          src={staticFile(socialPostPreviewData.background.imageSrc)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(11,11,12,0.08) 0%, rgba(11,11,12,0.18) 38%, rgba(11,11,12,0.28) 100%)",
        }}
      />

      {socialPostPreviewData.background.sideBlur ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: 120,
              height: "100%",
              background: "rgba(32, 24, 18, 0.46)",
              backdropFilter: "blur(28px)",
            }}
          />
          <div
            style={{
              width: 120,
              height: "100%",
              background: "rgba(32, 24, 18, 0.46)",
              backdropFilter: "blur(28px)",
            }}
          />
        </div>
      ) : null}

      <div
        style={{
          position: "absolute",
          left: socialPostPreviewData.card.left,
          top: socialPostPreviewData.card.top,
          width: socialPostPreviewData.card.width,
          padding: "34px 38px 38px",
          borderRadius: 10,
          backgroundColor: "rgba(249, 246, 241, 0.90)",
          boxShadow: cardShadow,
          opacity: cardOpacity,
          transform: `translateY(${cardY}px) scale(${cardScale})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -24,
            background:
              "radial-gradient(circle, rgba(255, 238, 185, 0.42) 0%, rgba(255, 238, 185, 0) 70%)",
            opacity: glowOpacity,
          }}
        />
        <div style={{ position: "relative", display: "flex", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              background:
                "linear-gradient(135deg, #f1d2a4 0%, #ad7648 52%, #59402a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 20,
              fontFamily: "SourceSans3, sans-serif",
            }}
          >
            {socialPostPreviewData.card.avatarText}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#46382d" }}>
                {socialPostPreviewData.post.author}
              </div>
              <div
                style={{
                  borderRadius: 999,
                  backgroundColor: "rgba(216, 155, 53, 0.18)",
                  color: "#8d6414",
                  padding: "4px 10px",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {socialPostPreviewData.post.badge}
              </div>
            </div>
            <div style={{ fontSize: 19, color: "#7e7265" }}>
              {socialPostPreviewData.post.metaLine}
              <span style={{ marginLeft: 10 }}>发布于 {socialPostPreviewData.background.location}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 26,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            fontSize: 34,
            lineHeight: 1.6,
            color: "#2c2622",
            letterSpacing: 0,
          }}
        >
          {socialPostPreviewData.post.paragraphs.map((paragraph) => (
            <div key={paragraph}>{paragraph}</div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 220,
          background: "linear-gradient(180deg, rgba(10,10,12,0) 0%, rgba(10,10,12,0.28) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
