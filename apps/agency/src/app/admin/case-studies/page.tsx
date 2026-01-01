import { cookies } from 'next/headers';
import { getCaseStudies } from '@/app/actions/case-studies';
import { CaseStudiesClient } from '@/components/admin/case-studies-client';

export const dynamic = 'force-dynamic';

/**
 * Case Studies Admin Page
 * ------------------------
 * Manage case studies displayed on the public /work page.
 * Create, edit, reorder, and toggle featured status.
 */

export const metadata = {
  title: 'Case Studies - Admin',
  description: 'Manage case studies and portfolio projects',
};

export default async function CaseStudiesPage() {
  // Force dynamic rendering
  await cookies();
  
  const caseStudies = await getCaseStudies();

  return (
    <div>
      <CaseStudiesClient caseStudies={caseStudies} />
    </div>
  );
}
