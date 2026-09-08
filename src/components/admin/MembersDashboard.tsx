"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { AuthorizedMember } from "@/lib/members";
import { SiteHeader } from "../SiteHeader";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
    new Date(iso)
  );
}

export function MembersDashboard({
  initialMembers,
}: {
  initialMembers: AuthorizedMember[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((m) =>
      `${m.email} ${m.name}`.toLowerCase().includes(query)
    );
  }, [members, search]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Une adresse email est obligatoire.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "L'ajout a échoué.");
      return;
    }
    const created = (await res.json()) as AuthorizedMember;
    setMembers((prev) => [created, ...prev]);
    setEmail("");
    setName("");
  }

  async function handleRemove(id: string) {
    if (!confirm("Retirer cette personne de la liste des membres autorisés ?")) {
      return;
    }
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader active="/admin" />

      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-6 sm:px-8">
        <div>
          <Link
            href="/admin"
            className="text-sm text-text-soft underline-offset-4 hover:text-text hover:underline"
          >
            ← Retour aux tournois
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-text">
            Membres autorisés
          </h1>
          <p className="text-sm text-text-soft">
            Seules les adresses email listées ici peuvent s&apos;inscrire à un
            tournoi depuis la page publique. {members.length} membre
            {members.length > 1 ? "s" : ""} autorisé{members.length > 1 ? "s" : ""}
            .
          </p>
        </div>

        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-md border border-[var(--border)] bg-surface p-4 sm:flex-row sm:items-end"
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-text-soft">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="camille.bernard@exemple.fr"
              className="input"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-text-soft">Nom (facultatif, pour s&apos;y retrouver)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Camille Bernard"
              className="input"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm bg-accent px-5 py-2.5 text-sm font-bold text-text transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {submitting ? "Ajout…" : "+ Autoriser"}
          </button>
        </form>

        {error && (
          <p className="rounded-sm bg-[var(--status-full-soft)] px-3 py-2 text-sm text-status-full">
            {error}
          </p>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un email ou un nom…"
          className="input w-full max-w-xs"
        />

        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-text-soft">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Ajouté le</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-text-soft">
                    {members.length === 0
                      ? "Aucun membre autorisé pour l'instant — personne ne peut s'inscrire tant que la liste est vide."
                      : "Aucun membre ne correspond."}
                  </td>
                </tr>
              )}
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-[var(--border)] text-text last:border-b-0"
                >
                  <td className="px-4 py-3">{m.email}</td>
                  <td className="px-4 py-3 text-text-soft">{m.name || "—"}</td>
                  <td className="px-4 py-3 text-text-soft">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(m.id)}
                      className="text-xs text-text-soft transition-colors hover:text-status-full"
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
