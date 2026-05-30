"use client";

/**
 * New Product Template Page
 *
 * Creates a new product template in the catalog.
 */

import { ProductTemplateForm } from "@/components/admin/product-template-form";

export default function NewProductTemplatePage() {
  return <ProductTemplateForm mode="create" />;
}
