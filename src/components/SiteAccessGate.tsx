"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Image from "next/image";

export function SiteAccessGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/site-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Mot de passe incorrect.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col items-center gap-4 rounded-md border border-[var(--border)] bg-surface p-6"
      >
        <Image
          src="/images/logo.png"
          alt="Sundgau Poker Club"
          width={80}
          height={80}
          className="h-[calc(var(--spacing)*20)] w-[calc(var(--spacing)*20)]"
        />

        <div className="text-center">
          <h1 className="text-xl font-semibold text-text">
            Accès réservé aux membres
          </h1>
          <p className="mt-1 text-sm text-text-soft">
            Saisissez le mot de passe communiqué par le club pour consulter
            les tournois et vous inscrire.
          </p>
        </div>

        <label className="flex w-full flex-col gap-1.5">
          <span className="text-xs text-text-soft">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoFocus
          />
        </label>

        {error && (
          <p className="w-full rounded-sm bg-[var(--status-full-soft)] px-3 py-2 text-sm text-status-full">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-accent px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-accent-light disabled:opacity-50"
        >
          {submitting ? "Vérification…" : "Accéder aux tournois"}
        </button>
      </form>
    </div>
  );
}
