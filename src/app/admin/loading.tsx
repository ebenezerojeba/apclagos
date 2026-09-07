/**
 * Admin loading state.
 *
 * Every admin screen is `force-dynamic` and queries MongoDB, so on a cold
 * serverless invocation there is real latency between the click and the first
 * pixel. Without this the browser sits on the previous page with nothing
 * happening, and the natural response is to click again — which is how an
 * editor ends up submitting the same record twice.
 *
 * The skeleton mirrors the real shell: header bar, section tabs, a heading
 * block and a list. Matching the destination's shape is what stops the layout
 * jumping when the content arrives, and it tells the editor which screen is
 * loading before it has loaded.
 *
 * No animation beyond a slow pulse, and none of it announced — `aria-busy` on
 * the container is enough for assistive technology; a screen reader does not
 * need thirty empty boxes read out.
 */
export default function AdminLoading() {
  return (
    <div className="min-h-dvh" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="h-9 w-40 animate-pulse rounded-lg bg-paper-200" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-28 animate-pulse rounded bg-paper-200" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-paper-200" />
          </div>
        </div>
        <div className="border-t border-border-subtle">
          <div className="mx-auto flex max-w-6xl gap-1 px-3 sm:px-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="h-11 px-3 py-3">
                <div className="h-5 w-16 animate-pulse rounded bg-paper-200" />
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-paper-200" />
        <div className="mt-5 h-9 w-64 animate-pulse rounded-lg bg-paper-200" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-paper-200" />

        <div className="mt-8 space-y-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="h-5 w-1/3 animate-pulse rounded bg-paper-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-paper-100" />
              </div>
              <div className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-paper-200" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
