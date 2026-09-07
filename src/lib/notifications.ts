import type { Registrant, Tournament } from "./types";
import { formatDateTime } from "./format";
import { sendMail } from "./mailer";

function tournamentSummaryLines(tournament: Tournament): string[] {
  const { date, time } = formatDateTime(tournament.date);
  const lines = [
    `Tournoi : ${tournament.name}`,
    `Date : ${date} à ${time}`,
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

/**
 * Envoie, en tâche de fond, l'email de notification à l'administrateur et
 * l'email de confirmation à la personne inscrite. Les deux envois sont
 * indépendants et ne bloquent jamais la réponse de l'API : une inscription
 * réussie ne doit jamais échouer à cause d'un problème d'email.
 */
export function notifyNewRegistration(
  tournament: Tournament,
  registrant: Registrant
): void {
  const adminEmail = process.env.ADMIN_EMAIL;
  const summary = tournamentSummaryLines(tournament);
  const registeredAt = formatDateTime(registrant.createdAt);

  if (adminEmail) {
    const recapLines = [
      `Prénom : ${registrant.firstName}`,
      `Nom : ${registrant.lastName}`,
      `Email : ${registrant.email || "non renseigné"}`,
      ...(registrant.nickname ? [`Pseudo : ${registrant.nickname}`] : []),
      `Inscrit le : ${registeredAt.date} à ${registeredAt.time}`,
    ];
    void sendMail({
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
      "[notifications] ADMIN_EMAIL non défini : aucune notification admin envoyée."
    );
  }

  if (registrant.email) {
    void sendMail({
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
}
