"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@syntaxure/ui";

const QuickstartContent = dynamic(() => import("./quickstart-content"), {
  ssr: false,
  loading: () => (
    <div className="space-y-6 p-6">
      <div className="h-12 w-12 rounded-xl bg-white/5 animate-pulse" />
      <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
      <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
    </div>
  ),
});

export default function QuickConnectPage() {
  return <QuickstartContent />;
}
