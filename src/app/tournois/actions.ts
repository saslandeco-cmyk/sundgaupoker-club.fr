"use server";

import { addRegistrant, type RegisterError } from "@/lib/store";
import { notify } from "@/lib/notify";
import { toPublicTournament } from "@/lib/types";
import type { PublicTournament, RegistrantInput } from "@/lib/types";

const ERROR_MESSAGES: Record<RegisterError, string> = {
  not_found: "Tournoi introuvable.",
  closed: "Ce tournoi est déjà passé.",
  full: "Ce tournoi est complet.",
  offline_only: "L'inscription en ligne n'est pas activée pour ce tournoi.",
  invalid_input: "Le prénom, le nom et une adresse email valide sont obligatoires.",
  already_registered: "Cette personne est déjà inscrite à ce tournoi.",
  not_authorized:
    "Cette adresse email n'est pas autorisée à s'inscrire. Contactez l'organisateur du club.",
};

/**
 * Server Action appelée par la modale d'inscription publique. Enregistre
 * l'inscription puis notifie l'administrateur et la personne inscrite via
 * `notify()`, sans jamais faire échouer l'inscription à cause d'un souci
 * d'email.
 */
export async function registerForTournamentAction(
  tournamentId: string,
  input: RegistrantInput
): Promise<{ tournament: PublicTournament } | { error: string }> {
  const result = await addRegistrant(tournamentId, input);

  if ("error" in result) {
    return { error: ERROR_MESSAGES[result.error] };
  }

  await notify({ tournament: result.tournament, registrant: result.registrant });

  return { tournament: toPublicTournament(result.tournament) };
}
