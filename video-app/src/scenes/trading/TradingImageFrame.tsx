import { Img } from "remotion";

type TradingImageFrameProps = {
  src: string;
  opacity?: number;
};

export const TradingImageFrame: React.FC<TradingImageFrameProps> = ({ src, opacity = 1 }) => {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#04070d" }}>
      <Img
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(20px) saturate(0.9) brightness(0.52)",
          transform: "scale(1.08)",
          opacity: opacity * 0.7,
        }}
      />
      <Img
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity,
        }}
      />
    </div>
  );
};
