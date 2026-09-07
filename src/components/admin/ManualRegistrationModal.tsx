"use client";

import { FormEvent, useState } from "react";
import type { RegistrantInput } from "@/lib/types";

export function ManualRegistrationModal({
  tournaments,
  onClose,
  onSubmit,
}: {
  tournaments: { id: string; name: string; date: string }[];
  onClose: () => void;
  onSubmit: (
    tournamentId: string,
    input: RegistrantInput
  ) => Promise<string | void>;
}) {
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tournamentId) {
      setError("Sélectionnez un tournoi.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont obligatoires.");
      return;
    }

    setSubmitting(true);
    const result = await onSubmit(tournamentId, {
      firstName,
      lastName,
      email: email.trim() || undefined,
      nickname: nickname.trim() || undefined,
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
          <h2 className="text-lg font-bold text-text">Inscription manuelle</h2>
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
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-soft">Tournoi</span>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="input"
            >
              {tournaments.length === 0 && (
                <option value="">Aucun tournoi disponible</option>
              )}
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} —{" "}
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  }).format(new Date(t.date))}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-text-soft">Prénom</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Camille"
                className="input"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-text-soft">Nom</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Bernard"
                className="input"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-soft">
              Email (facultatif — nécessaire pour envoyer la confirmation)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="camille.bernard@exemple.fr"
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-text-soft">Pseudo (facultatif)</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="CamB_River"
              className="input"
            />
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
              disabled={submitting || tournaments.length === 0}
              className="flex-1 rounded-sm bg-accent px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-accent-light disabled:opacity-50"
            >
              {submitting ? "Inscription…" : "Inscrire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
