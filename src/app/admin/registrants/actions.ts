"use server";

import { isAdminAuthenticated } from "@/lib/auth";
import { addManualRegistrant, type ManualRegisterError } from "@/lib/store";
import { notify } from "@/lib/notify";
import type { RegistrantInput, Tournament } from "@/lib/types";

const ERROR_MESSAGES: Record<ManualRegisterError, string> = {
  not_found: "Tournoi introuvable.",
  closed: "Ce tournoi est déjà passé.",
  full: "Ce tournoi est complet.",
  invalid_input: "Le tournoi, le prénom et le nom sont obligatoires.",
  already_registered: "Cette personne est déjà inscrite à ce tournoi.",
};

/**
 * Server Action appelée par le tableau de bord admin pour inscrire
 * manuellement une personne. Vérifie elle-même la session admin (une
 * Server Action est un point d'entrée public au même titre qu'une route
 * API : elle doit toujours revalider les droits, jamais faire confiance à
 * l'interface qui l'appelle). Notifie ensuite via `notify()`.
 */
export async function manualRegisterAction(
  tournamentId: string,
  input: RegistrantInput
): Promise<{ tournament: Tournament } | { error: string }> {
  if (!(await isAdminAuthenticated())) {
    return { error: "Accès réservé aux organisateurs. Veuillez vous connecter." };
  }

  const result = await addManualRegistrant(tournamentId, input);

  if ("error" in result) {
    return { error: ERROR_MESSAGES[result.error] };
  }

  await notify({ tournament: result.tournament, registrant: result.registrant });

  return { tournament: result.tournament };
}
