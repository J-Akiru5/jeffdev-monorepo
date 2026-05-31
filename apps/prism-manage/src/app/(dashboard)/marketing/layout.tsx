import { MarketingGuard } from "@/components/marketing/marketing-guard";
import { ModeGuard } from "@/components/mode-guard";

export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeGuard feature="marketing" allowRestricted redirectOnDeny={false}>
      <MarketingGuard>
        {children}
      </MarketingGuard>
    </ModeGuard>
  );
}
