"use client";

import dynamic from "next/dynamic";

// LiveChatWidget + InstallPwaPrompt only matter after first interaction.
// Dynamic-import them with ssr:false so they don't bloat the eager
// per-page JS bundle. Saves ~12 KB gz on every initial pageload.
const InstallPwaPrompt = dynamic(
  () => import("@/components/InstallPwaPrompt").then((m) => m.InstallPwaPrompt),
  { ssr: false },
);
const LiveChatWidget = dynamic(
  () => import("@/components/LiveChatWidget").then((m) => m.LiveChatWidget),
  { ssr: false },
);

export function DeferredClientWidgets() {
  return (
    <>
      <InstallPwaPrompt />
      <LiveChatWidget />
    </>
  );
}
