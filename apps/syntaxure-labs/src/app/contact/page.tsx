import type { Metadata } from "next";
import { getPageContent } from "@/lib/cms";
import { CONTACT_DEFAULTS } from "@/data/cms-defaults";
import { ContactPageClient } from "@/components/contact-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Syntaxure Labs. We'd love to hear about your project.",
};

export const revalidate = 60;

export default async function ContactPage() {
  const cms = await getPageContent("contact");
  const content = { ...CONTACT_DEFAULTS, ...cms };

  return (
    <ContactPageClient
      pageContent={{
        title: content.title,
        subtitle: content.subtitle,
        email: content.email,
        location: content.location,
      }}
    />
  );
}
