interface DigestObligation {
  impuesto: string;
  fechaVencimiento: string;
  daysLeft: number;
}

export function buildDigestHtml(
  userName: string,
  obligations: DigestObligation[]
): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://calendario-tributario.vercel.app";

  const hasOverdue = obligations.some((ob) => ob.daysLeft < 0);
  const subtitle = hasOverdue
    ? "Tienes obligaciones tributarias vencidas y proximas a vencer:"
    : "Tienes obligaciones tributarias proximas a vencer:";

  const rows = obligations
    .map((ob) => {
      const fecha = new Date(ob.fechaVencimiento).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const daysText =
        ob.daysLeft < 0
          ? '<span style="color: #dc2626; font-weight: 600;">Vencida</span>'
          : ob.daysLeft === 0
            ? '<span style="color: #ea580c; font-weight: 600;">Hoy</span>'
            : `${ob.daysLeft} dia${ob.daysLeft !== 1 ? "s" : ""}`;

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${ob.impuesto}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${fecha}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: center;">${daysText}</td>
        </tr>`;
    })
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827; margin-bottom: 4px;">Contably</h2>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />

      <p style="color: #111827; font-size: 15px;">Hola ${userName},</p>
      <p style="color: #374151; font-size: 14px;">${subtitle}</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Impuesto</th>
            <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Fecha limite</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Dias restantes</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Ver en dashboard
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 32px;">
        Este es un recordatorio automatico de Contably.
      </p>
    </div>
  `;
}
