import { getAboutContent } from "@/app/actions/content";
import { AboutEditor } from "@/components/content/about-editor";

export default async function ContentPage() {
  const content = await getAboutContent();

  return <AboutEditor initialContent={content} />;
}
