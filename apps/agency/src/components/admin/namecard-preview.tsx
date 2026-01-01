'use client';

import { UserProfile } from '@/types/user';
import { Mail, Phone, Globe, Linkedin, Github, Twitter } from 'lucide-react';

interface NamecardPreviewProps {
  displayName: string;
  title: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  photoURL: string;
  social: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  namecard: NonNullable<UserProfile['namecard']>;
}

export function NamecardPreview({
  displayName,
  title,
  bio,
  email,
  phone,
  location,
  photoURL,
  social,
  namecard,
}: NamecardPreviewProps) {
  // Determine background style
  const getBackgroundStyle = () => {
    const bg = namecard.background || 'gradient-dark';
    
    switch (bg) {
      case 'gradient-dark':
        return 'bg-gradient-to-br from-gray-900 to-black';
      case 'gradient-light':
        return 'bg-gradient-to-br from-gray-100 to-white';
      case 'glass-1':
        return 'bg-white/10 backdrop-blur-md border border-white/20';
      case 'glass-2': // Dark glass
        return 'bg-black/40 backdrop-blur-xl border border-white/10';
      default:
        // Assume hex color
        if (bg.startsWith('#')) return undefined; // Handled by style
        return 'bg-black'; // Fallback
    }
  };

  const isHexBg = namecard.background?.startsWith('#');

  return (
    <div className="sticky top-8 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
          Live Preview
        </h3>
        <span className="text-[10px] text-white/30 truncate max-w-[150px]">
          jeffdev.studio/card/{namecard.username || 'username'}
        </span>
      </div>

      {/* Mobile Card Simulation */}
      <div className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[40px] border-[8px] border-black bg-void shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-black z-20" />

        {/* Dynamic Background */}
        <div
          className={`absolute inset-0 z-0 ${getBackgroundStyle()}`}
          style={{ backgroundColor: isHexBg ? namecard.background : undefined }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex h-full flex-col justify-between p-6 pt-16 text-center">
          
          {/* Top Section */}
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white/10 shadow-xl">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoURL} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-2xl font-bold text-white">
                  {displayName?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Name & Title */}
            <h2 className="text-xl font-bold text-white tracking-tight">{displayName || 'Your Name'}</h2>
            <p className="mt-1 text-sm text-white/60 font-medium">{title || 'Your Title'}</p>
            
            {/* Tagline */}
            {namecard.tagline && (
              <div
                className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1"
                style={{ borderColor: `${namecard.accentColor}40` }}
              >
                <p className="text-[10px] text-white/80">{namecard.tagline}</p>
              </div>
            )}
            
            {/* Bio */}
            {bio && (
              <p className="mt-4 line-clamp-3 text-xs text-white/50 px-2">
                {bio}
              </p>
            )}
          </div>

          {/* Actions / Links */}
          <div className="w-full space-y-3 mt-auto mb-8">
            {namecard.showEmail && email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                style={{ borderLeft: `2px solid ${namecard.accentColor}` }}
              >
                <Mail className="h-4 w-4" />
                <span>Email Me</span>
              </a>
            )}

            {namecard.showPhone && phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                style={{ borderLeft: `2px solid ${namecard.accentColor}` }}
              >
                <Phone className="h-4 w-4" />
                <span>Call Me</span>
              </a>
            )}

            {/* Social Grid */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {namecard.socials?.linkedin && social.linkedin && (
                <SocialIcon href={social.linkedin} icon={Linkedin} color="#0077b5" />
              )}
              {namecard.socials?.github && social.github && (
                <SocialIcon href={social.github} icon={Github} color="#ffffff" />
              )}
              {namecard.socials?.twitter && social.twitter && (
                <SocialIcon href={social.twitter} icon={Twitter} color="#1da1f2" />
              )}
              {namecard.socials?.website && social.website && (
                <SocialIcon href={social.website} icon={Globe} color={namecard.accentColor} />
              )}
            </div>
          </div>
          
          {/* Footer Branding */}
          <div className="mb-2 text-center">
             <p className="text-[9px] text-white/20 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
               <span>Powered by</span> 
               <span className='text-white/40'>JeffDev</span>
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function SocialIcon({ href, icon: Icon, color }: { href: string; icon: any; color?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/5 transition-all hover:scale-110 hover:bg-white/10"
      style={{ color: color || 'white' }}
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}
