import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

const fields = [
  'Service title',
  'Slug',
  'Tagline',
  'Description',
  'Starting price',
  'Timeline',
];

export default function AdminNewServicePage() {
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
            {'// Admin.Services.New'}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Create Service
          </h1>
          <p className="mt-2 max-w-2xl text-white/50">
            This route now exists for the admin workflow. Wire it to a server action when you’re ready to persist service records.
          </p>
        </div>

        <div className="mt-10 rounded-md border border-white/[0.08] bg-white/[0.02] p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field} className="block">
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-white/40">
                  {field}
                </span>
                <div className="rounded-md border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/40">
                  Input placeholder
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 rounded-md border border-white/[0.06] bg-black/30 p-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              Notes
            </p>
            <p className="mt-2 text-sm text-white/50">
              Add validation and a save action here once the service editor is connected to Firestore.
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            <button className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-white transition-colors hover:bg-cyan-500/20">
              <Save className="h-4 w-4" />
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
