"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Connexion impossible.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-md border border-[var(--border)] bg-surface p-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-text">Espace organisateur</h1>
        <p className="mt-1 text-sm text-text-soft">
          Connectez-vous pour créer et gérer les tournois.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
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
        <p className="rounded-sm bg-[var(--status-full-soft)] px-3 py-2 text-sm text-status-full">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-sm bg-accent px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-accent-light disabled:opacity-50"
      >
        {submitting ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
