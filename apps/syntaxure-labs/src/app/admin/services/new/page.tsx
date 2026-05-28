import { ServiceForm } from "@/components/admin/service-form";

export const dynamic = "force-dynamic";

export default function NewServicePage() {
  return <ServiceForm mode="create" />;
}
