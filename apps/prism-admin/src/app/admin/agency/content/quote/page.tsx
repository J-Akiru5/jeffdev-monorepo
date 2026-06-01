import { ContentEditorShell, ContentField } from "@/components/agency/content-editor-shell";

/**
 * Quote Page Content Editor
 * ---------------------------
 * Edit the quote request page content and form fields.
 */

export default function QuoteEditorPage() {
  return (
    <ContentEditorShell
      slug="quote"
      title="Quote Page"
      description="Edit quote request page content, pricing tiers, and form configuration"
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
            <ContentField
              label="Description"
              value={content.description}
              onChange={(v) => setContent({ ...content, description: v })}
              multiline
            />
          </div>

          {/* Pricing Tiers */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Pricing Tiers</h3>
            {(content.tiers || []).map((tier: any, i: number) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.01] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Tier {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const tiers = [...content.tiers];
                      tiers.splice(i, 1);
                      setContent({ ...content, tiers });
                    }}
                    className="text-xs text-red-400/60 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
                <ContentField
                  label="Tier Name"
                  value={tier.name}
                  onChange={(v) => {
                    const tiers = [...content.tiers];
                    tiers[i] = { ...tiers[i], name: v };
                    setContent({ ...content, tiers });
                  }}
                />
                <ContentField
                  label="Price Range"
                  value={tier.price}
                  onChange={(v) => {
                    const tiers = [...content.tiers];
                    tiers[i] = { ...tiers[i], price: v };
                    setContent({ ...content, tiers });
                  }}
                />
                <ContentField
                  label="Description"
                  value={tier.description}
                  onChange={(v) => {
                    const tiers = [...content.tiers];
                    tiers[i] = { ...tiers[i], description: v };
                    setContent({ ...content, tiers });
                  }}
                  multiline
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const tiers = [...(content.tiers || []), { name: "", price: "", description: "" }];
                setContent({ ...content, tiers });
              }}
              className="rounded-lg border border-dashed border-white/10 px-4 py-2 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              + Add Tier
            </button>
          </div>

          {/* Form Settings */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Form Settings</h3>
            <ContentField
              label="Submit Button Text"
              value={content.submitButtonText}
              onChange={(v) => setContent({ ...content, submitButtonText: v })}
            />
            <ContentField
              label="Success Message"
              value={content.successMessage}
              onChange={(v) => setContent({ ...content, successMessage: v })}
              multiline
            />
          </div>
        </div>
      )}
    </ContentEditorShell>
  );
}
