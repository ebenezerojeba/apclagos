"use client";

import { useEffect } from "react";
import { Section } from "@/components/sections/Section";
import { ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";

/**
 * Route-level error boundary. Renders inside the site chrome so a failed page
 * still leaves the visitor with working navigation.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the digest so the failure can be matched to a server log entry.
    console.error("Route error", error.digest ?? error.message);
  }, [error]);

  return (
    <Section tone="canvas" size="lg">
      <ErrorState
        title="This page could not be loaded"
        description="Something went wrong while preparing this page. You can try again, or continue from the homepage."
        onRetry={
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset}>Try again</Button>
            <Button href="/" variant="outline">
              Return home
            </Button>
          </div>
        }
      />
      {error.digest ? (
        <p className="mt-6 text-center text-xs text-fg-subtle">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </Section>
  );
}
