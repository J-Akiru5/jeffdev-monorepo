import { ContentEditorShell, ContentField } from "@/components/agency/content-editor-shell";

/**
 * Prism Landing Page Content Editor
 * -----------------------------------
 * Edit the Prism Context Engine landing page content.
 */

export default function PrismEditorPage() {
  return (
    <ContentEditorShell
      slug="prism"
      title="Prism Landing Page"
      description="Edit the Prism Context Engine product landing page"
    >
      {({ content, setContent }) => (
        <div className="space-y-6">
          {/* Hero */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Hero Section</h3>
            <ContentField
              label="Title"
              value={content.hero?.title}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, title: v } })}
            />
            <ContentField
              label="Tagline"
              value={content.hero?.tagline}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, tagline: v } })}
            />
            <ContentField
              label="Description"
              value={content.hero?.description}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, description: v } })}
              multiline
            />
          </div>

          {/* Features */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Features</h3>
            {(content.features || []).map((feat: any, i: number) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.01] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Feature {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const features = [...content.features];
                      features.splice(i, 1);
                      setContent({ ...content, features });
                    }}
                    className="text-xs text-red-400/60 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <ContentField
                  label="Title"
                  value={feat.title}
                  onChange={(v) => {
                    const features = [...content.features];
                    features[i] = { ...features[i], title: v };
                    setContent({ ...content, features });
                  }}
                />
                <ContentField
                  label="Description"
                  value={feat.description}
                  onChange={(v) => {
                    const features = [...content.features];
                    features[i] = { ...features[i], description: v };
                    setContent({ ...content, features });
                  }}
                  multiline
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const features = [...(content.features || []), { title: "", description: "" }];
                setContent({ ...content, features });
              }}
              className="rounded-lg border border-dashed border-white/10 px-4 py-2 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              + Add Feature
            </button>
          </div>

          {/* Pricing */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Pricing</h3>
            <ContentField
              label="Free Tier Description"
              value={content.pricing?.free}
              onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, free: v } })}
              multiline
            />
            <ContentField
              label="Pro Tier Description"
              value={content.pricing?.pro}
              onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, pro: v } })}
              multiline
            />
            <ContentField
              label="Enterprise Tier Description"
              value={content.pricing?.enterprise}
              onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, enterprise: v } })}
              multiline
            />
          </div>
        </div>
      )}
    </ContentEditorShell>
  );
}
