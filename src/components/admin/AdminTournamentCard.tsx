"use client";

import { useState } from "react";
import type { Suit, Tournament } from "@/lib/types";
import { getStatus, remainingSeats } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { SuitMark } from "../SuitMark";
import { ChipIcon, ClockIcon, FlagIcon, PauseIcon, SeatIcon, TrophyIcon } from "../InfoIcons";

const STATUS_LABEL: Record<ReturnType<typeof getStatus>, string> = {
  upcoming: "Inscription ouverte",
  full: "Complet",
  closed: "Terminé",
};

const STATUS_STYLE: Record<ReturnType<typeof getStatus>, string> = {
  upcoming: "text-status-open bg-[var(--status-open-soft)]",
  full: "text-status-full bg-[var(--status-full-soft)]",
  closed: "text-status-closed bg-[var(--status-closed-soft)]",
};

export function AdminTournamentCard({
  tournament,
  suit,
  onEditTournament,
  onDuplicateTournament,
  onDeleteTournament,
  onRemoveRegistrant,
}: {
  tournament: Tournament;
  suit: Suit;
  onEditTournament: (tournament: Tournament) => void;
  onDuplicateTournament: (id: string) => Promise<void>;
  onDeleteTournament: (id: string) => Promise<void>;
  onRemoveRegistrant: (tournamentId: string, registrantId: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState(false);
  const registeredCount = tournament.registrants.length;
  const status = getStatus({ ...tournament, registeredCount });
  const remaining = remainingSeats({ ...tournament, registeredCount });
  const { date } = formatDateTime(tournament.date);

  async function handleDelete() {
    if (!confirm(`Supprimer « ${tournament.name} » et ses inscriptions ?`)) {
      return;
    }
    setPending(true);
    await onDeleteTournament(tournament.id);
    setPending(false);
  }

  async function handleDuplicate() {
    setPending(true);
    await onDuplicateTournament(tournament.id);
    setPending(false);
  }

  return (
    <article className="rise-in flex flex-col gap-3 rounded-md border border-[var(--border)] bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <SuitMark
            suit={suit}
            className={`h-5 w-5 shrink-0 ${
              suit === "heart" || suit === "diamond" ? "text-accent" : "text-text"
            }`}
          />
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => onEditTournament(tournament)}
            title="Modifier ce tournoi"
            className="rounded-sm border border-[var(--border)] px-2.5 py-1 text-sm text-text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Modifier
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleDuplicate}
            title="Dupliquer ce tournoi"
            className="rounded-sm border border-[var(--border)] px-2.5 py-1 text-sm text-text-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            Dupliquer
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            title="Supprimer ce tournoi"
            className="rounded-sm border border-[var(--border)] px-2.5 py-1 text-sm text-text-soft transition-colors hover:border-status-full hover:text-status-full disabled:opacity-50"
          >
            ×
          </button>
        </div>
      </div>

      <h3 className="text-lg leading-snug font-bold text-text">
        {tournament.name}
      </h3>

      <p className="text-sm text-text-soft">
        {date} — {tournament.venue}
      </p>

      {tournament.description && (
        <p className="text-sm text-text-soft">{tournament.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-sm text-text">
        {tournament.startTime && (
          <span className="flex items-center gap-2">
            <FlagIcon className="h-4 w-4 text-text-soft" />
            {tournament.startTime}
          </span>
        )}
        {tournament.startingStack && (
          <span className="flex items-center gap-2">
            <ChipIcon className="h-4 w-4 text-text-soft" />
            {tournament.startingStack}
          </span>
        )}
        {tournament.roundDuration && (
          <span className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-text-soft" />
            {tournament.roundDuration}
          </span>
        )}
        {tournament.breakInfo && (
          <span className="flex items-center gap-2">
            <PauseIcon className="h-4 w-4 text-text-soft" />
            {tournament.breakInfo}
          </span>
        )}
        {tournament.finalTable && (
          <span className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-text-soft" />
            {tournament.finalTable}
          </span>
        )}
        <span className="flex items-center gap-2">
          <SeatIcon className="h-4 w-4 text-text-soft" />
          {remaining}/{tournament.maxSeats} places restantes
        </span>
        <span className="text-xs text-text-soft">
          {tournament.onlineRegistration
            ? "Inscription en ligne activée"
            : "Inscription sur place uniquement"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="self-start text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        {expanded
          ? "Masquer les inscrits"
          : registeredCount > 0
            ? `Voir les inscrits (${registeredCount})`
            : "Aucun inscrit pour l'instant"}
      </button>

      {expanded && (
        <ul className="flex flex-col divide-y divide-[var(--border)] rounded-sm border border-[var(--border)]">
          {registeredCount === 0 && (
            <li className="px-3 py-2 text-sm text-text-soft">
              Personne ne s&apos;est encore inscrit.
            </li>
          )}
          {tournament.registrants.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="text-sm text-text">
                {r.firstName} {r.lastName}
                {r.nickname && (
                  <span className="text-text-soft"> — {r.nickname}</span>
                )}
                {r.email && (
                  <span className="block text-xs text-text-soft">
                    {r.email}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onRemoveRegistrant(tournament.id, r.id)}
                title="Retirer cette inscription"
                className="text-xs text-text-soft transition-colors hover:text-status-full"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
