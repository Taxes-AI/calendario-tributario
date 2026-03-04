import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";
import { resend } from "./resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "Calendario Tributario <noreply@resend.dev>",
        to: user.email,
        subject: "Verifica tu correo electronico",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111827;">Calendario Tributario</h2>
            <p>Hola ${user.name},</p>
            <p>Gracias por registrarte en Calendario Tributario. Por favor verifica tu correo electronico haciendo clic en el siguiente enlace:</p>
            <a href="${url}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
              Verificar correo
            </a>
            <p style="color: #6b7280; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
        `,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  advanced: {
    database: {
      generateId: false, // CRITICAL: let MongoDB generate ObjectId
    },
  },
  plugins: [nextCookies()],
});
