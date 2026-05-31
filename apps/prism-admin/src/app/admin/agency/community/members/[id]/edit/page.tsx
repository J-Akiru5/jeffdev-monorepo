import { notFound } from "next/navigation";
import { getCommunityMember } from "@/app/actions/community";
import { CommunityMemberForm } from "@/components/community/community-member-form";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCommunityMemberPage({ params }: Props) {
  const { id } = await params;
  const { data: member } = await getCommunityMember(id);

  if (!member) notFound();

  return <CommunityMemberForm mode="edit" initialData={member} />;
}
