import type { CalculateMetadataFunction } from "remotion";
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AudioTrackLayer } from "../components/video/AudioTrackLayer";
import type { ReplicatedVideoRenderProps } from "./ReplicatedVideoComposition";

type ReplicatedScene = ReplicatedVideoRenderProps["inputProps"]["scenes"][number];
type OverlayChip = {
  label: string;
  tone?: "accent" | "muted";
};

const resolveInputProps = (props: ReplicatedVideoRenderProps | ReplicatedVideoRenderProps["inputProps"]) =>
  "inputProps" in props ? props.inputProps : props;

const resolveComposition = (props: ReplicatedVideoRenderProps | ReplicatedVideoRenderProps["inputProps"]) =>
  "composition" in props ? props.composition : undefined;

const resolvePublicAsset = (publicPath?: string) => {
  if (!publicPath) return undefined;
  if (/^https?:\/\//.test(publicPath)) return publicPath;
  return staticFile(publicPath.replace(/^\/+/, ""));
};

const fitTitle = (text: string) => {
  const length = Array.from(text || "").length;
  if (length <= 12) return 72;
  if (length <= 18) return 62;
  return 52;
};

const splitCaption = (text: string, maxChars = 16) => {
  const chars = Array.from(text || "");
  if (chars.length <= maxChars) return text;
  const lines = [];
  for (let index = 0; index < chars.length && lines.length < 2; index += maxChars) {
    lines.push(chars.slice(index, index + maxChars).join(""));
  }
  return lines.join("\n");
};

const sceneEffects = (scene: ReplicatedScene) => {
  const motionEffects = scene.motion?.effects;
  const remixEffects = scene.visualRemix?.effects;
  if (Array.isArray(motionEffects) && motionEffects.length > 0) return motionEffects;
  if (Array.isArray(remixEffects)) return remixEffects;
  return [];
};

const sceneAssets = (scene: ReplicatedScene) => (scene.resolvedAssets ?? []).filter((asset) => asset?.publicPath);

const assetSlotCategory = (slot?: string) => {
  const value = (slot ?? "").toLowerCase();
  if (value.includes("background")) return "background";
  if (value.includes("overlay") || value.includes("foreground") || value.includes("focus") || value.includes("inset")) return "overlay";
  return "support";
};

const overlaySortWeight = (slot?: string) => {
  const value = (slot ?? "").toLowerCase();
  if (value.includes("foreground")) return 0;
  if (value.includes("focus")) return 1;
  if (value.includes("detail")) return 2;
  if (value.includes("callout")) return 3;
  if (value.includes("label")) return 4;
  if (value.includes("arrow")) return 5;
  return 6;
};

const sceneNumber = (scene: ReplicatedScene) => {
  const match = scene.sceneId?.match(/scene_(\d+)/i);
  return match ? Number(match[1]) : 0;
};

const shouldUseOverlayDominantLayout = (scene: ReplicatedScene, overlayCount: number) => {
  if (overlayCount === 0) return false;
  const index = sceneNumber(scene);
  const imageMode = (scene.layoutControls?.imageMode ?? "").toLowerCase();
  const role = (scene.role ?? "").toLowerCase();
  if (imageMode.includes("overlay_dominant") || imageMode.includes("foreground_dominant")) return true;
  if (role === "hook" || role === "close") return true;
  return index > 0 && index % 3 === 0;
};

const shouldMuteBackgroundImage = (scene: ReplicatedScene, overlayCount: number) => {
  if (!shouldUseOverlayDominantLayout(scene, overlayCount)) return false;
  const index = sceneNumber(scene);
  return scene.role === "hook" || scene.role === "close" || index % 4 === 0;
};

const buildOverlayChips = (scene: ReplicatedScene): OverlayChip[] => {
  const bullets = scene.copy.bullets ?? [];
  const keywords = scene.copy.keywords ?? [];
  const chips: OverlayChip[] = [];
  if (keywords[0]) chips.push({ label: keywords[0], tone: "accent" });
  if (bullets[0]) chips.push({ label: bullets[0], tone: "muted" });
  if (bullets[1]) chips.push({ label: bullets[1], tone: "muted" });
  return chips.slice(0, 3);
};

const hasEffect = (scene: ReplicatedScene, effectId: string) =>
  sceneEffects(scene).some((effect) => effect?.effectId === effectId);

const motionTransform = (scene: ReplicatedScene, frame: number, sceneDuration: number) => {
  const progress = interpolate(frame, [0, Math.max(1, sceneDuration - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const preset = (scene.motion?.motionPreset ?? scene.layoutControls?.motionPreset ?? "slow_push_full_bleed").toLowerCase();
  const cameraMove = (scene.motion?.cameraMove ?? scene.visualRemix?.cameraMove ?? "in").toLowerCase();
  const pulse = preset.includes("pulse") ? Math.sin((frame / Math.max(1, sceneDuration)) * Math.PI * 6) * 0.018 : 0;
  const shake = preset.includes("shake") ? Math.sin(frame * 1.7) * 4 : 0;
  const scaleEnd = preset.includes("zoom") || preset.includes("push") ? 1.13 : preset.includes("pan") ? 1.08 : 1.055;
  const scaleStart = cameraMove === "out" ? scaleEnd : 1.035;
  const scale = interpolate(progress, [0, 1], [scaleStart, cameraMove === "out" ? 1.035 : scaleEnd]) + pulse;
  const panAmount = preset.includes("pan") || cameraMove.includes("horizontal") ? 46 : 14;
  const x =
    cameraMove === "right" || cameraMove.includes("right") || cameraMove.includes("horizontal")
      ? interpolate(progress, [0, 1], [-panAmount, panAmount])
      : cameraMove === "left" || cameraMove.includes("left")
        ? interpolate(progress, [0, 1], [panAmount, -panAmount])
        : 0;
  const y = cameraMove === "out" ? interpolate(progress, [0, 1], [-10, 8]) : cameraMove.includes("up") ? interpolate(progress, [0, 1], [30, -10]) : interpolate(progress, [0, 1], [8, -10]);
  return `translate(${x + shake}px, ${y}px) scale(${scale})`;
};

const AtmosphereFx: React.FC<{ scene: ReplicatedScene; sceneDuration: number }> = ({ scene, sceneDuration }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame, [0, Math.max(1, sceneDuration / 2), Math.max(1, sceneDuration - 1)], [0.12, 0.28, 0.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leakX = interpolate(frame, [0, Math.max(1, sceneDuration - 1)], [-34, 46], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leakOpacity = hasEffect(scene, "light_leak")
    ? interpolate(frame, [0, 18, Math.max(36, sceneDuration - 24), sceneDuration], [0, 0.22, 0.12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const showGrid = hasEffect(scene, "dot_grid") || hasEffect(scene, "grid_overlay");
  const showGlitch = hasEffect(scene, "glitch_ui") || hasEffect(scene, "color_split");
  const showShapes = hasEffect(scene, "geometric_shapes");
  const glitchX = showGlitch ? Math.sin(frame * 0.9) * 5 : 0;

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${hasEffect(scene, "vignette") ? 0.12 : 0.06})` }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(circle at 50% 22%, rgba(255,246,214,${hasEffect(scene, "soft_glow") ? glow : 0.08}), transparent 25%), ` +
            "linear-gradient(180deg, rgba(0,0,0,0.18), transparent 30%, rgba(0,0,0,0.5))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: hasEffect(scene, "film_grain") || showGrid ? 0.08 : 0,
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 0 1px, transparent 1px), radial-gradient(circle at 78% 42%, rgba(255,255,255,0.75) 0 1px, transparent 1px), radial-gradient(circle at 43% 76%, rgba(255,255,255,0.55) 0 1px, transparent 1px)",
          backgroundSize: "38px 38px, 53px 53px, 71px 71px",
          transform: `translate(${frame % 5}px, ${(frame * 2) % 7}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: showGrid ? 0.22 : 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "58px 58px",
          maskImage: "radial-gradient(circle at 50% 46%, black, transparent 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 34,
          right: 34,
          top: 34,
          bottom: 34,
          opacity: showGrid ? 0.5 : 0,
          border: "2px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 0 42px rgba(97,214,255,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${50 + glitchX}%`,
          top: "18%",
          width: 2,
          height: "62%",
          opacity: showGlitch ? 0.25 : 0,
          background: "rgba(255,70,70,0.9)",
          boxShadow: "12px 0 rgba(75,210,255,0.8), -14px 0 rgba(255,255,255,0.36)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "12%",
          right: "12%",
          top: "23%",
          height: "34%",
          opacity: showShapes ? 0.32 : 0,
          background:
            "linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.5) 46%, transparent 48%), linear-gradient(45deg, transparent 48%, rgba(255,170,94,0.55) 49%, transparent 51%)",
          transform: `scale(${1 + Math.sin(frame / 9) * 0.025})`,
          filter: "blur(0.2px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-12%",
          bottom: "-12%",
          left: `${leakX}%`,
          width: "28%",
          opacity: leakOpacity,
          transform: "rotate(14deg)",
          background: "linear-gradient(90deg, transparent, rgba(255,221,147,0.45), transparent)",
          filter: "blur(18px)",
        }}
      />
    </>
  );
};

const SpokenSubtitleLayer: React.FC<{
  subtitles?: NonNullable<ReplicatedVideoRenderProps["inputProps"]["audio"]>["subtitles"];
}> = ({ subtitles }) => {
  const frame = useCurrentFrame();
  const active = subtitles?.find((cue) => frame >= Number(cue.startFrame ?? 0) && frame < Number(cue.endFrame ?? 0));
  const text = splitCaption(active?.text || "", 18);
  const cueStart = Number(active?.startFrame ?? frame);
  const cueEnd = Number(active?.endFrame ?? frame + 1);
  const cueProgress = (frame - cueStart) / Math.max(1, cueEnd - cueStart);
  const opacity = interpolate(cueProgress, [0, 0.16, 0.84, 1], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(cueProgress, [0, 0.18], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 76,
        right: 76,
        bottom: 96,
        textAlign: "center",
        whiteSpace: "pre-line",
        opacity,
        transform: `translateY(${y}px)`,
        fontSize: 37,
        lineHeight: 1.28,
        fontWeight: 900,
        color: "#fff",
        textShadow: "0 4px 0 rgba(0,0,0,0.78), 0 8px 20px rgba(0,0,0,0.72)",
        letterSpacing: 0,
      }}
    >
      {text}
    </div>
  );
};

const CinematicScene: React.FC<{ scene: ReplicatedScene; sceneDuration: number }> = ({ scene, sceneDuration }) => {
  const frame = useCurrentFrame();
  const assets = sceneAssets(scene);
  const backgroundAsset = assets.find((item) => assetSlotCategory(item.slot) === "background") ?? assets[0];
  const overlayAssets = assets
    .filter((item) => item !== backgroundAsset && assetSlotCategory(item.slot) === "overlay")
    .sort((left, right) => overlaySortWeight(left.slot) - overlaySortWeight(right.slot));
  const overlayDominant = shouldUseOverlayDominantLayout(scene, overlayAssets.length);
  const muteBackground = shouldMuteBackgroundImage(scene, overlayAssets.length);
  const chips = buildOverlayChips(scene);
  const src = resolvePublicAsset(backgroundAsset?.publicPath);
  const titleOpacity = interpolate(frame, [0, 10], [0.72, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 10], [-6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [7, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const primaryOverlayId = overlayAssets.find((asset) => {
    const slot = (asset.slot ?? "").toLowerCase();
    return slot.includes("foreground") || slot.includes("focus");
  })?.assetId ?? overlayAssets[0]?.assetId;

  const renderOverlay = (asset: NonNullable<(typeof overlayAssets)[number]>, index: number) => {
    const overlaySrc = resolvePublicAsset(asset.publicPath);
    if (!overlaySrc) return null;
    const slot = (asset.slot ?? "").toLowerCase();
    const isForeground = slot.includes("foreground");
    const isFocus = slot.includes("focus");
    const isDetail = slot.includes("detail");
    const isCallout = slot.includes("callout");
    const isLabel = slot.includes("label");
    const isArrow = slot.includes("arrow");
    const isPrimary = overlayDominant && asset.assetId === primaryOverlayId;
    const layoutVariant = sceneNumber(scene) % 3;
    const primaryPlacement =
      layoutVariant === 0
        ? { width: "74%", height: "52%", left: "13%", top: "25%" }
        : layoutVariant === 1
          ? { width: "62%", height: "50%", right: "5%", top: "24%" }
          : { width: "58%", height: "48%", left: "6%", top: "27%" };
    const placement = isPrimary
      ? primaryPlacement
      : isForeground
        ? { width: overlayDominant ? "48%" : "52%", height: overlayDominant ? "38%" : "42%", right: "5%", top: "29%" }
        : isFocus
          ? { width: overlayDominant ? "42%" : "46%", height: overlayDominant ? "34%" : "36%", left: "6%", top: "23%" }
          : isDetail
            ? { width: "38%", height: "27%", right: "7%", bottom: "16%" }
            : isCallout
              ? { width: "34%", height: "30%", left: layoutVariant === 2 ? "58%" : "7%", top: "43%" }
              : isLabel
                ? { width: "38%", height: "18%", left: "7%", top: "14%" }
                : { width: "36%", height: "16%", left: "50%", bottom: "14%" };
    const entryStart = 8 + index * 6 + (isForeground ? 0 : isFocus ? 4 : isDetail ? 8 : isCallout ? 10 : isLabel ? 6 : 12);
    const entryProgress = interpolate(frame, [entryStart, entryStart + 12, entryStart + 28], [0, 1, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const exitProgress = interpolate(frame, [Math.max(0, sceneDuration - 34), sceneDuration], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const pulse = isPrimary ? Math.sin((frame + index * 11) / 15) * 0.018 : isCallout ? Math.sin((frame + index * 11) / 7) * 0.02 : isArrow ? Math.sin(frame / 9) * 0.012 : 0;
    const driftX = isPrimary
      ? interpolate(frame, [entryStart, entryStart + 34], [layoutVariant === 2 ? -42 : 42, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : isForeground
      ? interpolate(frame, [entryStart, entryStart + 28], [38, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : 0;
    const driftY = isPrimary
      ? Math.sin((frame + index * 9) / 26) * 4
      : isFocus
      ? interpolate(frame, [entryStart, entryStart + 28], [-18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : isDetail
        ? Math.sin((frame + index * 15) / 24) * 5
        : isCallout
          ? Math.sin((frame + index * 13) / 20) * 3
          : isLabel
            ? Math.sin((frame + index * 9) / 28) * 2
            : isArrow
              ? Math.sin((frame + index * 9) / 18) * 2
              : 0;
    const scale = isPrimary
      ? interpolate(frame, [entryStart, entryStart + 34, sceneDuration], [0.9, 1.04, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : isForeground
      ? interpolate(frame, [entryStart, entryStart + 28], [0.94, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : isFocus
        ? interpolate(frame, [entryStart, entryStart + 28], [0.9, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
        : isDetail
          ? interpolate(frame, [entryStart, entryStart + 28], [0.88, 0.98], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : isCallout
            ? interpolate(frame, [entryStart, entryStart + 22], [0.84, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : isLabel
              ? interpolate(frame, [entryStart, entryStart + 22], [0.88, 0.98], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
              : interpolate(frame, [entryStart, entryStart + 18], [0.86, 0.98], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const rotate = isCallout ? interpolate(frame, [entryStart, entryStart + 18], [-4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : isArrow ? -1.5 : 0;
    const opacity = Math.max(0, (isPrimary ? 0.98 : 0.9 - index * 0.06) * entryProgress * exitProgress);
    const borderRadius = isArrow ? 20 : isLabel ? 18 : 14;
    const objectFit = isPrimary || isForeground || isFocus || isDetail ? "cover" : "contain";
    const isGraphicAssist = isLabel || isCallout || isArrow;
    const background = isPrimary ? "rgba(0,0,0,0.06)" : isGraphicAssist ? "transparent" : "rgba(0,0,0,0.16)";
    const border = isPrimary ? "1px solid rgba(255,255,255,0.09)" : isGraphicAssist ? "0 solid transparent" : "1px solid rgba(255,255,255,0.14)";
    const boxShadow = isPrimary ? "0 30px 76px rgba(0,0,0,0.38)" : isGraphicAssist ? "none" : "0 18px 48px rgba(0,0,0,0.36)";
    return (
      <div
        key={asset.assetId}
        style={{
          position: "absolute",
          left: isArrow ? "50%" : placement.left,
          right: placement.right,
          top: placement.top,
          bottom: placement.bottom,
          width: placement.width,
          height: placement.height,
          overflow: "hidden",
          borderRadius,
          border,
          boxShadow,
          background,
          opacity,
          transform: `translateX(${isArrow ? "-50%" : `${driftX}px`}) translateY(${driftY}px) scale(${scale}) rotate(${rotate}deg)`,
          mixBlendMode: "normal",
          zIndex: isPrimary ? 4 : isArrow || isCallout ? 5 : 3,
        }}
      >
        <Img
          src={overlaySrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit,
            filter: isGraphicAssist ? "saturate(1.24) contrast(1.18)" : "saturate(1.05) contrast(1.08)",
            mixBlendMode: isGraphicAssist ? "multiply" : "normal",
            opacity: isGraphicAssist ? 0.82 : 1,
            transform: isCallout ? `scale(${1.02 + pulse})` : `scale(${1 + pulse})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isGraphicAssist
              ? "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.08), transparent 62%)"
              : "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.22)), radial-gradient(circle at 50% 32%, rgba(255,255,255,0.10), transparent 55%)",
            mixBlendMode: isGraphicAssist ? "screen" : "normal",
          }}
        />
      </div>
    );
  };

  const renderTextOverlay = () => {
    if (!chips.length) return null;
    const isHook = scene.role === "hook";
    const layoutVariant = sceneNumber(scene) % 3;
    const cardWidth = overlayDominant ? "31%" : isHook ? "29%" : "30%";
    const cardLeft = overlayDominant && layoutVariant === 2 ? "65%" : isHook ? "6.5%" : "7.5%";
    const cardTop = overlayDominant ? "63%" : isHook ? "43%" : "52%";
    return (
      <div
        style={{
          position: "absolute",
          left: cardLeft,
          top: cardTop,
          width: cardWidth,
          padding: "16px 16px 18px",
          borderRadius: 14,
          background: "linear-gradient(180deg, rgba(8, 14, 20, 0.82), rgba(8, 14, 20, 0.56))",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 42px rgba(0,0,0,0.38)",
          backdropFilter: "blur(8px)",
          transform: `translateY(${Math.sin(frame / 24) * 1.5}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 18,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: 0,
            color: "rgba(255,255,255,0.88)",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "linear-gradient(180deg, #ff8a5b, #ff5d3b)",
              boxShadow: "0 0 18px rgba(255,122,69,0.45)",
            }}
          />
          要点
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chips.map((chip) => (
            <div
              key={chip.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                alignSelf: "flex-start",
                padding: "10px 14px",
                borderRadius: 12,
                background:
                  chip.tone === "accent"
                    ? "linear-gradient(180deg, rgba(255,122,69,0.26), rgba(255,122,69,0.14))"
                    : "rgba(255,255,255,0.06)",
                border: chip.tone === "accent" ? "1px solid rgba(255,122,69,0.34)" : "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 24,
                lineHeight: 1.16,
                fontWeight: 900,
                textShadow: "0 3px 10px rgba(0,0,0,0.62)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: chip.tone === "accent" ? "#ff7a45" : "#fff",
                  flex: "0 0 auto",
                }}
              />
              <span style={{ whiteSpace: "normal" }}>{chip.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: "#11150f", overflow: "hidden", fontFamily: "NotoSansSC, SourceSans3, sans-serif" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 34%, rgba(96,160,255,0.18), transparent 34%), linear-gradient(160deg, #10150f 0%, #111827 48%, #2b1711 100%)",
        }}
      />
      {src ? (
        <Img
          src={src}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: muteBackground ? 0.22 : overlayDominant ? 0.62 : 1,
            transform: `${motionTransform(scene, frame, sceneDuration)} ${muteBackground ? "scale(1.08)" : ""}`,
            filter: muteBackground ? "blur(18px) saturate(0.75) contrast(0.9)" : overlayDominant ? "saturate(0.88) contrast(0.96) brightness(0.72)" : "saturate(0.95) contrast(1.04)",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, #29351f 0%, #10150f 52%, #53331e 100%)",
          }}
        />
      )}
      <AtmosphereFx scene={scene} sceneDuration={sceneDuration} />
      {overlayAssets.map((asset, index) => renderOverlay(asset, index))}
      {renderTextOverlay()}
      <div
        style={{
          position: "absolute",
          left: 68,
          right: 68,
          top: 128,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div
          style={{
            fontSize: fitTitle(scene.copy.headline),
            lineHeight: 1.08,
            fontWeight: 900,
            color: "#fff",
            textShadow: "0 5px 0 rgba(0,0,0,0.8), 0 9px 24px rgba(0,0,0,0.55)",
            letterSpacing: 0,
          }}
        >
          {scene.copy.headline}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 32,
            lineHeight: 1.22,
            fontWeight: 800,
            opacity: subtitleOpacity,
            color: "#b63934",
            WebkitTextStroke: "1.1px rgba(255,255,255,0.82)",
            textShadow: "0 3px 10px rgba(0,0,0,0.72)",
          }}
        >
          {scene.copy.body}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const getCinematicQuoteDurationFromProps = (props: ReplicatedVideoRenderProps | ReplicatedVideoRenderProps["inputProps"]) => {
  const inputProps = resolveInputProps(props);
  return Math.max(1, inputProps.timeline.durationInFrames);
};

export const calculateCinematicQuoteMetadata: CalculateMetadataFunction<
  ReplicatedVideoRenderProps | ReplicatedVideoRenderProps["inputProps"]
> = ({ props }) => {
  const inputProps = resolveInputProps(props);
  const composition = resolveComposition(props);
  return {
    durationInFrames: getCinematicQuoteDurationFromProps(props),
    fps: composition?.fps ?? inputProps.timeline.fps,
    width: composition?.width,
    height: composition?.height,
  };
};

export const CinematicQuoteReplicationComposition: React.FC<
  ReplicatedVideoRenderProps | ReplicatedVideoRenderProps["inputProps"]
> = (props) => {
  const inputProps = resolveInputProps(props);
  const sceneById = new Map(inputProps.scenes.map((scene) => [scene.sceneId, scene]));

  return (
    <AbsoluteFill style={{ background: "#10150f" }}>
      {inputProps.audio ? <AudioTrackLayer config={inputProps.audio} /> : null}
      {inputProps.timeline.scenes.map((timelineScene) => {
        const scene = sceneById.get(timelineScene.sceneId);
        if (!scene) return null;
        return (
          <Sequence key={timelineScene.sceneId} from={timelineScene.from} durationInFrames={timelineScene.durationInFrames}>
            <CinematicScene scene={scene} sceneDuration={timelineScene.durationInFrames} />
          </Sequence>
        );
      })}
      <SpokenSubtitleLayer subtitles={inputProps.audio?.subtitles} />
    </AbsoluteFill>
  );
};



