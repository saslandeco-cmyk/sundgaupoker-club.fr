"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Registrant, RegistrantInput, RegistrantWithTournament } from "@/lib/types";
import { SiteHeader } from "../SiteHeader";
import { ManualRegistrationModal } from "./ManualRegistrationModal";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function RegistrantsDashboard({
  initialRegistrants,
  tournaments,
}: {
  initialRegistrants: RegistrantWithTournament[];
  tournaments: { id: string; name: string; date: string }[];
}) {
  const [registrants, setRegistrants] = useState(initialRegistrants);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return registrants.filter((r) => {
      if (tournamentFilter !== "all" && r.tournamentId !== tournamentFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = `${r.firstName} ${r.lastName} ${r.email} ${r.nickname ?? ""} ${r.tournamentName}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [registrants, search, tournamentFilter]);

  async function handleManualRegister(
    tournamentId: string,
    input: RegistrantInput
  ): Promise<string | void> {
    const res = await fetch("/api/admin/registrants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId, ...input }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return body.error ?? "L'inscription a échoué.";
    }
    const tournament = (await res.json()) as {
      id: string;
      name: string;
      date: string;
      registrants: Registrant[];
    };
    const created = tournament.registrants[tournament.registrants.length - 1];
    setRegistrants((prev) => [
      {
        ...created,
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        tournamentDate: tournament.date,
      },
      ...prev,
    ]);
  }

  async function handleDelete(registrantId: string) {
    if (!confirm("Retirer cette inscription ?")) return;
    const res = await fetch(`/api/admin/registrants/${registrantId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setRegistrants((prev) => prev.filter((r) => r.id !== registrantId));
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader active="/admin" />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="text-sm text-text-soft underline-offset-4 hover:text-text hover:underline"
            >
              ← Retour aux tournois
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-text">
              Gestion des inscrits
            </h1>
            <p className="text-sm text-text-soft">
              {registrants.length} inscription{registrants.length > 1 ? "s" : ""}{" "}
              au total, tous tournois confondus.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/admin/registrants/export"
              download
              className="rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-text-soft transition-colors hover:text-text"
            >
              Exporter en CSV
            </a>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-sm bg-accent px-5 py-2.5 text-sm font-bold text-text transition-colors hover:bg-accent-light"
            >
              + Inscription manuelle
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, un pseudo, un tournoi…"
            className="input w-full max-w-xs"
          />
          <select
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tous les tournois</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-md border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-text-soft">
                <th className="px-4 py-3 font-semibold">Tournoi</th>
                <th className="px-4 py-3 font-semibold">Prénom</th>
                <th className="px-4 py-3 font-semibold">Nom</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Pseudo</th>
                <th className="px-4 py-3 font-semibold">Inscrit le</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-text-soft"
                  >
                    Aucune inscription ne correspond.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border)] text-text last:border-b-0"
                >
                  <td className="px-4 py-3">{r.tournamentName}</td>
                  <td className="px-4 py-3">{r.firstName}</td>
                  <td className="px-4 py-3">{r.lastName}</td>
                  <td className="px-4 py-3 text-text-soft">
                    {r.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-soft">
                    {r.nickname ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-soft">
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
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

      {showModal && (
        <ManualRegistrationModal
          tournaments={tournaments}
          onClose={() => setShowModal(false)}
          onSubmit={handleManualRegister}
        />
      )}
    </div>
  );
}
