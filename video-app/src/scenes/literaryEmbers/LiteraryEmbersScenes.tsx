import React from "react";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  literaryEmbersCoverFlow,
  literaryEmbersMeta,
  literaryEmbersScenes,
  type LiteraryEmbersScene,
} from "../../data/LiteraryEmbersValidationData";

const palette = {
  black: "#050505",
  warm: "#e3b34c",
  white: "#f4f4f2",
  ash: "#d5d5d0",
};

const sceneImageMap: Record<string, string> = {
  le_s01: "/images/literary-embers/opener-moon-manuscript.png",
  le_s03: "/images/literary-embers/panel-trapped-desk.png",
  le_s04: "/images/literary-embers/panel-gaze-window.png",
  le_s05: "/images/literary-embers/panel-comparison-machine.png",
  le_s06: "/images/literary-embers/panel-crossroad-shadow.png",
  le_s07: "/images/literary-embers/panel-collapse-room.png",
  le_s08: "/images/literary-embers/panel-walkaway-light.png",
};

const filmGrain: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0.12,
  backgroundImage:
    "radial-gradient(rgba(255,255,255,0.95) 0.8px, transparent 0.8px), radial-gradient(rgba(255,255,255,0.6) 0.6px, transparent 0.6px)",
  backgroundSize: "14px 14px, 9px 9px",
  backgroundPosition: "0 0, 4px 5px",
  mixBlendMode: "screen",
};

const BookLockup: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: 22,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        color: palette.white,
        textShadow: "0 2px 8px rgba(0,0,0,0.55)",
      }}
    >
      <div
        style={{
          fontFamily: '"NotoSerifSC", "NotoSansSC", serif',
          fontSize: 46,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {literaryEmbersMeta.bookTitle}
      </div>
      <div style={{ fontFamily: '"NotoSansSC", sans-serif', fontSize: 21, letterSpacing: 2, opacity: 0.78 }}>
        {literaryEmbersMeta.authorLine}
      </div>
    </div>
  );
};

const AccentText: React.FC<{ text?: string; color?: string }> = ({ text, color = palette.ash }) => {
  if (!text) {
    return null;
  }
  return (
    <div
      style={{
        position: "absolute",
        top: 114,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: '"NotoSansSC", sans-serif',
        fontSize: 20,
        letterSpacing: 4,
        color,
        opacity: 0.82,
      }}
    >
      {text}
    </div>
  );
};

const FullBleedImage: React.FC<{
  src: string;
  duration: number;
  startScale: number;
  endScale: number;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  overlay?: string;
}> = ({ src, duration, startScale, endScale, startX = 0, endX = 0, startY = 0, endY = 0, overlay }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, duration], [startScale, endScale], { extrapolateRight: "clamp" });
  const x = interpolate(frame, [0, duration], [startX, endX], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, duration], [startY, endY], { extrapolateRight: "clamp" });
  return (
    <>
      <Img
        src={staticFile(src.startsWith("/") ? src.slice(1) : src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${x}px, ${y}px) scale(${scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            overlay ??
            "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 48%, rgba(0,0,0,0.36) 100%)",
        }}
      />
    </>
  );
};

const BurnHookScene: React.FC<{ scene: LiteraryEmbersScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [0, 5, 14, 26], [0.95, 0.12, 0.32, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#07080b", overflow: "hidden" }}>
      <FullBleedImage
        src={sceneImageMap[scene.id]}
        duration={scene.duration}
        startScale={1.1}
        endScale={1.02}
        startY={-24}
        endY={10}
        overlay="radial-gradient(circle at 50% 34%, rgba(255,255,255,0.14), transparent 24%), linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.16) 55%, rgba(0,0,0,0.44) 100%)"
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 26%, rgba(255,226,166,0.24), transparent 24%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: flash,
          background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.92), transparent 42%)",
        }}
      />
      <div style={filmGrain} />
    </AbsoluteFill>
  );
};

const BookCard: React.FC<{
  title: string;
  author: string;
  paletteStops: string[];
  coverImage?: string;
  style: React.CSSProperties;
}> = ({ title, author, paletteStops, coverImage, style }) => {
  return (
    <div
      style={{
        position: "absolute",
        width: 340,
        height: 500,
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.45)",
        boxShadow: "0 22px 40px rgba(0,0,0,0.35)",
        background: `linear-gradient(160deg, ${paletteStops[0]}, ${paletteStops[1]} 56%, ${paletteStops[2]})`,
        ...style,
      }}
    >
      {coverImage ? (
        <Img
          src={staticFile(coverImage.startsWith("/") ? coverImage.slice(1) : coverImage)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 22%, rgba(0,0,0,0.12) 100%), radial-gradient(circle at 18% 22%, rgba(255,255,255,0.38), transparent 18%), radial-gradient(circle at 78% 68%, rgba(255,255,255,0.14), transparent 24%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          padding: "10px 14px",
          borderRadius: 10,
          fontFamily: '"NotoSansSC", sans-serif',
          fontSize: 18,
          letterSpacing: 2,
          color: "rgba(255,255,255,0.95)",
          textAlign: "center",
          background: "rgba(0,0,0,0.28)",
          textShadow: "0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        {title} 路 {author}
      </div>
    </div>
  );
};

const BookCascadeScene: React.FC<{ scene: LiteraryEmbersScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d1117 0%, #171a1f 48%, #08090c 100%)" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 24%, rgba(255,224,177,0.18), transparent 20%), radial-gradient(circle at 50% 68%, rgba(255,255,255,0.1), transparent 22%)",
          filter: "blur(10px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 72,
          right: 72,
          bottom: 116,
          height: 180,
          borderRadius: 999,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,193,106,0.26), rgba(255,193,106,0.04) 38%, rgba(0,0,0,0) 72%)",
          filter: "blur(8px)",
        }}
      />
      {literaryEmbersCoverFlow.map((book, index) => {
        const local = frame - index * 18;
        const opacity = interpolate(local, [0, 8, 28, 52], [0, 1, 1, index === literaryEmbersCoverFlow.length - 1 ? 1 : 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = [-170, 110, -80, 0][index] ?? 0;
        const y = [56, -24, 14, -2][index] ?? 0;
        const scale =
          index === literaryEmbersCoverFlow.length - 1
            ? interpolate(local, [0, 20, 54], [0.82, 1.08, 1.02], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0.88;
        return (
          <BookCard
            key={book.title}
            title={book.title}
            author={book.author}
            paletteStops={book.palette}
            coverImage={book.coverImage}
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale}) rotate(${index === 3 ? 0 : index % 2 === 0 ? -10 : 10}deg)`,
              opacity,
              filter:
                index === literaryEmbersCoverFlow.length - 1
                  ? "drop-shadow(0 28px 44px rgba(0,0,0,0.55))"
                  : "blur(0.2px) saturate(0.92)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 166,
          transform: "translateX(-50%)",
          fontFamily: '"NotoSansSC", sans-serif',
          fontSize: 24,
          letterSpacing: 10,
          color: "rgba(255,244,225,0.68)",
        }}
      >
        从他人人生里抽回自己
      </div>
      <div style={filmGrain} />
      <div
        style={{
          position: "absolute",
          bottom: 170,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: '"NotoSansSC", sans-serif',
          fontSize: 28,
          letterSpacing: 8,
          color: "rgba(255,230,192,0.82)",
        }}
      >
        {scene.accentText}
      </div>
    </AbsoluteFill>
  );
};

const ImagePanelScene: React.FC<{ scene: LiteraryEmbersScene; src: string; startScale?: number; endScale?: number }> = ({
  scene,
  src,
  startScale = 1.04,
  endScale = 1.1,
}) => {
  return (
    <AbsoluteFill style={{ background: "#111", overflow: "hidden" }}>
      <FullBleedImage
        src={src}
        duration={scene.duration}
        startScale={startScale}
        endScale={endScale}
        startY={10}
        endY={-14}
        overlay="linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 38%, rgba(0,0,0,0.28) 100%), radial-gradient(circle at 50% 44%, rgba(255,255,255,0), rgba(0,0,0,0.32) 100%)"
      />
      <div style={filmGrain} />
      <BookLockup />
      <AccentText text={scene.accentText} />
    </AbsoluteFill>
  );
};

const SceneCard: React.FC<{ scene: LiteraryEmbersScene }> = ({ scene }) => {
  switch (scene.type) {
    case "burnHook":
      return <BurnHookScene scene={scene} />;
    case "bookCascade":
      return <BookCascadeScene scene={scene} />;
    case "deskPanel":
    case "streetPanel":
    case "windowPanel":
    case "crossroadPanel":
    case "collapsePanel":
    case "walkawayPanel":
      return <ImagePanelScene scene={scene} src={sceneImageMap[scene.id]} />;
    default:
      return <AbsoluteFill style={{ backgroundColor: palette.black }} />;
  }
};

export const LiteraryEmbersScenes: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: palette.black }}>
      {literaryEmbersScenes.map((scene) => {
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration}>
            <SceneCard scene={scene} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

