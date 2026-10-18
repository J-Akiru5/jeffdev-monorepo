import { PageEditor } from "@/components/page-editor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageRoute({ params }: PageProps) {
  const { id } = await params;
  return <PageEditor pageId={id} />;
}
