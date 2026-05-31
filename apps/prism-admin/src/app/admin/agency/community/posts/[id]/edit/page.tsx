import { notFound } from "next/navigation";
import { getCommunityPost, getCommunityMembers } from "@/app/actions/community";
import { CommunityPostForm } from "@/components/community/community-post-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCommunityPostPage({ params }: Props) {
  const { id } = await params;
  const [{ data: post }, { data: members }] = await Promise.all([
    getCommunityPost(id),
    getCommunityMembers(),
  ]);

  if (!post) notFound();

  return <CommunityPostForm mode="edit" initialData={post} members={members ?? []} />;
}
