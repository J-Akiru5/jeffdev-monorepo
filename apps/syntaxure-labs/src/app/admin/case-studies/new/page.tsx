import { CaseStudyForm } from '@/components/admin/case-study-form';

/**
 * New Case Study Page
 * --------------------
 * Create a new case study from scratch.
 */

export const metadata = {
  title: 'New Case Study - Admin',
};

export default function NewCaseStudyPage() {
  return <CaseStudyForm mode="create" />;
}
