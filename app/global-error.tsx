"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  /** Next.js 16 re-fetches and re-renders the root. */
  retry?: () => void;
  /** Older contract: re-render without re-fetching. */
  reset?: () => void;
};

// Replaces the root layout when it fails, so it renders its own document and inline styles.
export default function GlobalError({ error, retry, reset }: GlobalErrorProps) {
  const tryAgain = retry ?? reset;
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b1016", color: "#e8eef5" }}>
        <main role="alert" style={{ maxWidth: 640, margin: "0 auto", padding: "48px 16px", lineHeight: 1.5 }}>
          <title>LifeOS recovery</title>
          <h1>LifeOS could not load.</h1>
          <p>{error.message || "An unexpected error occurred."}</p>
          {error.digest ? <p>Reference: {error.digest}</p> : null}
          <p>Your vault notes are unchanged.</p>
          <button
            type="button"
            onClick={() => tryAgain?.()}
            style={{ minHeight: 40, padding: "0 16px", font: "inherit", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
