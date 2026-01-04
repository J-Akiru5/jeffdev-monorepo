import { auth } from "@clerk/nextjs/server";
import { 
  Search, 
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Plus
} from "lucide-react";
import Link from "next/link";

/**
 * Clients Page
 * View Agency clients from Firebase
 */
export default async function ClientsPage() {
  const { userId } = await auth();
  
  if (!userId) return null;

  // TODO: Fetch from Firebase Admin SDK (Agency data)
  const clients: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    location?: string;
    projectCount: number;
    status: "active" | "inactive";
  }> = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-white/50">Agency client directory</p>
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
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">No clients yet</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Connect Firebase to view Agency clients from JeffDev Studio.
          </p>
          <button className="mt-4 px-4 py-2 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors">
            Connect Firebase
          </button>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client }: { client: { 
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  location?: string;
  projectCount: number;
  status: string;
}}) {
  return (
    <Link
      href={`/admin/clients/${client.id}`}
      className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-white">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
              {client.name}
            </h3>
            {client.company && (
              <p className="text-xs text-white/40">{client.company}</p>
            )}
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
        <div className="flex items-center gap-2 text-white/40">
          <Mail className="h-3 w-3" />
          <span className="truncate">{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-2 text-white/40">
            <Phone className="h-3 w-3" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.location && (
          <div className="flex items-center gap-2 text-white/40">
            <MapPin className="h-3 w-3" />
            <span>{client.location}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-white/40">{client.projectCount} projects</span>
        <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${
          client.status === "active" 
            ? "text-emerald-400 bg-emerald-500/15" 
            : "text-white/40 bg-white/5"
        }`}>
          {client.status}
        </span>
      </div>
    </Link>
  );
}
