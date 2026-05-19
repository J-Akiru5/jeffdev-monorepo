import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { getServiceBySlug, getServices } from '@/lib/data';

interface AdminServiceEditPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export default async function AdminServiceEditPage({ params }: AdminServiceEditPageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-void px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/services"
          className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            {'// Admin.Services.Edit'}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Edit {service.title}
          </h1>
          <p className="mt-2 max-w-2xl text-white/50">
            The route is live and resolves correctly. Connect form controls to your update mutation when you want to persist changes.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {['Title', 'Tagline', 'Slug', 'Starting price', 'Timeline', 'Icon'].map((field) => (
                <label key={field} className="block md:col-span-1">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-white/40">
                    {field}
                  </span>
                  <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/40">
                    {field === 'Title' ? service.title : 'Editable field'}
                  </div>
                </label>
              ))}

              <label className="block md:col-span-2">
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Description
                </span>
                <div className="min-h-32 rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/40">
                  {service.description}
                </div>
              </label>
            </div>

            <div className="mt-8 flex justify-end">
              <button className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-white transition-colors hover:bg-cyan-500/20">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>

          <aside className="rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white">Current Snapshot</h2>
            <div className="mt-4 space-y-4 text-sm text-white/50">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Investment</div>
                <div className="mt-1 text-white">{service.investment.starting}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Timeline</div>
                <div className="mt-1 text-white">{service.investment.timeline}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Deliverables</div>
                <ul className="mt-2 space-y-2">
                  {service.deliverables.map((deliverable) => (
                    <li key={deliverable} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-white/70">
                      {deliverable}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}