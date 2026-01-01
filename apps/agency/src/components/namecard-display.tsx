'use client';

/**
 * Namecard Display Component
 * --------------------------
 * Premium digital business card with QR code and vCard export.
 */

import { useState, useEffect } from 'react';
import { Mail, Phone, Linkedin, Github, Globe, Download, QrCode, X as TwitterIcon } from 'lucide-react';
import type { PublicNamecard } from '@/types/user';

interface NamecardDisplayProps {
  namecard: PublicNamecard;
}

export function NamecardDisplay({ namecard }: NamecardDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const accentColor = namecard.accentColor || '#06b6d4';

  const getBackgroundStyle = () => {
    const bg = namecard.background || 'gradient-dark';

    switch (bg) {
      case 'gradient-dark':
        return 'bg-gradient-to-br from-gray-900 to-black';
      case 'gradient-light':
        return 'bg-gradient-to-br from-gray-100 to-white';
      case 'glass-1':
        return 'bg-white/10 backdrop-blur-md';
      case 'glass-2':
        return 'bg-black/40 backdrop-blur-xl';
      default:
        return 'bg-black'; // Fallback
    }
  };

  const isHexBg = namecard.background?.startsWith('#');
  const bgClass = !isHexBg ? getBackgroundStyle() : '';

  // Generate QR code on mount
  useEffect(() => {
    const generateQR = async () => {
      try {
        // Use QRCode library if available, otherwise use a simple API
        const url = `${window.location.origin}/card/${namecard.username}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=0a0a0a&color=ffffff`;
        setQrDataUrl(qrUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };
    generateQR();
  }, [namecard.username]);

  // Generate vCard data
  const generateVCard = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${namecard.displayName}`,
      namecard.title ? `TITLE:${namecard.title}` : '',
      'ORG:JD Studio',
      namecard.email ? `EMAIL:${namecard.email}` : '',
      namecard.phone ? `TEL:${namecard.phone}` : '',
      namecard.social?.website ? `URL:${namecard.social.website}` : '',
      namecard.social?.linkedin ? `X-SOCIALPROFILE;type=linkedin:${namecard.social.linkedin}` : '',
      namecard.social?.github ? `X-SOCIALPROFILE;type=github:${namecard.social.github}` : '',
      namecard.bio ? `NOTE:${namecard.bio}` : '',
      `REV:${new Date().toISOString()}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${namecard.displayName.replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Card */}
      <div
        className={`rounded-2xl border border-white/10 overflow-hidden ${bgClass}`}
        style={{
          backgroundColor: isHexBg ? namecard.background : undefined,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header with accent gradient */}
        <div
          className="h-24 relative"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}10 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        </div>

        {/* Profile Photo */}
        <div className="px-6 -mt-12 relative">
          <div
            className="h-24 w-24 rounded-full border-4 bg-[#0a0a0a] overflow-hidden"
            style={{ borderColor: accentColor }}
          >
            {namecard.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={namecard.photoURL}
                alt={namecard.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-white/40">
                {namecard.displayName.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="px-6 pt-4 pb-6">
          <h1 className="text-2xl font-bold text-white">{namecard.displayName}</h1>
          {namecard.title && (
            <p className="text-sm text-white/50 mt-1">{namecard.title}</p>
          )}
          {namecard.tagline && (
            <p
              className="text-sm mt-2"
              style={{ color: accentColor }}
            >
              {namecard.tagline}
            </p>
          )}

          {/* Bio */}
          {namecard.bio && (
            <p className="text-sm text-white/60 mt-4 leading-relaxed">
              {namecard.bio}
            </p>
          )}

          {/* Contact Info */}
          <div className="mt-6 space-y-3">
            {namecard.email && (
              <a
                href={`mailto:${namecard.email}`}
                className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                <div className="p-2 rounded-md bg-white/5">
                  <Mail className="h-4 w-4" />
                </div>
                {namecard.email}
              </a>
            )}
            {namecard.phone && (
              <a
                href={`tel:${namecard.phone}`}
                className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
              >
                <div className="p-2 rounded-md bg-white/5">
                  <Phone className="h-4 w-4" />
                </div>
                {namecard.phone}
              </a>
            )}
          </div>

          {/* Social Links */}
          {namecard.social && Object.values(namecard.social).some(Boolean) && (
            <div className="mt-6 flex gap-3">
              {namecard.social.linkedin && (
                <SocialLink href={namecard.social.linkedin} icon={Linkedin} color={accentColor} />
              )}
              {namecard.social.github && (
                <SocialLink href={namecard.social.github} icon={Github} color={accentColor} />
              )}
              {namecard.social.twitter && (
                <SocialLink href={namecard.social.twitter} icon={TwitterIcon} color={accentColor} />
              )}
              {namecard.social.website && (
                <SocialLink href={namecard.social.website} icon={Globe} color={accentColor} />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={generateVCard}
              className="flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
                color: accentColor,
              }}
            >
              <Download className="h-4 w-4" />
              Save Contact
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm text-white/70 bg-white/5 hover:bg-white/10 transition-all"
            >
              <QrCode className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            JD Studio
          </span>
          <span className="text-[10px] text-white/30 font-mono">
            @{namecard.username}
          </span>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQr && qrDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] rounded-lg border border-white/10 p-6 text-center">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
            <h3 className="text-lg font-semibold text-white mb-4">Scan to Connect</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code" className="mx-auto rounded-md" />
            <p className="text-xs text-white/40 mt-4">
              jeffdev.studio/card/{namecard.username}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2.5 rounded-md bg-white/5 text-white/50 transition-all hover:text-white"
      style={{ '--hover-bg': `${color}20` } as React.CSSProperties}
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}
