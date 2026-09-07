export function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return { date, time };
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
}

/** For a <input type="date"> default value from an ISO string. */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Convertit une valeur de <input type="date"> (YYYY-MM-DD, sans heure) en
 * ISO 8601. L'heure est fixée à 23:59 pour que le tournoi reste "à venir"
 * jusqu'à la fin de la journée choisie (l'heure réelle est saisie en texte
 * libre dans le champ "Début du tournoi").
 */
export function dateOnlyToIso(dateValue: string): string {
  const d = new Date(`${dateValue}T23:59:00`);
  return d.toISOString();
}
