import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { getServices } from '@/lib/data';
import { getIcon } from '@/lib/icons';

/**
 * Admin Services List
 * -------------------
 * View all services with edit/delete actions.
 */

export default async function AdminServicesPage() {
  const services = await getServices();

  return (
    <div className="min-h-screen bg-void px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Services</h1>
            <p className="mt-2 text-white/50">{services.length} services</p>
          </div>
          <Link
            href="/admin/services/new"
            className="flex items-center gap-2 rounded-md border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm text-white transition-all hover:border-cyan-400 hover:bg-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="mt-12 rounded-md border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <p className="text-white/40">No services yet</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {services.map((service) => {
              const Icon = getIcon(service.icon);
              return (
                <div
                  key={service.slug}
                  className="flex items-center gap-6 rounded-md border border-white/[0.08] bg-white/[0.02] p-6"
                >
                  <div className="rounded-md border border-white/10 bg-white/5 p-3">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{service.title}</h3>
                    <p className="mt-1 text-sm text-white/50">{service.tagline}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
                      <span>{service.investment.starting}</span>
                      <span>•</span>
                      <span>{service.investment.timeline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/services/${service.slug}/edit`}
                      className="rounded-md border border-white/10 bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-red-400/50 transition-colors hover:bg-red-500/20 hover:text-red-400"
                      title="Delete (coming soon)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
