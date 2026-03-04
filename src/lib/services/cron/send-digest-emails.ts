import { resend } from "@/lib/resend";
import { prisma } from "@/lib/prisma";
import { buildDigestHtml } from "@/lib/services/email-templates/daily-digest";

export async function sendDigestEmails(): Promise<{ sent: number; users: number }> {
  // Find all notifications created today that haven't been read yet
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const notifications = await prisma.notificacion.findMany({
    where: {
      createdAt: { gte: todayStart },
      leida: false,
    },
    include: {
      obligacionTributaria: true,
    },
  });

  if (notifications.length === 0) {
    return { sent: 0, users: 0 };
  }

  // Group notifications by userId
  const byUser = new Map<string, typeof notifications>();
  for (const n of notifications) {
    const existing = byUser.get(n.userId) || [];
    existing.push(n);
    byUser.set(n.userId, existing);
  }

  // Fetch user emails
  const userIds = [...byUser.keys()];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  // Build email array for batch send
  const emails = [];
  for (const [userId, userNotifications] of byUser) {
    const user = userMap.get(userId);
    if (!user) continue;

    const obligations = userNotifications.map((n) => ({
      impuesto: n.obligacionTributaria.impuesto,
      fechaVencimiento: n.obligacionTributaria.fechaVencimiento.toISOString(),
      daysLeft: n.threshold === 0 ? -1 : n.threshold,
    }));

    // De-duplicate obligations (a user might have multiple thresholds hit for the same obligation)
    const seen = new Set<string>();
    const uniqueObligations = obligations.filter((ob) => {
      const key = ob.impuesto + ob.fechaVencimiento;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    emails.push({
      from: "Contably <noreply@resend.dev>",
      to: [user.email],
      subject: `Recordatorio: ${uniqueObligations.length} obligacion${uniqueObligations.length !== 1 ? "es" : ""} tributaria${uniqueObligations.length !== 1 ? "s" : ""} proxima${uniqueObligations.length !== 1 ? "s" : ""}`,
      html: buildDigestHtml(user.name, uniqueObligations),
    });
  }

  // Send in batches of 100 (Resend limit)
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(batch);
      if (error) {
        console.error("[CRON] Batch email error:", error);
      } else {
        sent += batch.length;
      }
    } catch (err) {
      console.error("[CRON] Batch email exception:", err);
    }
  }

  return { sent, users: byUser.size };
}
