import { CommunityMemberForm } from "@/components/community/community-member-form";

export const dynamic = "force-dynamic";

export default function NewCommunityMemberPage() {
  return <CommunityMemberForm mode="create" />;
}
