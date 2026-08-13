import { ImageResponse } from "next/og";

export const alt = "Syntaxure Labs | Global B2B Digital Transformation Agency";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#050505",
        padding: "80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.15,
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glowing Cyan Bloom */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Glowing Violet Bloom */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Top: Subtitle */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              color: "#ffffff",
              opacity: 0.5,
              fontSize: "24px",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
            }}
          >
            ID: SYN-HQ-001
          </span>
        </div>

        {/* Center: Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "auto",
            marginBottom: "80px",
          }}
        >
          <h1
            style={{
              fontSize: "80px",
              lineHeight: "1.1",
              fontWeight: 900,
              fontFamily: "sans-serif",
              color: "#ffffff",
              letterSpacing: "-2px",
              margin: 0,
              maxWidth: "900px",
            }}
          >
            Global B2B Digital
            <br />
            Transformation Agency
          </h1>
          <p
            style={{
              fontSize: "32px",
              color: "#ffffff",
              opacity: 0.7,
              margin: 0,
              maxWidth: "800px",
            }}
          >
            Scalable custom software, web architectures, and secure AI integrations.
          </p>
        </div>

        {/* Bottom: Brand */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontFamily: "monospace",
              fontSize: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ color: "#06b6d4", marginRight: "12px" }}>
                Agency_
              </span>
              <span style={{ color: "#ffffff", opacity: 0.8 }}>
                Syntaxure Labs
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ color: "#06b6d4", marginRight: "12px" }}>
                Product_
              </span>
              <span style={{ color: "#ffffff", opacity: 0.8 }}>
                Context Engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
