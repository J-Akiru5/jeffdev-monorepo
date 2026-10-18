/**
 * Slack notifications (best-effort)
 * ---------------------------------
 * Posts to a workspace incoming webhook when SLACK_WEBHOOK_URL is set.
 * Never throws — notifications are not critical path.
 */

export async function notifySlack(text: string): Promise<void> {
  try {
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // best-effort
  }
}

/** Deep link to a task's edit view (used in Slack/notification messages). */
export function taskUrl(taskId: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  return `${siteUrl}/tasks/${taskId}/edit`;
}
