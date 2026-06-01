import { ContentEditorShell, ContentField } from "@/components/agency/content-editor-shell";

/**
 * Homepage Content Editor
 * -------------------------
 * Edit hero, highlights, and featured content for the homepage.
 */

export default function HomepageEditorPage() {
  return (
    <ContentEditorShell
      slug="homepage"
      title="Homepage"
      description="Edit the homepage hero section, highlights, and featured content"
    >
      {({ content, setContent }) => (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Hero Section</h3>
            <ContentField
              label="Tagline"
              value={content.hero?.tagline}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, tagline: v } })}
            />
            <ContentField
              label="Heading Line 1"
              value={content.hero?.heading1}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, heading1: v } })}
            />
            <ContentField
              label="Heading Line 2"
              value={content.hero?.heading2}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, heading2: v } })}
            />
            <ContentField
              label="Description"
              value={content.hero?.description}
              onChange={(v) => setContent({ ...content, hero: { ...content.hero, description: v } })}
              multiline
            />
          </div>

          {/* Highlights */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Highlights</h3>
            {(content.highlights || ["", "", ""]).map((h: string, i: number) => (
              <ContentField
                key={i}
                label={`Highlight ${i + 1}`}
                value={h}
                onChange={(v) => {
                  const highlights = [...(content.highlights || ["", "", ""])];
                  highlights[i] = v;
                  setContent({ ...content, highlights });
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Call to Action</h3>
            <ContentField
              label="CTA Text"
              value={content.cta?.text}
              onChange={(v) => setContent({ ...content, cta: { ...content.cta, text: v } })}
            />
            <ContentField
              label="CTA URL"
              value={content.cta?.url}
              onChange={(v) => setContent({ ...content, cta: { ...content.cta, url: v } })}
            />
          </div>
        </div>
      )}
    </ContentEditorShell>
  );
}
