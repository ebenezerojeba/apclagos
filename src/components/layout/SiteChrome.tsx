"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { SearchDialog } from "@/components/search/SearchDialog";

/**
 * Client shell for the cross-page UI: the search palette's open state and the
 * global navigation progress bar. Keeping it here means the header, the mobile drawer
 * and the "/" shortcut all drive the same dialog, while every page underneath
 * stays a server component.
 */
export function SiteChrome() {
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // "/" opens search, unless the visitor is already typing somewhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      setSearchOpen(true);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <RouteProgress />
      <Header onOpenSearch={openSearch} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </>
  );
}
