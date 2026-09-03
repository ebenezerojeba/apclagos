"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/**
 * The search box on the results page.
 *
 * A real `<form>` with `method="get"`, so it works before hydration and so the
 * result URL is always shareable. Client-side routing is a progressive
 * enhancement layered on top.
 */
export function SearchPageInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      action="/search"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const query = value.trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      }}
      className="relative max-w-2xl"
      role="search"
    >
      <label htmlFor="site-search" className="sr-only">
        Search APC Lagos
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
      />
      <input
        id="site-search"
        name="q"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search people, councils, constituencies, news…"
        autoComplete="off"
        className="h-14 w-full rounded-full border border-border bg-surface pl-13 pr-28 text-base text-fg placeholder:text-fg-subtle focus:border-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-200 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
      >
        Search
      </button>
    </form>
  );
}
