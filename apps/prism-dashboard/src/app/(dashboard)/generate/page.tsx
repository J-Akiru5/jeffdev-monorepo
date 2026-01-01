import { ComponentGenerator } from '@/components/ai-kitchen';

export const metadata = {
  title: 'AI Kitchen | Prism Engine',
  description: 'Generate components with AI using your design system rules',
};

export default function GeneratePage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          AI Kitchen
        </h1>
        <p className="mt-2 text-white/60">
          Generate production-ready components with your design system baked in.
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
        <ComponentGenerator />
      </div>
    </div>
  );
}
