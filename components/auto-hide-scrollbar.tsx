"use client";

import { useEffect } from "react";

export function AutoHideScrollbar() {
  useEffect(() => {
    const timeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement | Document | null;
      if (!target) return;

      const elementsToMark: HTMLElement[] = [];

      if (
        target === document ||
        target === document.documentElement ||
        target === document.body
      ) {
        if (document.documentElement) elementsToMark.push(document.documentElement);
        if (document.body) elementsToMark.push(document.body);
      } else if (target instanceof HTMLElement) {
        if (!target.classList.contains("no-scrollbar")) {
          elementsToMark.push(target);
        }
      }

      for (const el of elementsToMark) {
        const existingTimeout = timeouts.get(el);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (!el.classList.contains("is-scrolling")) {
          el.classList.add("is-scrolling");
        }

        const timeoutId = setTimeout(() => {
          el.classList.remove("is-scrolling");
          timeouts.delete(el);
        }, 1000);

        timeouts.set(el, timeoutId);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  return null;
}
