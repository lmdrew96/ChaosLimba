import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const fromAddress = process.env.RESEND_FROM_EMAIL || "ChaosLimbă <onboarding@resend.dev>";

const encouragements = [
  "Every error is a stepping stone. Keep going!",
  "Your brain is rewiring itself for Romanian — even when it doesn't feel like it.",
  "Progress isn't linear, especially with languages. You're doing great.",
  "The fact that you showed up this week matters more than any score.",
  "Romanian is hard. You're doing it anyway. That's impressive.",
  "Small, messy sessions beat perfect plans every time.",
  "Your Error Garden is proof you're learning — errors are data, not failure.",
  "The chaos is the method. Trust the process.",
];

function getEncouragement(): string {
  return encouragements[Math.floor(Math.random() * encouragements.length)];
}

export interface WeeklySummaryData {
  firstName: string;
  sessionCount: number;
  totalMinutes: number;
  errorCount: number;
  wordsCollected: number;
  proficiencyDelta: number | null;
  topErrorType: string | null;
  resolvedPatterns: number;
  appUrl: string;
}

function buildWeeklySummaryHtml(data: WeeklySummaryData): string {
  const hasActivity = data.sessionCount > 0 || data.errorCount > 0 || data.wordsCollected > 0;
  const greeting = data.firstName ? `Hi ${data.firstName}` : "Hi there";

  const proficiencyLine = data.proficiencyDelta !== null
    ? data.proficiencyDelta > 0
      ? `<span style="color: #22c55e;">+${data.proficiencyDelta}</span> proficiency`
      : data.proficiencyDelta < 0
        ? `<span style="color: #ef4444;">${data.proficiencyDelta}</span> proficiency`
        : `<span style="color: #a78bfa;">steady</span> proficiency`
    : null;

  const activitySection = hasActivity
    ? `
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 12px 16px; background: #2a2a3e; border-radius: 8px 0 0 0;">
            <div style="font-size: 28px; font-weight: bold; color: #a78bfa;">${data.sessionCount}</div>
            <div style="font-size: 13px; color: #9ca3af;">sessions</div>
          </td>
          <td style="padding: 12px 16px; background: #2a2a3e;">
            <div style="font-size: 28px; font-weight: bold; color: #a78bfa;">${data.totalMinutes}</div>
            <div style="font-size: 13px; color: #9ca3af;">minutes</div>
          </td>
          <td style="padding: 12px 16px; background: #2a2a3e;">
            <div style="font-size: 28px; font-weight: bold; color: #a78bfa;">${data.errorCount}</div>
            <div style="font-size: 13px; color: #9ca3af;">errors logged</div>
          </td>
          <td style="padding: 12px 16px; background: #2a2a3e; border-radius: 0 8px 0 0;">
            <div style="font-size: 28px; font-weight: bold; color: #a78bfa;">${data.wordsCollected}</div>
            <div style="font-size: 13px; color: #9ca3af;">words collected</div>
          </td>
        </tr>
      </table>
      ${proficiencyLine ? `<p style="color: #d1d5db; font-size: 14px;">Proficiency trend: ${proficiencyLine}</p>` : ""}
      ${data.topErrorType ? `<p style="color: #d1d5db; font-size: 14px;">Most worked on: <strong style="color: #a78bfa;">${data.topErrorType.replace("|", " — ")}</strong>${data.resolvedPatterns > 0 ? ` (${data.resolvedPatterns} pattern${data.resolvedPatterns > 1 ? "s" : ""} resolved!)` : ""}</p>` : ""}
    `
    : `
      <div style="padding: 24px; background: #2a2a3e; border-radius: 8px; text-align: center; margin: 24px 0;">
        <p style="color: #d1d5db; font-size: 16px; margin: 0;">No sessions this week — and that's okay.</p>
        <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0;">No pressure. Romanian will be here when you're ready.</p>
      </div>
    `;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background: #1a1a2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 24px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #a78bfa; font-size: 24px; margin: 0;">ChaosLimbă</h1>
      <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Your week in Romanian</p>
    </div>

    <!-- Greeting -->
    <p style="color: #e5e7eb; font-size: 18px; margin-bottom: 8px;">${greeting},</p>
    <p style="color: #9ca3af; font-size: 15px;">Here's what your week looked like:</p>

    <!-- Stats -->
    ${activitySection}

    <!-- Encouragement -->
    <div style="padding: 20px; background: linear-gradient(135deg, #2d1b69, #1e1b4b); border-radius: 8px; border-left: 3px solid #a78bfa; margin: 24px 0;">
      <p style="color: #c4b5fd; font-size: 15px; font-style: italic; margin: 0;">"${getEncouragement()}"</p>
    </div>

    <!-- CTA -->
    ${hasActivity ? `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.appUrl}" style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Continue Learning</a>
    </div>
    ` : `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.appUrl}/chaos-window" style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Start a Quick Session</a>
    </div>
    `}

    <!-- Footer -->
    <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 32px; text-align: center;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        You're receiving this because you enabled weekly summaries in
        <a href="${data.appUrl}/settings" style="color: #a78bfa;">Settings</a>.
        <br>Turn it off anytime — no guilt, no questions asked.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWeeklySummary(
  to: string,
  data: WeeklySummaryData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = buildWeeklySummaryHtml(data);

    const { error } = await getResend().emails.send({
      from: fromAddress,
      to,
      subject: "Your week in Romanian",
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Failed to send:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
