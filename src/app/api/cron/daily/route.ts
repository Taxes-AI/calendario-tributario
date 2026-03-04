import type { NextRequest } from "next/server";
import { transitionStatuses } from "@/lib/services/cron/status-transitions";
import { createNotifications } from "@/lib/services/cron/create-notifications";
// import { sendDigestEmails } from "@/lib/services/cron/send-digest-emails";
import { cleanupOldNotifications } from "@/lib/services/cron/cleanup";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Step 1: Transition obligation statuses
    const transitioned = await transitionStatuses();
    // Step 2: Create in-app notifications for threshold hits
    const notifications = await createNotifications();
    // Step 3: Send daily digest emails
    // const emails = await sendDigestEmails();
    const emails = { sent: 0, users: 0 }; // TODO: Re-enable when Resend API key is configured
    // Step 4: Clean up old notifications (30-day retention)
    const cleanup = await cleanupOldNotifications();

    console.log("[CRON] Daily job completed:", { transitioned, notifications, emails, cleanup });

    return Response.json({
      success: true,
      transitioned,
      notifications,
      emails,
      cleanup,
    });
  } catch (error) {
    console.error("[CRON] Daily job failed:", error);
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
