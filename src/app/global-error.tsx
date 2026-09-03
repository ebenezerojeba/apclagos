"use client";

/**
 * Last-resort boundary: catches failures in the root layout itself, so it must
 * render its own <html> and <body> and cannot rely on the design system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-NG">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#fbfaf7",
          color: "#0d1b31",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#971b26",
            }}
          >
            Unexpected error
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.75rem 0 0", fontWeight: 500 }}>
            The site could not be loaded
          </h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.7, color: "#4f5c72" }}>
            Please try again. If the problem continues, contact the APC Lagos
            secretariat.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              border: "none",
              background: "#0d1b31",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#77808f" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
