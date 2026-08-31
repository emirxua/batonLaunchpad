import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Image generation for Safari "Add to Home Screen"
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "#09090B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "40px",
          border: "4px solid rgba(245, 158, 11, 0.4)",
          padding: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "110px",
            gap: "14px",
          }}
        >
          {/* Bar 1 */}
          <div
            style={{
              width: "110px",
              height: "15px",
              background: "#F59E0B",
              borderRadius: "8px",
            }}
          />
          {/* Bar 2 (Equal full width) */}
          <div
            style={{
              width: "110px",
              height: "15px",
              background: "#F59E0B",
              borderRadius: "8px",
            }}
          />
          {/* Bar 3 */}
          <div
            style={{
              width: "110px",
              height: "15px",
              background: "#F59E0B",
              borderRadius: "8px",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
