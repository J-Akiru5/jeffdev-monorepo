/**
 * Zoho Mail Integration
 * Used for fetching client inquiries from Zoho inbox
 */

interface ZohoTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ZohoEmail {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  receivedTime: number;
  summary: string;
  hasAttachment: boolean;
  isRead: boolean;
  flagid?: string;
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Zoho OAuth access token
 * Uses refresh token to get new access token
 */
async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;

  if (!refreshToken || !clientId || !clientSecret) {
    console.error("[Zoho] Missing credentials");
    return null;
  }

  try {
    const response = await fetch(
      `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`,
      { method: "POST" }
    );

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data: ZohoTokenResponse = await response.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Refresh 1 min early

    return accessToken;
  } catch (error) {
    console.error("[Zoho] Token refresh error:", error);
    return null;
  }
}

/**
 * Fetch emails from Zoho inbox
 */
export async function fetchInboxEmails(folderId = "inbox", limit = 50): Promise<ZohoEmail[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const accountId = process.env.ZOHO_ACCOUNT_ID;
  if (!accountId) {
    console.error("[Zoho] Missing account ID");
    return [];
  }

  try {
    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/messages/view?folderId=${folderId}&limit=${limit}&sortBy=receivedTime&sortOrder=desc`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fetch emails failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("[Zoho] Fetch emails error:", error);
    return [];
  }
}

/**
 * Get full email content by message ID
 */
export async function getEmailContent(messageId: string): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const accountId = process.env.ZOHO_ACCOUNT_ID;
  if (!accountId) return null;

  try {
    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/messages/${messageId}/content`,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Fetch email content failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.content || null;
  } catch (error) {
    console.error("[Zoho] Fetch email content error:", error);
    return null;
  }
}

/**
 * Mark email as read
 */
export async function markAsRead(messageId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  const accountId = process.env.ZOHO_ACCOUNT_ID;
  if (!accountId) return false;

  try {
    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/updatemessage`,
      {
        method: "PUT",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: [messageId],
          mode: "markAsRead",
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("[Zoho] Mark as read error:", error);
    return false;
  }
}

/**
 * Move email to folder (e.g., archive)
 */
export async function moveToFolder(messageId: string, folderId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;

  const accountId = process.env.ZOHO_ACCOUNT_ID;
  if (!accountId) return false;

  try {
    const response = await fetch(
      `https://mail.zoho.com/api/accounts/${accountId}/updatemessage`,
      {
        method: "PUT",
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: [messageId],
          mode: "move",
          destFolderId: folderId,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("[Zoho] Move to folder error:", error);
    return false;
  }
}
