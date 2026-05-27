import { MarketingGuard } from "@/components/marketing/marketing-guard";

export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingGuard>
      {children}
    </MarketingGuard>
  );
}
