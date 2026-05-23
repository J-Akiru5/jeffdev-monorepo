import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getCaseStudyBySlug } from '@/app/actions/case-studies';
import { CaseStudyForm } from '@/components/admin/case-study-form';

export const dynamic = 'force-dynamic';

/**
 * Edit Case Study Page
 * ---------------------
 * Edit an existing case study.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const caseStudy = await getCaseStudyBySlug(slug);
  
  return {
    title: caseStudy ? `Edit: ${caseStudy.title} - Admin` : 'Not Found',
  };
}

export default async function EditCaseStudyPage({ params }: Props) {
  await cookies(); // Force dynamic
  const { slug } = await params;
  const caseStudy = await getCaseStudyBySlug(slug);

  if (!caseStudy) {
    notFound();
  }

  return <CaseStudyForm mode="edit" initialData={caseStudy} />;
}
