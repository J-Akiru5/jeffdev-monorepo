export const communityWelcomeEmail = (data: {
  fullName: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Syntaxure Labs Community</title>
</head>
<body style="font-family: 'JetBrains Mono', Consolas, monospace; line-height: 1.6; color: #e5e5e5; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #050505;">
  <div style="text-align: center; padding: 40px 20px;">
    <!-- Icon / Branding -->
    <div style="margin-bottom: 30px;">
      <span style="font-size: 48px; text-shadow: 0 0 20px rgba(139,92,246,0.5);">⚡</span>
    </div>
    
    <h1 style="color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 10px;">Welcome to the Lab, ${data.fullName}.</h1>
    <p style="color: #8b5cf6; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 40px;">Connection Established</p>
    
    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: left;">
      <p style="margin: 0 0 20px 0;">You have successfully registered for the <strong>Syntaxure Labs Community</strong>.</p>
      
      <p style="margin: 0 0 20px 0;">Here is how you can jump in:</p>
      
      <ul style="padding-left: 20px; margin: 0 0 20px 0; color: rgba(255,255,255,0.8);">
        <li style="margin-bottom: 10px;"><strong>Join the Discord:</strong> Engage with other founders and senior engineers. <a href="https://discord.gg/syntaxure" style="color: #06b6d4; text-decoration: underline;">discord.gg/syntaxure</a></li>
        <li style="margin-bottom: 10px;"><strong>Check the Changelog:</strong> Stay updated with our latest releases and tools. <a href="https://www.syntaxure.dev/community" style="color: #06b6d4; text-decoration: underline;">syntaxure.dev/community</a></li>
        <li style="margin-bottom: 10px;"><strong>Contribute:</strong> Watch our open-source tools and repositories.</li>
      </ul>
      
      <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 14px;">We are building the future of context governance for agentic software workflows. Glad to have you with us.</p>
    </div>
    
    <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
      <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
        Syntaxure Labs • Community Division<br>
        <a href="https://www.syntaxure.dev" style="color: #8b5cf6; text-decoration: none;">syntaxure.dev</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export function communityAdminNotification(data: {
  fullName: string;
  email: string;
  githubUsername?: string;
  discordHandle?: string;
  primaryRole?: string;
  interests?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Community Member Registration</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #050505; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">⚡ New Community Member</h1>
  </div>
  
  <div style="background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px;">
    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 150px; font-weight: 600; color: #666;">Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Email:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-family: monospace;">${data.email}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">GitHub:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-family: monospace;">${data.githubUsername || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Discord:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.discordHandle || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Role:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-transform: capitalize;">${data.primaryRole || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Interests:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; white-space: pre-wrap;">${data.interests || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Time:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
  `;
}
