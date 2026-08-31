import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "16px",
          border: "2px solid rgba(245, 158, 11, 0.4)",
          padding: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            width: "36px",
            gap: "5px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "5px",
              background: "#F59E0B",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              width: "27px",
              height: "5px",
              background: "#F59E0B",
              borderRadius: "3px",
            }}
          />
          <div
            style={{
              width: "36px",
              height: "5px",
              background: "#F59E0B",
              borderRadius: "3px",
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
