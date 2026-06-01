import { ContentEditorShell, ContentField } from "@/components/agency/content-editor-shell";

/**
 * Contact Page Content Editor
 * -----------------------------
 * Edit the contact page content and form settings.
 */

export default function ContactEditorPage() {
  return (
    <ContentEditorShell
      slug="contact"
      title="Contact Page"
      description="Edit contact page content, form settings, and location info"
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

          {/* Contact Info */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Contact Information</h3>
            <ContentField
              label="Email"
              value={content.email}
              onChange={(v) => setContent({ ...content, email: v })}
            />
            <ContentField
              label="Phone"
              value={content.phone}
              onChange={(v) => setContent({ ...content, phone: v })}
            />
            <ContentField
              label="Address"
              value={content.address}
              onChange={(v) => setContent({ ...content, address: v })}
              multiline
            />
          </div>

          {/* Business Hours */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Business Hours</h3>
            <ContentField
              label="Hours"
              value={content.hours}
              onChange={(v) => setContent({ ...content, hours: v })}
              multiline
            />
          </div>

          {/* Social Links */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-sm font-medium text-white/80">Social Links</h3>
            <ContentField
              label="Facebook URL"
              value={content.social?.facebook}
              onChange={(v) => setContent({ ...content, social: { ...content.social, facebook: v } })}
            />
            <ContentField
              label="LinkedIn URL"
              value={content.social?.linkedin}
              onChange={(v) => setContent({ ...content, social: { ...content.social, linkedin: v } })}
            />
            <ContentField
              label="GitHub URL"
              value={content.social?.github}
              onChange={(v) => setContent({ ...content, social: { ...content.social, github: v } })}
            />
          </div>
        </div>
      )}
    </ContentEditorShell>
  );
}
