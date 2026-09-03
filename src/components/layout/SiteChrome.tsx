"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { SearchDialog } from "@/components/search/SearchDialog";

/**
 * Client shell that owns the one piece of cross-page UI state: whether the
 * search palette is open. Keeping it here means the header, the mobile drawer
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
      <Header onOpenSearch={openSearch} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </>
  );
}
