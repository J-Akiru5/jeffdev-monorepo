import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Dynamic params for the OG Image
    const title = searchParams.get('title') || 'Martinez Hybrid Technologies';
    const subtitle = searchParams.get('subtitle') || 'ID: MHT-SYS-001';
    const division = searchParams.get('division'); // e.g., 'Nexure Networks' or 'Joularix Solar'

    // Use specific colors for the blooming effect depending on division
    // Defaults to the MHT standard green/blue blend
    let bloomColorPrimary = 'rgba(16, 185, 129, 0.2)'; // Emerald
    let bloomColorSecondary = 'rgba(6, 182, 212, 0.2)'; // Cyan
    let accentText = '#10b981';

    if (division === 'Nexure Networks') {
      bloomColorPrimary = 'rgba(59, 130, 246, 0.25)'; // Blue
      bloomColorSecondary = 'rgba(6, 182, 212, 0.25)'; // Cyan
      accentText = '#3b82f6';
    } else if (division === 'Joularix Solar') {
      bloomColorPrimary = 'rgba(34, 197, 94, 0.25)'; // Green
      bloomColorSecondary = 'rgba(234, 179, 8, 0.2)'; // Yellow
      accentText = '#22c55e';
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#050505',
            padding: '80px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Grid Pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.15,
              backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Glowing Radial Blooms */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '-10%',
              width: '800px',
              height: '800px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${bloomColorPrimary} 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-20%',
              right: '-10%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${bloomColorSecondary} 0%, transparent 60%)`,
              filter: 'blur(50px)',
            }}
          />

          {/* Content Wrapper */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Top Bar: System ID & Division */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  color: '#ffffff',
                  opacity: 0.5,
                  fontSize: '24px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                }}
              >
                {subtitle}
              </span>
              {division && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: accentText,
                      marginRight: '10px',
                    }}
                  />
                  <span style={{ color: '#ffffff', fontSize: '20px', fontFamily: 'monospace' }}>
                    {division}
                  </span>
                </div>
              )}
            </div>

            {/* Main Headline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h1
                style={{
                  fontSize: '80px',
                  lineHeight: '1.1',
                  fontWeight: 900,
                  fontFamily: 'sans-serif',
                  color: '#ffffff',
                  letterSpacing: '-2px',
                  margin: 0,
                  maxWidth: '900px',
                }}
              >
                {title}
              </h1>
            </div>

            {/* Bottom Bar: Contact Info & Brand Name */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
              
              {/* Contact Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'monospace', fontSize: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: accentText, marginRight: '12px' }}>Email_</span> 
                  <span style={{ color: '#ffffff', opacity: 0.8 }}>hello@martinezhybrid.jeffdev.studio</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: accentText, marginRight: '12px' }}>Tel_</span> 
                  <span style={{ color: '#ffffff', opacity: 0.8 }}>+63 951 916 7103</span>
                </div>
              </div>

              {/* Brand Name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  fontFamily: 'sans-serif',
                }}
              >
                <span style={{ color: '#ffffff', opacity: 0.9, fontSize: '32px', fontWeight: 'bold' }}>
                  Martinez Hybrid
                </span>
                <span style={{ color: accentText, marginLeft: '8px', fontSize: '32px', fontWeight: 'bold' }}>
                  Technologies
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    return new Response(`Failed to generate image: ${error}`, {
      status: 500,
    });
  }
}
