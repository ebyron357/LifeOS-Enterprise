"use client";

type RouteErrorProps = {
  error: Error & { digest?: string };
  /** Next.js 16 re-fetches and re-renders the segment. */
  retry?: () => void;
  /** Older contract: re-render the segment without re-fetching. */
  reset?: () => void;
};

export default function RouteError({ error, retry, reset }: RouteErrorProps) {
  const tryAgain = retry ?? reset;
  return (
    <main className="route-error" role="alert">
      <p className="widget-eyebrow">LifeOS recovery</p>
      <h1>This page hit an error.</h1>
      <p>{error.message || "An unexpected error occurred."}</p>
      {error.digest ? <p className="route-error-digest">Reference: {error.digest}</p> : null}
      <p>Your vault notes are unchanged. Try again, or open another page from the navigation.</p>
      <button type="button" onClick={() => tryAgain?.()}>Try again</button>
    </main>
  );
}
