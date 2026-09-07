"use client";

import { useMemo, useState } from "react";
import type {
  PublicTournament,
  RegistrantInput,
} from "@/lib/types";
import { getStatus } from "@/lib/types";
import { SiteHeader } from "./SiteHeader";
import { PublicTournamentCard } from "./PublicTournamentCard";
import { RegistrationModal } from "./RegistrationModal";

export function PublicBoard({
  initialTournaments,
}: {
  initialTournaments: PublicTournament[];
}) {
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [registeringFor, setRegisteringFor] = useState<PublicTournament | null>(
    null
  );

  const sorted = useMemo(
    () =>
      [...tournaments].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [tournaments]
  );

  const stats = useMemo(() => {
    const open = tournaments.filter((t) => getStatus(t) === "upcoming");
    return { openCount: open.length };
  }, [tournaments]);

  async function handleRegister(
    tournamentId: string,
    input: RegistrantInput
  ): Promise<string | void> {
    const res = await fetch(`/api/tournaments/${tournamentId}/registrants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return body.error ?? "L'inscription a échoué.";
    }
    const updated = (await res.json()) as PublicTournament;
    setTournaments((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader active="/tournois" />

      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-8">
        <p className="text-sm text-text-soft">
          {stats.openCount} tournoi{stats.openCount > 1 ? "s" : ""} à venir
        </p>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-12 sm:px-8">
        {sorted.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-lg text-text">Aucun tournoi programmé.</p>
            <p className="mt-1 text-sm text-text-soft">
              Revenez bientôt pour découvrir les prochaines dates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {sorted.map((t) => (
              <PublicTournamentCard
                key={t.id}
                tournament={t}
                onOpenRegistration={() => setRegisteringFor(t)}
              />
            ))}
          </div>
        )}
      </main>

      {registeringFor && (
        <RegistrationModal
          tournament={registeringFor}
          onClose={() => setRegisteringFor(null)}
          onSubmit={(input) => handleRegister(registeringFor.id, input)}
        />
      )}
    </div>
  );
}
