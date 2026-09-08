"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Tournament, TournamentInput } from "@/lib/types";
import { getStatus, remainingSeats } from "@/lib/types";
import { SiteHeader } from "../SiteHeader";
import { AdminTournamentCard } from "./AdminTournamentCard";
import { TournamentFormModal } from "./TournamentFormModal";
import { SUITS } from "../SuitMark";

/** "new" pour la création, un tournoi pour l'édition, null si la modale est fermée. */
type ModalTarget = "new" | Tournament | null;

export function AdminBoard({
  initialTournaments,
}: {
  initialTournaments: Tournament[];
}) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState(initialTournaments);
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const sorted = useMemo(
    () =>
      [...tournaments].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [tournaments]
  );

  const stats = useMemo(() => {
    const withCount = tournaments.map((t) => ({
      ...t,
      registeredCount: t.registrants.length,
    }));
    const open = withCount.filter((t) => getStatus(t) === "upcoming");
    const seatsLeft = open.reduce((sum, t) => sum + remainingSeats(t), 0);
    const totalRegistrants = tournaments.reduce(
      (sum, t) => sum + t.registrants.length,
      0
    );
    return { openCount: open.length, seatsLeft, totalRegistrants };
  }, [tournaments]);

  async function handleCreate(input: TournamentInput): Promise<string | void> {
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return body.error ?? "La création a échoué.";
    }
    const created = (await res.json()) as Tournament;
    setTournaments((prev) => [created, ...prev]);
  }

  async function handleUpdate(
    id: string,
    input: TournamentInput
  ): Promise<string | void> {
    const res = await fetch(`/api/admin/tournaments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return body.error ?? "La modification a échoué.";
    }
    const updated = (await res.json()) as Tournament;
    setTournaments((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  }

  async function handleDuplicateTournament(id: string) {
    const res = await fetch(`/api/admin/tournaments/${id}/duplicate`, {
      method: "POST",
    });
    if (res.ok) {
      const duplicate = (await res.json()) as Tournament;
      setTournaments((prev) => [duplicate, ...prev]);
      setModalTarget(duplicate);
    }
  }

  async function handleDeleteTournament(id: string) {
    const res = await fetch(`/api/admin/tournaments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTournaments((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function handleRemoveRegistrant(
    tournamentId: string,
    registrantId: string
  ) {
    const res = await fetch(
      `/api/admin/tournaments/${tournamentId}/registrants/${registrantId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      const updated = (await res.json()) as Tournament;
      setTournaments((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/tournois");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader active="/admin" />

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
        <dl className="flex flex-wrap gap-8">
          <div>
            <dt className="text-xs text-text-soft">Tournois à venir</dt>
            <dd className="text-xl font-bold text-text">{stats.openCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-soft">Places disponibles</dt>
            <dd className="text-xl font-bold text-text">{stats.seatsLeft}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-soft">Inscrits au total</dt>
            <dd className="text-xl font-bold text-text">
              {stats.totalRegistrants}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-soft">Total au registre</dt>
            <dd className="text-xl font-bold text-text">
              {tournaments.length}
            </dd>
          </div>
        </dl>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/registrants"
            className="rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-text-soft transition-colors hover:text-text"
          >
            Gestion des inscrits
          </Link>
          <Link
            href="/admin/members"
            className="rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-text-soft transition-colors hover:text-text"
          >
            Membres autorisés
          </Link>
          <button
            type="button"
            onClick={() => setModalTarget("new")}
            className="rounded-sm bg-accent px-5 py-2.5 text-sm font-bold text-text transition-colors hover:bg-accent-light"
          >
            + Nouveau tournoi
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm text-text-soft transition-colors hover:text-text disabled:opacity-50"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-12 sm:px-8">
        {sorted.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--border)] px-6 py-16 text-center">
            <p className="text-lg text-text">Le registre est vide.</p>
            <p className="mt-1 text-sm text-text-soft">
              Ajoutez votre premier tournoi pour le voir apparaître ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {sorted.map((t, i) => (
              <AdminTournamentCard
                key={t.id}
                tournament={t}
                suit={SUITS[i % SUITS.length]}
                onEditTournament={setModalTarget}
                onDuplicateTournament={handleDuplicateTournament}
                onDeleteTournament={handleDeleteTournament}
                onRemoveRegistrant={handleRemoveRegistrant}
              />
            ))}
          </div>
        )}
      </main>

      {modalTarget && (
        <TournamentFormModal
          tournament={modalTarget === "new" ? undefined : modalTarget}
          onClose={() => setModalTarget(null)}
          onSubmit={
            modalTarget === "new"
              ? handleCreate
              : (input) => handleUpdate(modalTarget.id, input)
          }
        />
      )}
    </div>
  );
}
