export const prismWaitlistConfirmation = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transmission Received</title>
</head>
<body style="font-family: 'JetBrains Mono', Consolas, monospace; line-height: 1.6; color: #e5e5e5; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #050505;">
  <div style="text-align: center; padding: 40px 20px;">
    <!-- Prism Icon (Simplified CSS-safe version) -->
    <div style="margin-bottom: 30px;">
      <span style="font-size: 48px; text-shadow: 0 0 20px rgba(6,182,212,0.5);">💠</span>
    </div>
    
    <h1 style="color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 10px;">Transmission Received.</h1>
    <p style="color: #06b6d4; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 40px;">Signal Locked</p>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: left;">
      <p style="margin: 0 0 20px 0;">You have successfully secured your position in the <strong>Prism Engine</strong> queue.</p>
      <p style="margin: 0 0 20px 0;">Something is forming...</p>
      <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 14px;">We will signal you when the paradigm shifts.</p>
    </div>
    
    <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
        JD Studio • Prism Division<br>
        <a href="https://jeffdev.studio/prism" style="color: #8b5cf6; text-decoration: none;">jeffdev.studio/prism</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export function prismWaitlistNotification(data: { email: string; role?: string; source: string }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Prism Waitlist Signup</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #050505; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">💠 New Prism Waitlist Signup</h1>
  </div>
  
  <div style="background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px;">
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 100px; font-weight: 600; color: #666;">Email:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-family: monospace;">${data.email}</td>
        </tr>
         <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Source:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.source}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Time:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <div style="margin-top: 20px; text-align: center;">
      <a href="https://jeffdev.studio/admin/prism/waitlist" style="display: inline-block; background: #000; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
        View Waitlist
      </a>
    </div>
  </div>
</body>
</html>
  `;
}
