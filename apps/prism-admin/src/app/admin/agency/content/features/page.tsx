import { ContentEditorShell, ContentField } from "@/components/agency/content-editor-shell";

/**
 * Features Content Editor
 * -------------------------
 * Edit the features/capabilities page content.
 */

export default function FeaturesEditorPage() {
  return (
    <ContentEditorShell
      slug="features"
      title="Features"
      description="Edit features, capabilities, and service offerings"
    >
      {({ content, setContent }) => (
        <div className="space-y-6">
          {/* Page Header */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Page Header</h3>
            <ContentField
              label="Title"
              value={content.title}
              onChange={(v) => setContent({ ...content, title: v })}
            />
            <ContentField
              label="Subtitle"
              value={content.subtitle}
              onChange={(v) => setContent({ ...content, subtitle: v })}
            />
          </div>

          {/* Features List */}
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
                <ContentField
                  label="Icon"
                  value={feat.icon}
                  onChange={(v) => {
                    const features = [...content.features];
                    features[i] = { ...features[i], icon: v };
                    setContent({ ...content, features });
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const features = [...(content.features || []), { title: "", description: "", icon: "" }];
                setContent({ ...content, features });
              }}
              className="rounded-lg border border-dashed border-white/10 px-4 py-2 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              + Add Feature
            </button>
          </div>
        </div>
      )}
    </ContentEditorShell>
  );
}
