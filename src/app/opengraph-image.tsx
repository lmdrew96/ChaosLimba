import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ChaosLimbă - AI-powered Romanian language learning";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f0a1a 0%, #1a1025 40%, #0f0a1a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "40px",
        }}
      >
        {/* Logo: Atom + Breve */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 28"
          fill="none"
          stroke="#7c3aed"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          width="120"
          height="140"
        >
          <path d="M 8 3.5 Q 12 7 16 3.5" />
          <g transform="translate(0, 4)">
            <circle cx="12" cy="12" r="1" />
            <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z" />
            <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z" />
          </g>
        </svg>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              background: "linear-gradient(90deg, #e2e8f0, #7c3aed)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            ChaosLimbă
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              maxWidth: "600px",
              textAlign: "center",
            }}
          >
            AI-powered Romanian learning for ADHD brains
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
