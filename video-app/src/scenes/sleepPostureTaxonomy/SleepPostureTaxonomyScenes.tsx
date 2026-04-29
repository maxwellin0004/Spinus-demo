import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../../theme/tokens";
import type { TaxonomyItem, TaxonomyTimelineSegment } from "../../data/sleepPostureTaxonomyData";

type Header = {
  channelLabel: string;
  eyebrow: string;
  question: string;
  sourceNote: string;
};

type TaxonomySceneProps = {
  header: Header;
  items: readonly TaxonomyItem[];
  segment: TaxonomyTimelineSegment;
};

const STYLE = {
  bg: "#ffffff",
  ink: "#171717",
  muted: "#5c626b",
  blue: "#22aeea",
  lightBlue: "rgba(34, 174, 234, 0.14)",
  divider: "#171717",
};

const FIGURE_PALETTES = [
  { outfit: "#4f8df7", shade: "#2f65c8", prop: "#7dd3fc" },
  { outfit: "#ff8a65", shade: "#d76545", prop: "#ffd166" },
  { outfit: "#7c6ee6", shade: "#594ec0", prop: "#a7f3d0" },
  { outfit: "#34b88a", shade: "#248967", prop: "#fca5a5" },
  { outfit: "#f3b43f", shade: "#c78312", prop: "#93c5fd" },
  { outfit: "#e06aa3", shade: "#b84a80", prop: "#c4b5fd" },
] as const;

const poseHead = {
  bed_phone: { cx: 38, cy: 93, hair: "M18 92 C22 72 52 70 58 92 C48 84 31 84 18 92 Z" },
  curled_scroll: { cx: 76, cy: 48, hair: "M57 47 C60 28 91 27 96 49 C86 41 68 40 57 47 Z" },
  one_hand_slouch: { cx: 70, cy: 41, hair: "M51 40 C55 20 87 19 92 42 C82 34 63 33 51 40 Z" },
  desk_scroll: { cx: 48, cy: 86, hair: "M28 84 C32 64 64 64 70 86 C58 78 41 77 28 84 Z" },
  walking_phone: { cx: 72, cy: 39, hair: "M53 38 C56 18 88 16 93 39 C85 31 65 30 53 38 Z" },
  blanket_phone: { cx: 73, cy: 56, hair: "M54 55 C57 35 88 35 94 57 C84 49 65 48 54 55 Z" },
} as const;

const ChibiHead: React.FC<{
  cx: number;
  cy: number;
  hair: string;
  scale?: number;
}> = ({ cx, cy, hair, scale = 1 }) => (
  <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}>
    <circle cx={cx} cy={cy} r="22" fill="#ffe1c8" stroke="#232323" strokeWidth="4" />
    <path d={hair} fill="#2e2e2e" />
    <path
      d={`M${cx - 10} ${cy + 8} C${cx - 5} ${cy + 14} ${cx + 7} ${cy + 14} ${cx + 12} ${cy + 8}`}
      fill="none"
      stroke="#232323"
      strokeWidth="3.4"
      strokeLinecap="round"
    />
    <circle cx={cx - 7} cy={cy} r="2.4" fill="#232323" />
    <circle cx={cx + 8} cy={cy} r="2.4" fill="#232323" />
    <circle cx={cx - 14} cy={cy + 7} r="3.4" fill="#ffb4a8" opacity="0.72" />
    <circle cx={cx + 15} cy={cy + 7} r="3.4" fill="#ffb4a8" opacity="0.72" />
  </g>
);

const AnimePhone: React.FC<{ x: number; y: number; color: string; rotate?: number }> = ({ x, y, color, rotate = 0 }) => (
  <g transform={`rotate(${rotate} ${x + 13} ${y + 18})`}>
    <rect x={x} y={y} width="26" height="36" rx="6" fill={color} stroke="#232323" strokeWidth="4" />
    <rect x={x + 7} y={y + 5} width="12" height="4" rx="2" fill="#ffffff" opacity="0.58" />
  </g>
);

const ChibiLimb: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotate?: number;
  radius?: number;
}> = ({ x, y, width, height, color, rotate = 0, radius = 12 }) => (
  <g transform={`rotate(${rotate} ${x + width / 2} ${y + height / 2})`}>
    <rect x={x} y={y} width={width} height={height} rx={radius} fill={color} stroke="#232323" strokeWidth="4" />
  </g>
);

const ChibiShoe: React.FC<{ x: number; y: number; rotate?: number }> = ({ x, y, rotate = 0 }) => (
  <g transform={`rotate(${rotate} ${x + 13} ${y + 8})`}>
    <ellipse cx={x + 13} cy={y + 8} rx="17" ry="9" fill="#2f3136" stroke="#232323" strokeWidth="3" />
  </g>
);

const AnimeFigure: React.FC<{
  pose: TaxonomyItem["pose"];
  active: boolean;
  palette: (typeof FIGURE_PALETTES)[number];
}> = ({ pose, active, palette }) => {
  const phoneColor = active ? palette.prop : "#ffffff";

  if (pose === "bed_phone") {
    return (
      <>
        <path d="M15 137 C43 126 91 126 130 139" fill="none" stroke="#c7d2fe" strokeWidth="10" />
        <rect x="14" y="125" width="38" height="22" rx="9" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="3" />
        <g transform="translate(10 22) rotate(-28 72 96)">
          <ellipse cx="70" cy="100" rx="40" ry="24" fill={palette.outfit} stroke="#232323" strokeWidth="4" />
          <ChibiLimb x="31" y="95" width="36" height="18" color={palette.outfit} rotate={-20} />
          <ChibiLimb x="75" y="103" width="42" height="20" color={palette.shade} rotate={-42} />
          <ChibiShoe x="104" y="87" rotate={-40} />
          <ChibiShoe x="18" y="104" rotate={12} />
        </g>
        <ChibiHead cx={43} cy={89} hair={poseHead.bed_phone.hair} />
        <AnimePhone x={84} y={28} color={phoneColor} />
      </>
    );
  }

  if (pose === "curled_scroll") {
    return (
      <>
        <ellipse cx="75" cy="114" rx="42" ry="38" fill={palette.outfit} stroke="#232323" strokeWidth="4" />
        <ChibiLimb x="39" y="111" width="44" height="20" color={palette.shade} rotate={-45} />
        <ChibiLimb x="70" y="126" width="45" height="20" color={palette.shade} rotate={25} />
        <ChibiLimb x="82" y="91" width="34" height="17" color={palette.outfit} rotate={32} />
        <ChibiShoe x="33" y="132" rotate={-18} />
        <ChibiShoe x="89" y="144" rotate={12} />
        <ChibiHead cx={74} cy={48} hair={poseHead.curled_scroll.hair} />
        <AnimePhone x={96} y={84} color={phoneColor} />
      </>
    );
  }

  if (pose === "one_hand_slouch") {
    return (
      <>
        <g transform="rotate(-13 75 95)">
          <ellipse cx="75" cy="98" rx="33" ry="47" fill={palette.outfit} stroke="#232323" strokeWidth="4" />
          <ChibiLimb x="96" y="88" width="35" height="17" color={palette.outfit} rotate={18} />
          <ChibiLimb x="44" y="89" width="20" height="40" color={palette.outfit} rotate={16} />
          <ChibiLimb x="55" y="132" width="45" height="20" color={palette.shade} rotate={-34} />
          <ChibiLimb x="82" y="126" width="48" height="20" color={palette.shade} rotate={26} />
        </g>
        <ChibiHead cx={70} cy={41} hair={poseHead.one_hand_slouch.hair} />
        <ChibiShoe x="42" y="141" rotate={-28} />
        <ChibiShoe x="115" y="143" rotate={22} />
        <AnimePhone x={106} y={92} color={phoneColor} />
      </>
    );
  }

  if (pose === "desk_scroll") {
    return (
      <>
        <rect x="20" y="104" width="108" height="20" rx="6" fill="#fff7ed" stroke="#fdba74" strokeWidth="4" />
        <path d="M30 123 L22 168 M115 123 L126 168" stroke="#fdba74" strokeWidth="5" strokeLinecap="round" />
        <g transform="rotate(6 74 105)">
          <ellipse cx="78" cy="109" rx="40" ry="23" fill={palette.outfit} stroke="#232323" strokeWidth="4" />
          <ChibiLimb x="36" y="107" width="48" height="18" color={palette.outfit} rotate={-5} />
          <ChibiLimb x="91" y="105" width="34" height="18" color={palette.outfit} rotate={4} />
          <ChibiLimb x="51" y="126" width="25" height="32" color={palette.shade} rotate={25} />
          <ChibiLimb x="95" y="125" width="25" height="35" color={palette.shade} rotate={-12} />
        </g>
        <ChibiHead cx={47} cy={86} hair={poseHead.desk_scroll.hair} scale={0.92} />
        <AnimePhone x={98} y={83} color={phoneColor} />
      </>
    );
  }

  if (pose === "walking_phone") {
    return (
      <>
        <path d="M18 72 C27 67 34 67 42 72 M14 94 C25 90 33 90 43 95" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="74" cy="102" rx="31" ry="47" fill={palette.outfit} stroke="#232323" strokeWidth="4" />
        <ChibiLimb x="99" y="88" width="34" height="17" color={palette.outfit} rotate={44} />
        <ChibiLimb x="42" y="89" width="20" height="40" color={palette.outfit} rotate={-18} />
        <ChibiLimb x="48" y="133" width="49" height="20" color={palette.shade} rotate={-47} />
        <ChibiLimb x="82" y="133" width="51" height="20" color={palette.shade} rotate={31} />
        <ChibiHead cx={72} cy={39} hair={poseHead.walking_phone.hair} />
        <ChibiShoe x="34" y="153" rotate={-32} />
        <ChibiShoe x="122" y="148" rotate={24} />
        <AnimePhone x={102} y={93} color={phoneColor} />
      </>
    );
  }

  return (
    <>
      <path
        d="M28 96 C44 78 102 78 119 101 C127 118 124 148 109 167 L39 167 C24 147 19 118 28 96 Z"
        fill="#fce7f3"
        stroke="#f9a8d4"
        strokeWidth="5"
      />
      <ellipse cx="74" cy="119" rx="31" ry="43" fill={palette.outfit} stroke="#232323" strokeWidth="4" />
      <ChibiLimb x="46" y="126" width="42" height="19" color={palette.shade} rotate={45} />
      <ChibiLimb x="75" y="126" width="43" height="19" color={palette.shade} rotate={-45} />
      <ChibiHead cx={73} cy={56} hair={poseHead.blanket_phone.hair} />
      <AnimePhone x={87} y={96} color={phoneColor} />
    </>
  );
};

const MeetingFigure: React.FC<{
  item: TaxonomyItem;
  active: boolean;
  index: number;
}> = ({ item, active, index }) => {
  const frame = useCurrentFrame();
  const pulse = active ? spring({ frame: frame % 45, fps: 30, config: { damping: 14, stiffness: 110 } }) : 0;
  const lift = active ? -8 - pulse * 2 : 0;
  const opacity = active ? 1 : 0.88;
  const palette = FIGURE_PALETTES[index % FIGURE_PALETTES.length];

  return (
    <div
      style={{
        width: 188,
        height: 250,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        transform: `translateY(${lift}px)`,
        opacity,
      }}
    >
      <div style={{ position: "relative", width: 146, height: 184 }}>
        {active ? (
          <div
            style={{
              position: "absolute",
              left: 4,
              top: 2,
              width: 136,
              height: 152,
              border: `5px solid ${STYLE.blue}`,
              borderRadius: 18,
              background: active ? STYLE.lightBlue : "transparent",
              transform: `scale(${1 + pulse * 0.04})`,
            }}
          />
        ) : null}
        {item.imageSrc ? (
          <>
            <Img
              src={staticFile(item.imageSrc)}
              style={{
                position: "absolute",
                left: -27,
                top: -18,
                width: 200,
                height: 200,
                objectFit: "contain",
                filter: active
                  ? "drop-shadow(0 12px 18px rgba(34, 174, 234, 0.24))"
                  : "drop-shadow(0 8px 12px rgba(0, 0, 0, 0.08))",
                transform: `scale(${active ? 1.04 + pulse * 0.02 : 1})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 54,
                bottom: 0,
                width: 26,
                height: 26,
                borderRadius: 13,
                background: active ? STYLE.blue : STYLE.ink,
                color: "#fff",
                fontFamily: THEME.fonts.ui,
                fontSize: 16,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.letter}
            </div>
            <div
              style={{
                position: "absolute",
                right: 4,
                top: 12,
                color: "#b9b9b9",
                fontFamily: THEME.fonts.ui,
                fontSize: 14,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
          </>
        ) : (
          <svg viewBox="0 0 146 184" width="146" height="184" style={{ position: "relative" }}>
            <rect x="34" y="18" width="78" height="121" rx="16" fill="#fff" stroke="#d9d9d9" strokeWidth="2" />
            <AnimeFigure pose={item.pose} active={active} palette={palette} />
            <circle cx="66" cy="174" r="13" fill={active ? STYLE.blue : STYLE.ink} />
            <text
              x="66"
              y="179"
              fill="#fff"
              textAnchor="middle"
              fontSize="16"
              fontFamily={THEME.fonts.ui}
              fontWeight="800"
            >
              {item.letter}
            </text>
            <text x="124" y="22" fill="#b9b9b9" textAnchor="middle" fontSize="14" fontFamily={THEME.fonts.ui}>
              {String(index + 1).padStart(2, "0")}
            </text>
          </svg>
        )}
      </div>
      <div
        style={{
          marginTop: 4,
          color: STYLE.ink,
          fontFamily: THEME.fonts.bodyZh,
          fontSize: 24,
          fontWeight: 800,
          lineHeight: 1.05,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {item.label}
      </div>
      <div
        style={{
          marginTop: 6,
          color: active ? STYLE.blue : STYLE.muted,
          fontFamily: THEME.fonts.bodyZh,
          fontSize: 18,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {item.shortTrait}
      </div>
    </div>
  );
};

const TopLabels: React.FC<{ header: Header }> = ({ header }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: 48,
        top: 34,
        display: "flex",
        alignItems: "center",
        gap: 10,
        color: STYLE.ink,
        fontFamily: THEME.fonts.bodyZh,
        fontSize: 24,
        fontWeight: 900,
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          border: `4px solid ${STYLE.blue}`,
          display: "inline-block",
          boxSizing: "border-box",
        }}
      />
      {header.channelLabel}
    </div>
    <div
      style={{
        position: "absolute",
        right: 58,
        top: 38,
        color: "#4a4f56",
        fontFamily: THEME.fonts.bodyZh,
        fontSize: 18,
        fontWeight: 700,
      }}
    >
      {header.eyebrow}
    </div>
    <div
      style={{
        position: "absolute",
        right: 80,
        top: 642,
        color: STYLE.ink,
        fontFamily: THEME.fonts.bodyZh,
        fontSize: 21,
        fontWeight: 800,
      }}
    >
      {header.sourceNote}
    </div>
  </>
);

const BottomNarrationBand: React.FC<{ caption: string; variant?: "normal" | "cta" }> = ({ caption, variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 130 } });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 118,
        paddingTop: 28,
        borderTop: `4px solid ${STYLE.divider}`,
        display: "flex",
        justifyContent: "center",
        transform: `translateY(${(1 - intro) * 14}px)`,
        opacity: intro,
      }}
    >
      <div
        style={{
          maxWidth: 1420,
          padding: "0 36px",
          color: variant === "cta" ? STYLE.blue : STYLE.ink,
          fontFamily: THEME.fonts.bodyZh,
          fontSize: variant === "cta" ? 58 : 50,
          lineHeight: 1.16,
          fontWeight: 950,
          textAlign: "center",
          letterSpacing: 0,
        }}
      >
        {caption}
      </div>
    </div>
  );
};

const TaxonomyBoard: React.FC<TaxonomySceneProps & { cta?: boolean }> = ({ header, items, segment, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const intro = spring({ frame, fps, config: { damping: 22, stiffness: 105 } });
  const scale = interpolate(frame, [0, 1260], [1, 1.018], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: STYLE.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${scale})`,
          transformOrigin: "center 42%",
        }}
      >
        <TopLabels header={header} />
        <div
          style={{
            position: "absolute",
            top: 128,
            left: 0,
            right: 0,
            textAlign: "center",
            color: STYLE.blue,
            fontFamily: THEME.fonts.bodyZh,
            fontSize: 70,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: 0,
            opacity: intro,
            transform: `translateY(${(1 - intro) * 18}px)`,
          }}
        >
          {header.question}
        </div>
        <div
          style={{
            position: "absolute",
            top: 258,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {items.map((item, index) => (
            <MeetingFigure
              key={item.id}
              item={item}
              index={index}
              active={segment.activeItemIds.includes(item.id)}
            />
          ))}
        </div>
      </div>
      <BottomNarrationBand caption={segment.caption} variant={cta ? "cta" : "normal"} />
      <div
        style={{
          position: "absolute",
          left: 54,
          bottom: 42,
          color: "#8b8f94",
          fontFamily: THEME.fonts.ui,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        timing: estimated_after_audio_duration_fit
      </div>
    </AbsoluteFill>
  );
};

export const TaxonomyOpenerScene: React.FC<TaxonomySceneProps> = (props) => <TaxonomyBoard {...props} />;

export const PostureStripScene: React.FC<TaxonomySceneProps> = (props) => <TaxonomyBoard {...props} />;

export const CaptionRevealScene: React.FC<TaxonomySceneProps> = (props) => <TaxonomyBoard {...props} />;

export const ResultPromptScene: React.FC<TaxonomySceneProps> = (props) => <TaxonomyBoard {...props} cta />;
