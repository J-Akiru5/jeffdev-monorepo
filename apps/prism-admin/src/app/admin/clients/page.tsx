import { createClient } from "@/lib/supabase/server";
import {
  Search,
  Filter,
  Building2,
  Mail,
  FolderKanban,
  MoreVertical,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface ClientEntry {
  client_name: string;
  client_email: string;
  project_count: number;
  projects: Array<{ id: string; title: string }>;
}

/**
 * Clients Page
 * View agency clients from Supabase projects data
 */
export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch all projects with client info
  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, client_name, client_email")
    .not("client_name", "is", null)
    .order("client_name", { ascending: true });

  // Group by client name to get unique clients with project counts
  const clientMap = new Map<string, ClientEntry>();
  for (const project of projects || []) {
    const key = project.client_name?.toLowerCase() || "unknown";
    if (clientMap.has(key)) {
      const entry = clientMap.get(key)!;
      entry.project_count++;
      entry.projects.push({ id: project.id, title: project.title || "" });
    } else {
      clientMap.set(key, {
        client_name: project.client_name || "Unknown",
        client_email: project.client_email || "",
        project_count: 1,
        projects: [{ id: project.id, title: project.title || "" }],
      });
    }
  }

  const clients = Array.from(clientMap.values());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-white/50">
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" />
          Add Client
        </button>
      </div>

      {/* Search/Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button className="h-10 px-4 rounded-lg border border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:border-white/20 flex items-center gap-2 transition-colors">
          <Filter className="h-4 w-4" />
          <span className="text-sm hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* Clients Grid */}
      {clients.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.client_name} client={client} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">
            No clients yet
          </h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Clients will appear here once projects with client information are
            created.
          </p>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: ClientEntry }) {
  return (
    <Link
      href={`/admin/projects?client=${encodeURIComponent(client.client_name)}`}
      className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
            {client.client_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
              {client.client_name}
            </h3>
          </div>
        </div>
        <button
          onClick={(e) => e.preventDefault()}
          title="More options"
          aria-label="Client options menu"
          className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {client.client_email && (
          <div className="flex items-center gap-2 text-white/40">
            <Mail className="h-3 w-3" />
            <span className="truncate">{client.client_email}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-white/40">
          <FolderKanban className="h-3 w-3" />
          <span>
            {client.project_count} project
            {client.project_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-1.5">
          {client.projects.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 truncate max-w-[120px]"
            >
              {p.title}
            </span>
          ))}
          {client.projects.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 text-white/30">
              +{client.projects.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
