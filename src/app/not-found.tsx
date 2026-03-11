import Link from "next/link"

export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Nunito, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "linear-gradient(135deg, #f0fdf4 0%, #fef3c7 50%, #fce7f3 100%)",
          color: "#1e3a5f",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-10%",
              left: "-10%",
              width: "50vw",
              height: "50vw",
              borderRadius: "50%",
              background: "rgba(74, 222, 128, 0.15)",
              filter: "blur(120px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-10%",
              right: "-5%",
              width: "60vw",
              height: "60vw",
              borderRadius: "50%",
              background: "rgba(251, 146, 60, 0.12)",
              filter: "blur(160px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "20%",
              width: "30vw",
              height: "30vw",
              borderRadius: "50%",
              background: "rgba(250, 204, 21, 0.1)",
              filter: "blur(100px)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              fontSize: "8rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              background: "linear-gradient(135deg, #4ade80, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "1rem",
            }}
          >
            404
          </div>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "#1e3a5f",
            }}
          >
            Page Not Found
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "#64748b",
              marginBottom: "2rem",
              maxWidth: "360px",
            }}
          >
            This page seems to have wandered off into the tall grass.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              background: "linear-gradient(135deg, #4ade80, #22c55e)",
              color: "white",
              borderRadius: "9999px",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(74, 222, 128, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            Back to Home
          </Link>
        </div>
      </body>
    </html>
  )
}
