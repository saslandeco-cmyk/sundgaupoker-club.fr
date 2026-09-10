import type { Registrant, Tournament } from "./types";
import { formatDateTime } from "./format";
import { sendMail } from "./mailer";

function tournamentSummaryLines(tournament: Tournament): string[] {
  const { date } = formatDateTime(tournament.date);
  const lines = [
    `Tournoi : ${tournament.name}`,
    `Date : ${date}`,
    `Lieu : ${tournament.venue}`,
  ];
  if (tournament.startTime) lines.push(`Début du tournoi : ${tournament.startTime}`);
  if (tournament.startingStack) lines.push(`Stack de départ : ${tournament.startingStack}`);
  if (tournament.roundDuration) lines.push(`Round : ${tournament.roundDuration}`);
  if (tournament.breakInfo) lines.push(`Pause : ${tournament.breakInfo}`);
  if (tournament.finalTable) lines.push(`Table finale : ${tournament.finalTable}`);
  return lines;
}

function toHtmlList(lines: string[]): string {
  return `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;
}

export interface NotifyResult {
  /** `true` si l'email a été transmis au SMTP ; `false` s'il n'a pas pu l'être. */
  adminNotified: boolean;
  /** `null` si la personne n'a pas renseigné d'email (rien à envoyer). */
  registrantNotified: boolean | null;
}

/**
 * Point d'entrée unique pour notifier une nouvelle inscription à un
 * tournoi : un email récapitulatif à l'administrateur (`ADMIN_EMAIL`), et
 * un email de confirmation à la personne inscrite (si elle a renseigné une
 * adresse). Pure fonction serveur, sans dépendance à Next.js — appelez-la
 * depuis n'importe quelle Server Action, Route Handler ou script :
 *
 * ```ts
 * "use server";
 * import { notify } from "@/lib/notify";
 *
 * export async function myServerAction(...) {
 *   // ... vos vérifications et votre logique métier ...
 *   await notify({ tournament, registrant });
 * }
 * ```
 *
 * N'échoue jamais : un problème SMTP est journalisé et reflété dans la
 * valeur de retour, mais ne lève jamais d'exception — un souci d'email ne
 * doit jamais faire échouer l'action qui l'appelle.
 */
export async function notify({
  tournament,
  registrant,
}: {
  tournament: Tournament;
  registrant: Registrant;
}): Promise<NotifyResult> {
  const summary = tournamentSummaryLines(tournament);
  const adminEmail = process.env.ADMIN_EMAIL;
  const registeredAt = formatDateTime(registrant.createdAt);

  let adminNotified = false;
  if (adminEmail) {
    const recapLines = [
      `Prénom : ${registrant.firstName}`,
      `Nom : ${registrant.lastName}`,
      `Email : ${registrant.email || "non renseigné"}`,
      ...(registrant.nickname ? [`Pseudo : ${registrant.nickname}`] : []),
      `Inscrit le : ${registeredAt.date} à ${registeredAt.time}`,
    ];
    adminNotified = await sendMail({
      to: adminEmail,
      subject: `Nouvelle inscription — ${tournament.name}`,
      text: [
        `Nouvelle inscription pour « ${tournament.name} ».`,
        "",
        ...recapLines,
        "",
        ...summary,
      ].join("\n"),
      html:
        `<p>Nouvelle inscription pour <strong>${tournament.name}</strong>.</p>` +
        toHtmlList(recapLines) +
        `<p>Récapitulatif du tournoi :</p>` +
        toHtmlList(summary),
    });
  } else {
    console.warn(
      "[notify] ADMIN_EMAIL non défini : aucune notification admin envoyée."
    );
  }

  let registrantNotified: boolean | null = null;
  if (registrant.email) {
    registrantNotified = await sendMail({
      to: registrant.email,
      subject: `Inscription confirmée — ${tournament.name}`,
      text: [
        `Bonjour ${registrant.firstName},`,
        "",
        `Votre inscription au tournoi « ${tournament.name} » est confirmée !`,
        "",
        ...summary,
        "",
        "À bientôt à la table !",
      ].join("\n"),
      html:
        `<p>Bonjour ${registrant.firstName},</p>` +
        `<p>Votre inscription au tournoi <strong>${tournament.name}</strong> est confirmée !</p>` +
        toHtmlList(summary) +
        `<p>À bientôt à la table !</p>`,
    });
  }

  return { adminNotified, registrantNotified };
}
