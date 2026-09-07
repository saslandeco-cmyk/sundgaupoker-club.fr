import type { RegistrantWithTournament } from "./types";

function escapeCsvField(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

const HEADERS = [
  "Tournoi",
  "Date du tournoi",
  "Prénom",
  "Nom",
  "Email",
  "Pseudo",
  "Inscrit le",
];

/** Génère un CSV (séparateur point-virgule, compatible Excel FR) des inscrits. */
export function registrantsToCsv(rows: RegistrantWithTournament[]): string {
  const lines = [HEADERS.join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.tournamentName,
        formatDate(r.tournamentDate),
        r.firstName,
        r.lastName,
        r.email ?? "",
        r.nickname ?? "",
        formatDate(r.createdAt),
      ]
        .map(escapeCsvField)
        .join(";")
    );
  }
  // BOM UTF-8 pour un affichage correct des accents dans Excel.
  return "\uFEFF" + lines.join("\r\n");
}
