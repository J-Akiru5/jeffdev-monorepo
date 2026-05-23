import { notFound } from "next/navigation";
import { getBrand } from "../../actions";
import EditBrandForm from "./edit-form";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Brand Edit Page
 * Server component that fetches brand and renders edit form.
 */
export default async function EditBrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = await getBrand(slug);
  
  if (!brand) {
    notFound();
  }

  // Transform MongoDB document to BrandData shape
  const brandData = {
    slug: brand.slug as string,
    companyName: brand.companyName as string,
    tagline: brand.tagline as string | undefined,
    industry: brand.industry as string,
    colors: brand.colors as {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textMuted: string;
    },
    typography: brand.typography as {
      headingFont: string;
      bodyFont: string;
      monoFont?: string;
      scale: string;
    },
    voice: brand.voice as {
      personality: string;
      formality: string;
      keywords: string[];
    },
    imagery: brand.imagery as {
      style: string;
      mood: string;
    },
    spacing: brand.spacing as {
      unit: number;
      borderRadius: string;
    },
  };

  return <EditBrandForm brand={brandData} />;
}
