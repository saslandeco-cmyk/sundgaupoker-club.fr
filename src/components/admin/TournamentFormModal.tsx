"use client";

import { FormEvent, useState } from "react";
import type { Tournament, TournamentInput } from "@/lib/types";
import { dateOnlyToIso, toDateInputValue } from "@/lib/format";

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toDateInputValue(d.toISOString());
}

export function TournamentFormModal({
  tournament,
  onClose,
  onSubmit,
}: {
  /** Fourni en mode édition ; absent en mode création. */
  tournament?: Tournament;
  onClose: () => void;
  onSubmit: (input: TournamentInput) => Promise<string | void>;
}) {
  const isEditing = Boolean(tournament);
  const [name, setName] = useState(tournament?.name ?? "");
  const [description, setDescription] = useState(tournament?.description ?? "");
  const [date, setDate] = useState(
    tournament ? toDateInputValue(tournament.date) : defaultDate()
  );
  const [venue, setVenue] = useState(tournament?.venue ?? "");
  const [startTime, setStartTime] = useState(tournament?.startTime ?? "");
  const [startingStack, setStartingStack] = useState(
    tournament?.startingStack ?? ""
  );
  const [roundDuration, setRoundDuration] = useState(
    tournament?.roundDuration ?? ""
  );
  const [breakInfo, setBreakInfo] = useState(tournament?.breakInfo ?? "");
  const [finalTable, setFinalTable] = useState(tournament?.finalTable ?? "");
  const [maxSeats, setMaxSeats] = useState(tournament?.maxSeats ?? 40);
  const [onlineRegistration, setOnlineRegistration] = useState(
    tournament?.onlineRegistration ?? true
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !venue.trim()) {
      setError("Renseignez au moins le nom et le lieu du tournoi.");
      return;
    }
    if (maxSeats < 2) {
      setError("Prévoyez au moins 2 places.");
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      name,
      description,
      date: dateOnlyToIso(date),
      venue,
      startTime,
      startingStack,
      roundDuration,
      breakInfo,
      finalTable,
      maxSeats,
      onlineRegistration,
    });
    setSubmitting(false);
    if (result) {
      setError(result);
    } else {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-10 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="rise-in w-full max-w-md rounded-md border border-[var(--border)] bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-text">
            {isEditing ? "Modifier le tournoi" : "Nouveau tournoi"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-xl leading-none text-text-soft transition-colors hover:text-text"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5">
          <Field label="Nom du tournoi">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Main Event — Freezeout"
              className="input"
              autoFocus
            />
          </Field>

          <Field label="Description (visible en front office)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Structure, format, ambiance, ce qui rend ce tournoi particulier…"
              className="input min-h-24 resize-y"
              rows={4}
            />
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </Field>

          <Field label="Lieu">
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Cercle Wepler, Paris"
              className="input"
            />
          </Field>

          <Field label="Début du tournoi (visible en front office)">
            <input
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="Accueil 18h30 — Début des cartes 19h30"
              className="input"
            />
          </Field>

          <div>
            <p className="mb-2 text-xs text-text-soft">
              Informations pratiques (visibles en front office)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stack de départ">
                <input
                  value={startingStack}
                  onChange={(e) => setStartingStack(e.target.value)}
                  placeholder="20 000 jetons"
                  className="input"
                />
              </Field>
              <Field label="Round">
                <input
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(e.target.value)}
                  placeholder="20 minutes"
                  className="input"
                />
              </Field>
              <Field label="Pause">
                <input
                  value={breakInfo}
                  onChange={(e) => setBreakInfo(e.target.value)}
                  placeholder="10 min toutes les heures"
                  className="input"
                />
              </Field>
              <Field label="Table finale">
                <input
                  value={finalTable}
                  onChange={(e) => setFinalTable(e.target.value)}
                  placeholder="Table finale à 9 joueurs"
                  className="input"
                />
              </Field>
            </div>
          </div>

          <Field label="Nombre de places">
            <input
              type="number"
              min={2}
              value={maxSeats}
              onChange={(e) => setMaxSeats(Number(e.target.value))}
              className="input"
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-[var(--border)] px-4 py-3">
            <input
              type="checkbox"
              checked={onlineRegistration}
              onChange={(e) => setOnlineRegistration(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            <span className="text-sm text-text">
              Inscription en ligne activée
              <span className="block text-xs text-text-soft">
                Sinon, les joueurs s&apos;inscrivent uniquement sur place.
              </span>
            </span>
          </label>

          {error && (
            <p className="rounded-sm bg-[var(--status-full-soft)] px-3 py-2 text-sm text-status-full">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm border border-[var(--border)] px-4 py-2 text-sm text-text-soft transition-colors hover:text-text"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-sm bg-accent px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-accent-light disabled:opacity-50"
            >
              {submitting
                ? isEditing
                  ? "Enregistrement…"
                  : "Création…"
                : isEditing
                  ? "Enregistrer les modifications"
                  : "Créer le tournoi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-text-soft">{label}</span>
      {children}
    </label>
  );
}
