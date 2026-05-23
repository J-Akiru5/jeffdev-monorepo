import { notFound } from "next/navigation";
import { getRelease } from "@/app/actions/releases";
import { ReleaseForm } from "@/components/releases/release-form";

export const metadata = {
  title: "Edit Release",
};

export default async function EditReleasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: release } = await getRelease(id);

  if (!release) {
    notFound();
  }

  return (
    <ReleaseForm
      initialData={{
        id: release.id,
        title: release.title,
        version: release.version,
        date: release.date,
        type: release.type as "tool" | "update" | "patch",
        description: release.description,
        link: release.link,
        tags: release.tags,
        is_featured: release.is_featured,
      }}
      isEditing
    />
  );
}
