import { ReleaseForm } from "@/components/admin/release-form";

export const dynamic = "force-dynamic";

export default function NewReleasePage() {
  return <ReleaseForm mode="create" />;
}
