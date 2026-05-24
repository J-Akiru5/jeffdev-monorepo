import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Dynamic params for the OG Image
    const title =
      searchParams.get("title") || "Enterprise Systems Architecture";
    const subtitle = searchParams.get("subtitle") || "ID: SYN-SYS-001";
    const description = searchParams.get("description");

    // Syntaxure Labs (Agency) Stealth Luxury Colors
    const bloomColorPrimary = "rgba(6, 182, 212, 0.2)"; // Cyan-500
    const bloomColorSecondary = "rgba(139, 92, 246, 0.2)"; // Violet-500
    const accentText = "#06b6d4"; // Cyan

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

        {/* Glowing Radial Blooms */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${bloomColorPrimary} 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${bloomColorSecondary} 0%, transparent 60%)`,
            filter: "blur(50px)",
          }}
        />

        {/* Content Wrapper */}
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
          {/* Top Bar: Subtitle (Left) & Logo (Right) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                opacity: 0.5,
                fontSize: "24px",
                fontFamily: "monospace",
                letterSpacing: "0.1em",
              }}
            >
              {subtitle}
            </span>

            {/* Syntaxure Labs Brand Logo (Top Right) */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${req.nextUrl.origin}/Syntaxure%20Labs%20Logo.png`}
                alt="Syntaxure Labs Logo"
                style={{
                  height: "60px",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>

          {/* Main Headline */}
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
              {title}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: "32px",
                  color: "#ffffff",
                  opacity: 0.7,
                  margin: 0,
                  maxWidth: "800px",
                }}
              >
                {description}
              </p>
            )}
          </div>

          {/* Bottom Bar: Contact Info (Bottom Left) */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-end",
              marginTop: "auto",
            }}
          >
            {/* Contact Information */}
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
                <span style={{ color: accentText, marginRight: "12px" }}>
                  Email_
                </span>
                <span style={{ color: "#ffffff", opacity: 0.8 }}>
                  contact@jeffdev.studio
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ color: accentText, marginRight: "12px" }}>
                  Tel_
                </span>
                <span style={{ color: "#ffffff", opacity: 0.8 }}>
                  +63 951 916 7103
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
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return new Response(`Failed to generate image: ${error}`, {
      status: 500,
    });
  }
}
