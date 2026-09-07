"use client";

import { FormEvent, useState } from "react";
import type { PublicTournament, RegistrantInput } from "@/lib/types";

export function RegistrationModal({
  tournament,
  onClose,
  onSubmit,
}: {
  tournament: PublicTournament;
  onClose: () => void;
  onSubmit: (input: RegistrantInput) => Promise<string | void>;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Le prénom et le nom sont obligatoires.");
      return;
    }
    if (!email.trim() || !EMAIL_RE.test(email.trim())) {
      setError("Une adresse email valide est obligatoire pour recevoir la confirmation.");
      return;
    }

    setSubmitting(true);
    const result = await onSubmit({
      firstName,
      lastName,
      email: email.trim(),
      nickname: nickname.trim() || undefined,
    });
    setSubmitting(false);
    if (result) {
      setError(result);
    } else {
      setDone(true);
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
          <div>
            <h2 className="text-lg font-bold text-text">
              {done ? "Inscription confirmée" : "Inscription"}
            </h2>
            <p className="text-xs text-text-soft">{tournament.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-xl leading-none text-text-soft transition-colors hover:text-text"
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="flex flex-col gap-4 px-6 py-6">
            <p className="text-sm text-text">
              Votre place est réservée pour{" "}
              <span className="font-semibold">{tournament.name}</span>. Un
              email de confirmation vient de vous être envoyé. À bientôt à
              la table !
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm bg-accent px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-accent-light"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 px-6 py-5"
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Camille"
                  className="input"
                  autoFocus
                />
              </Field>
              <Field label="Nom">
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Bernard"
                  className="input"
                />
              </Field>
            </div>

            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="camille.bernard@exemple.fr"
                className="input"
              />
            </Field>

            <Field label="Pseudo (facultatif)">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="CamB_River"
                className="input"
              />
            </Field>

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
                {submitting ? "Inscription…" : "Confirmer"}
              </button>
            </div>
          </form>
        )}
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
