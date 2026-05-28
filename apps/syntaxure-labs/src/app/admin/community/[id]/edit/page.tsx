import { notFound } from "next/navigation";
import { getReleaseById } from "@/app/actions/releases";
import { ReleaseForm } from "@/components/admin/release-form";

export const dynamic = "force-dynamic";

interface EditReleasePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReleasePage({ params }: EditReleasePageProps) {
  const { id } = await params;
  const release = await getReleaseById(id);

  if (!release) {
    notFound();
  }

  return <ReleaseForm mode="edit" initialData={release as any} />;
}
