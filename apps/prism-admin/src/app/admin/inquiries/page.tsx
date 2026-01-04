import { auth, currentUser } from "@clerk/nextjs/server";
import { 
  Search, 
  Filter,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  ArrowUpRight,
  Star
} from "lucide-react";

/**
 * Client Inquiries Page
 * Integrated with Zoho Mail (inbound) + Resend (outbound)
 */
export default async function InquiriesPage() {
  const { userId } = await auth();
  const clerk = await currentUser();
  const role = (clerk?.publicMetadata as { role?: string })?.role || "user";
  
  if (!userId) return null;

  // TODO: Fetch from Zoho Mail API or local cache
  // For now, show empty state
  const inquiries: Array<{
    id: string;
    from: string;
    subject: string;
    preview: string;
    status: "new" | "replied" | "closed";
    priority: "low" | "normal" | "high";
    receivedAt: string;
  }> = [];

  const stats = {
    new: inquiries.filter(i => i.status === "new").length,
    replied: inquiries.filter(i => i.status === "replied").length,
    closed: inquiries.filter(i => i.status === "closed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inquiries</h1>
          <p className="text-sm text-white/50">Client messages from contact forms</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-white/5 text-white/40 flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            Zoho Mail
          </span>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        <StatusTab label="New" count={stats.new} active />
        <StatusTab label="Replied" count={stats.replied} />
        <StatusTab label="Closed" count={stats.closed} />
      </div>

      {/* Search/Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by email or subject..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 flex items-center gap-2 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="text-sm hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Inquiries List */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
        {inquiries.length > 0 ? (
          <div className="divide-y divide-white/5">
            {inquiries.map((inquiry) => (
              <InquiryRow key={inquiry.id} inquiry={inquiry} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-sm font-medium text-white mb-1">No inquiries yet</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Client inquiries from contact forms will appear here. Connect Zoho Mail to start receiving messages.
            </p>
            <button className="mt-4 px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors">
              Connect Zoho Mail
            </button>
          </div>
        )}
      </div>

      {/* Integration Note */}
      <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-amber-400 font-medium">Integration Setup Required</p>
            <p className="text-xs text-white/50 mt-1">
              Configure Zoho Mail API credentials in Doppler to enable inbox sync. 
              Responses will be sent via Resend API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTab({ label, count, active = false }: { label: string; count: number; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
        active 
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
          : "text-white/40 hover:text-white/60 hover:bg-white/5"
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
        active ? "bg-amber-500/30" : "bg-white/10"
      }`}>
        {count}
      </span>
    </button>
  );
}

function InquiryRow({ inquiry }: { inquiry: { 
  id: string;
  from: string;
  subject: string;
  preview: string;
  status: string;
  priority: string;
  receivedAt: string;
}}) {
  const statusIcon = {
    new: Clock,
    replied: CheckCircle,
    closed: CheckCircle,
  }[inquiry.status] || Clock;

  const StatusIcon = statusIcon;

  return (
    <div className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-white truncate">{inquiry.from}</span>
            {inquiry.priority === "high" && (
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            )}
          </div>
          <p className="text-sm text-white/70 truncate">{inquiry.subject}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">{inquiry.preview}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[10px] text-white/30 font-mono">
            {new Date(inquiry.receivedAt).toLocaleDateString()}
          </span>
          <StatusIcon className={`h-4 w-4 ${
            inquiry.status === "new" ? "text-amber-400" :
            inquiry.status === "replied" ? "text-cyan-400" : "text-emerald-400"
          }`} />
        </div>
      </div>
    </div>
  );
}
