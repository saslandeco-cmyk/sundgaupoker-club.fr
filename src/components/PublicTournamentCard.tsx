"use client";

import Image from "next/image";
import type { PublicTournament } from "@/lib/types";
import { getStatus, remainingSeats } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { CalendarIcon, ChipIcon, ClockIcon, FlagIcon, PauseIcon, PinIcon, SeatIcon, TrophyIcon } from "./InfoIcons";

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

export function PublicTournamentCard({
  tournament,
  onOpenRegistration,
}: {
  tournament: PublicTournament;
  onOpenRegistration: () => void;
}) {
  const status = getStatus(tournament);
  const remaining = remainingSeats(tournament);
  const canRegister = status === "upcoming" && tournament.onlineRegistration;

  return (
    <article className="rise-in flex flex-col overflow-hidden rounded-md border border-white bg-surface">
      <div className="relative h-36 w-full">
        <Image
          src="/images/tournament-banner.jpg"
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <span
          className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg leading-snug font-bold text-text">
          {tournament.name}
        </h3>

        <hr className="border-t border-[var(--border)]" />

        {tournament.description && (
          <p className="clamp-3 text-sm text-text-soft">
            {tournament.description}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2 text-sm text-text">
          <div className="grid grid-cols-2 gap-x-3">
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 shrink-0 text-text-soft" />
                {formatDateTime(tournament.date).date}
              </span>
              <span className="flex items-start gap-2">
                <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-text-soft" />
                {tournament.venue}
              </span>
              {tournament.startTime && (
                <span className="flex items-center gap-2">
                  <FlagIcon className="h-4 w-4 shrink-0 text-text-soft" />
                  {tournament.startTime}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {tournament.startingStack && (
                <span className="flex items-center gap-2">
                  <ChipIcon className="h-4 w-4 shrink-0 text-text-soft" />
                  {tournament.startingStack}
                </span>
              )}
              {tournament.roundDuration && (
                <span className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 shrink-0 text-text-soft" />
                  {tournament.roundDuration}
                </span>
              )}
              {tournament.finalTable && (
                <span className="flex items-center gap-2">
                  <TrophyIcon className="h-4 w-4 shrink-0 text-text-soft" />
                  {tournament.finalTable}
                </span>
              )}
              {tournament.breakInfo && (
                <span className="flex items-center gap-2">
                  <PauseIcon className="h-4 w-4 shrink-0 text-text-soft" />
                  {tournament.breakInfo}
                </span>
              )}
            </div>
          </div>
          <hr className="border-t border-[var(--border)]" />
          <span className="flex items-center gap-2">
            <SeatIcon className="h-4 w-4 shrink-0 text-text-soft" />
            {remaining <= 0
              ? "Aucune place restante"
              : `Il reste ${remaining} place${remaining > 1 ? "s" : ""} sur ${tournament.maxSeats}`}
          </span>
        </div>
      </div>

      {canRegister ? (
        <button
          type="button"
          onClick={onOpenRegistration}
          className="w-full border-t border-[var(--border)] bg-accent px-4 py-4 text-sm font-bold text-text transition-colors hover:bg-accent-light"
        >
          Inscription
        </button>
      ) : (
        <p className="w-full border-t border-[var(--border)] px-4 py-4 text-center text-sm font-semibold text-text-soft">
          {status === "full"
            ? "Complet"
            : status === "closed"
              ? "Terminé"
              : "Inscription sur place uniquement"}
        </p>
      )}
    </article>
  );
}
