import { notFound } from "next/navigation";
import { getServices } from "@/app/actions/services";
import { ServiceForm } from "@/components/admin/service-form";

export const dynamic = "force-dynamic";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const services = await getServices();
  const service = services.find((s) => s.id === id);

  if (!service) {
    notFound();
  }

  return <ServiceForm mode="edit" initialData={service} />;
}
