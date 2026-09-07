import nodemailer, { type Transporter } from "nodemailer";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | null | undefined;

/** Lit la config SMTP depuis les variables d'environnement. */
function getConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.MAIL_FROM || user;

  if (!host || !user || !pass || !from) {
    return null;
  }
  return { host, port, user, pass, from };
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const config = getConfig();
  if (!config) {
    transporter = null;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: process.env.SMTP_SECURE === "true" || config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  return transporter;
}

/**
 * Envoie un email si le SMTP est configuré ; sinon, journalise l'intention
 * d'envoi sans jamais faire échouer l'appelant. L'envoi d'email est un
 * effet secondaire : il ne doit jamais empêcher une inscription de réussir.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const client = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  if (!client || !from) {
    console.warn(
      `[mailer] SMTP non configuré : email "${message.subject}" à ${message.to} non envoyé. ` +
        "Définissez SMTP_HOST, SMTP_USER, SMTP_PASSWORD et MAIL_FROM pour activer l'envoi réel."
    );
    return;
  }

  try {
    await client.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    console.error(`[mailer] Échec de l'envoi à ${message.to} :`, error);
  }
}
