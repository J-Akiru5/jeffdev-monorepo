import { getCommunityMembers } from "@/app/actions/community";
import { CommunityPostForm } from "@/components/community/community-post-form";

export const dynamic = "force-dynamic";

export default async function NewCommunityPostPage() {
  const { data: members } = await getCommunityMembers();

  return <CommunityPostForm mode="create" members={members ?? []} />;
}
