import nodemailer, { type Transporter } from "nodemailer";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transporter: Transporter | null | undefined;

/**
 * Résout l'adresse d'expédition. La plupart des serveurs SMTP (Gmail en
 * particulier) exigent que l'en-tête "From" contienne une adresse email
 * valide, pas seulement un nom d'affichage. Si `MAIL_FROM` ne contient pas
 * de "@" (ex : juste "Sundgau Poker Club"), on la complète automatiquement
 * avec le compte SMTP authentifié plutôt que de laisser l'envoi échouer.
 */
function resolveFrom(user: string | undefined): string | null {
  const raw = process.env.MAIL_FROM || user;
  if (!raw) return null;
  if (raw.includes("@")) return raw;
  if (!user) return null;
  return `${raw} <${user}>`;
}

/** Lit la config SMTP depuis les variables d'environnement. */
function getConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = resolveFrom(user);

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
 * Retourne `true` si l'email a bien été transmis au serveur SMTP, `false`
 * sinon (non configuré, ou échec) — pratique pour qu'une Server Action
 * puisse, si elle le souhaite, informer l'utilisateur du résultat.
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  const client = getTransporter();
  const from = resolveFrom(process.env.SMTP_USER);

  if (!client || !from) {
    console.warn(
      `[mailer] SMTP non configuré : email "${message.subject}" à ${message.to} non envoyé. ` +
        "Définissez SMTP_HOST, SMTP_USER, SMTP_PASSWORD et MAIL_FROM pour activer l'envoi réel."
    );
    return false;
  }

  try {
    await client.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  } catch (error) {
    console.error(`[mailer] Échec de l'envoi à ${message.to} :`, error);
    return false;
  }
}
