import { ContentEditorShell, ContentField } from "@/components/agency/content-editor-shell";

/**
 * Legal Pages Content Editor
 * ----------------------------
 * Edit legal page content: Privacy Policy, Terms of Service, Cookie Policy.
 */

export default function LegalEditorPage() {
  return (
    <ContentEditorShell
      slug="legal"
      title="Legal Pages"
      description="Edit Privacy Policy, Terms of Service, and Cookie Policy content"
    >
      {({ content, setContent }) => (
        <div className="space-y-6">
          {/* Privacy Policy */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Privacy Policy</h3>
            <ContentField
              label="Last Updated"
              value={content.privacyPolicy?.lastUpdated}
              onChange={(v) => setContent({ ...content, privacyPolicy: { ...content.privacyPolicy, lastUpdated: v } })}
            />
            <ContentField
              label="Content (Markdown)"
              value={content.privacyPolicy?.content}
              onChange={(v) => setContent({ ...content, privacyPolicy: { ...content.privacyPolicy, content: v } })}
              multiline
              rows={10}
            />
          </div>

          {/* Terms of Service */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Terms of Service</h3>
            <ContentField
              label="Last Updated"
              value={content.termsOfService?.lastUpdated}
              onChange={(v) => setContent({ ...content, termsOfService: { ...content.termsOfService, lastUpdated: v } })}
            />
            <ContentField
              label="Content (Markdown)"
              value={content.termsOfService?.content}
              onChange={(v) => setContent({ ...content, termsOfService: { ...content.termsOfService, content: v } })}
              multiline
              rows={10}
            />
          </div>

          {/* Cookie Policy */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Cookie Policy</h3>
            <ContentField
              label="Last Updated"
              value={content.cookiePolicy?.lastUpdated}
              onChange={(v) => setContent({ ...content, cookiePolicy: { ...content.cookiePolicy, lastUpdated: v } })}
            />
            <ContentField
              label="Content (Markdown)"
              value={content.cookiePolicy?.content}
              onChange={(v) => setContent({ ...content, cookiePolicy: { ...content.cookiePolicy, content: v } })}
              multiline
              rows={10}
            />
          </div>
        </div>
      )}
    </ContentEditorShell>
  );
}
