import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPublicNamecard } from '@/app/actions/users';
import { NamecardDisplay } from '@/components/namecard-display';

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * Generate metadata for the namecard page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const namecard = await getPublicNamecard(username);

  if (!namecard) {
    return {
      title: 'Namecard Not Found',
    };
  }

  return {
    title: `${namecard.displayName} // JD Studio`,
    description: namecard.tagline || `Connect with ${namecard.displayName}`,
    openGraph: {
      title: namecard.displayName,
      description: namecard.tagline || namecard.bio || `Digital namecard for ${namecard.displayName}`,
      type: 'profile',
    },
  };
}

/**
 * Public Namecard Page
 * --------------------
 * Shareable digital business card with contact info, QR code, and vCard download.
 */
export default async function NamecardPage({ params }: PageProps) {
  const { username } = await params;
  const namecard = await getPublicNamecard(username);

  if (!namecard) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <NamecardDisplay namecard={namecard} />
    </div>
  );
}
