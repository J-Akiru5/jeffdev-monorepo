import { Suspense } from "react";
import { Activity } from "lucide-react";
import { getPlatformAuditLogs } from "@/app/actions/platform-audit";
import { AuditTable } from "@/components/admin/audit-table";

export const dynamic = "force-dynamic";

interface SearchParams {
  action?: string;
  resource?: string;
  actor?: string;
  search?: string;
  cursor?: string;
}

export default async function PlatformAuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const result = await getPlatformAuditLogs({
    action: params.action,
    resource: params.resource,
    actor: params.actor,
    search: params.search,
    cursor: params.cursor,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Audit Log</h1>
        <p className="mt-1 text-sm text-white/50">
          Global administrative activity across Syntaxure Labs
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-12 text-center text-white/30">
            <Activity className="h-8 w-8 mx-auto mb-3 opacity-30 animate-pulse" />
            <p>Loading audit logs...</p>
          </div>
        }
      >
        <AuditTable
          initialEntries={result.entries}
          initialHasMore={result.hasMore}
          initialNextCursor={result.nextCursor}
          currentFilters={{
            action: params.action,
            resource: params.resource,
            actor: params.actor,
            search: params.search,
          }}
        />
      </Suspense>
    </div>
  );
}
