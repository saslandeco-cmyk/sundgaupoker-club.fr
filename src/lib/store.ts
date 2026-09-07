import { getSql, isBuildPhase } from "./db";
import type {
  Registrant,
  RegistrantInput,
  RegistrantWithTournament,
  Tournament,
  TournamentInput,
} from "./types";

/* ------------------------------------------------------------------------ *
 * Conversion entre les lignes SQL (snake_case, colonnes brutes) et les
 * objets TypeScript (camelCase) utilisés par le reste de l'application.
 * ------------------------------------------------------------------------ */

interface TournamentRow {
  id: string;
  name: string;
  description: string;
  date: Date;
  venue: string;
  start_time: string;
  starting_stack: string;
  round_duration: string;
  break_info: string;
  final_table: string;
  max_seats: number;
  online_registration: boolean;
  created_at: Date;
  updated_at: Date;
}

interface RegistrantRow {
  id: string;
  tournament_id: string;
  first_name: string;
  last_name: string;
  email: string;
  nickname: string | null;
  created_at: Date;
}

function mapRegistrantRow(row: RegistrantRow): Registrant {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email ?? "",
    ...(row.nickname ? { nickname: row.nickname } : {}),
    createdAt: row.created_at.toISOString(),
  };
}

function mapTournamentRow(
  row: TournamentRow,
  registrants: Registrant[]
): Tournament {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    date: row.date.toISOString(),
    venue: row.venue,
    startTime: row.start_time,
    startingStack: row.starting_stack,
    roundDuration: row.round_duration,
    breakInfo: row.break_info,
    finalTable: row.final_table,
    maxSeats: row.max_seats,
    onlineRegistration: row.online_registration,
    registrants,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/* ------------------------------------------------------------------------ *
 * Données d'exemple, insérées une seule fois si la base est vide (premier
 * démarrage sur une base fraîchement créée).
 * ------------------------------------------------------------------------ */

const SAMPLE_FIRST_NAMES = [
  "Léa", "Hugo", "Camille", "Nathan", "Chloé",
  "Louis", "Manon", "Adam", "Inès", "Théo",
];
const SAMPLE_LAST_NAMES = [
  "Bernard", "Petit", "Roux", "Fournier", "Girard",
  "Morel", "Lambert", "Fontaine", "Rousseau", "Vidal",
];

function nextWeekday(hour: number, minute: number, addDays = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7 + addDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

interface SeedTournament {
  id: string;
  name: string;
  description: string;
  date: Date;
  venue: string;
  startTime: string;
  startingStack: string;
  roundDuration: string;
  breakInfo: string;
  finalTable: string;
  maxSeats: number;
  onlineRegistration: boolean;
  registrantCount: number;
}

const SEED_TOURNAMENTS: SeedTournament[] = [
  {
    id: "seed-1",
    name: "Main Event — Freezeout",
    description:
      "Le rendez-vous phare du club : structure lente, tapis de départ profond " +
      "et une montée en blindes pensée pour laisser respirer le jeu.",
    date: nextWeekday(19, 30),
    venue: "Cercle Wepler, Paris",
    startTime: "Accueil 18h30 — Début des cartes 19h30",
    startingStack: "20 000 jetons",
    roundDuration: "20 minutes",
    breakInfo: "10 minutes toutes les heures",
    finalTable: "Table finale à 9 joueurs",
    maxSeats: 80,
    onlineRegistration: true,
    registrantCount: 62,
  },
  {
    id: "seed-2",
    name: "Turbo Bounty",
    description:
      "Format rapide à primes : chaque élimination rapporte une prime cash " +
      "immédiate. Idéal pour une soirée courte et intense.",
    date: nextWeekday(20, 0, 2),
    venue: "Club Pokerstars Live, Strasbourg",
    startTime: "Début des cartes 20h00 précises",
    startingStack: "10 000 jetons",
    roundDuration: "10 minutes",
    breakInfo: "5 minutes toutes les 45 minutes",
    finalTable: "Table finale à 8 joueurs",
    maxSeats: 40,
    onlineRegistration: true,
    registrantCount: 40,
  },
  {
    id: "seed-3",
    name: "Ladies Night Deepstack",
    description:
      "Tournoi deepstack réservé aux joueuses, dans une ambiance conviviale. " +
      "Inscriptions sur place uniquement, places limitées.",
    date: nextWeekday(18, 0, 5),
    venue: "Salon Riverside, Lyon",
    startTime: "Accueil 17h30 — Début des cartes 18h00",
    startingStack: "30 000 jetons",
    roundDuration: "25 minutes",
    breakInfo: "15 minutes toutes les heures",
    finalTable: "Table finale à 6 joueuses",
    maxSeats: 30,
    onlineRegistration: false,
    registrantCount: 11,
  },
];

let seeded = false;

/** Insère les tournois d'exemple si la base est vide (une seule fois par instance). */
async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  const sql = await getSql();
  const rows = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM tournaments
  `;
  const count = rows[0]?.count ?? 0;
  if (count > 0) {
    seeded = true;
    return;
  }

  for (const t of SEED_TOURNAMENTS) {
    await sql`
      INSERT INTO tournaments (
        id, name, description, date, venue, start_time, starting_stack,
        round_duration, break_info, final_table, max_seats,
        online_registration, created_at, updated_at
      ) VALUES (
        ${t.id}, ${t.name}, ${t.description}, ${t.date}, ${t.venue},
        ${t.startTime}, ${t.startingStack}, ${t.roundDuration}, ${t.breakInfo},
        ${t.finalTable}, ${t.maxSeats}, ${t.onlineRegistration}, now(), now()
      )
      ON CONFLICT (id) DO NOTHING
    `;
    for (let i = 0; i < t.registrantCount; i++) {
      const firstName = SAMPLE_FIRST_NAMES[i % SAMPLE_FIRST_NAMES.length];
      const lastName = SAMPLE_LAST_NAMES[i % SAMPLE_LAST_NAMES.length];
      await sql`
        INSERT INTO registrants (id, tournament_id, first_name, last_name, email, created_at)
        VALUES (
          ${`${t.id}-seed-reg-${i}`}, ${t.id}, ${firstName}, ${lastName},
          ${`${firstName}.${lastName}.${i}@exemple.test`.toLowerCase()}, now()
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
  }
  seeded = true;
}

/* ------------------------------------------------------------------------ *
 * Lecture
 * ------------------------------------------------------------------------ */

export async function readTournaments(): Promise<Tournament[]> {
  // Pendant `next build`, Next.js exécute une fois cette page pour vérifier
  // qu'elle ne plante pas, même si elle est marquée `force-dynamic`. Aucune
  // base de données n'est nécessaire (ni forcément disponible) à ce
  // stade : on renvoie une liste vide sans jamais tenter de s'y connecter.
  if (isBuildPhase) return [];
  await ensureSeeded();
  const sql = await getSql();
  const tournamentRows = await sql<TournamentRow[]>`
    SELECT * FROM tournaments ORDER BY created_at DESC
  `;
  const registrantRows = await sql<RegistrantRow[]>`
    SELECT * FROM registrants ORDER BY created_at ASC
  `;
  const byTournament = new Map<string, Registrant[]>();
  for (const row of registrantRows) {
    const list = byTournament.get(row.tournament_id) ?? [];
    list.push(mapRegistrantRow(row));
    byTournament.set(row.tournament_id, list);
  }
  return tournamentRows.map((row) =>
    mapTournamentRow(row, byTournament.get(row.id) ?? [])
  );
}

export async function getTournament(id: string): Promise<Tournament | null> {
  if (isBuildPhase) return null;
  await ensureSeeded();
  const sql = await getSql();
  const [row] = await sql<TournamentRow[]>`
    SELECT * FROM tournaments WHERE id = ${id}
  `;
  if (!row) return null;
  const registrantRows = await sql<RegistrantRow[]>`
    SELECT * FROM registrants WHERE tournament_id = ${id} ORDER BY created_at ASC
  `;
  return mapTournamentRow(row, registrantRows.map(mapRegistrantRow));
}

/* ------------------------------------------------------------------------ *
 * Tournois : création, duplication, modification, suppression
 * ------------------------------------------------------------------------ */

export async function createTournament(
  input: TournamentInput
): Promise<Tournament> {
  await ensureSeeded();
  const sql = await getSql();
  const id = globalThis.crypto.randomUUID();
  const [row] = await sql<TournamentRow[]>`
    INSERT INTO tournaments (
      id, name, description, date, venue, start_time, starting_stack,
      round_duration, break_info, final_table, max_seats,
      online_registration, created_at, updated_at
    ) VALUES (
      ${id}, ${input.name.trim()}, ${input.description?.trim() ?? ""},
      ${input.date}, ${input.venue.trim()}, ${input.startTime?.trim() ?? ""},
      ${input.startingStack?.trim() ?? ""}, ${input.roundDuration?.trim() ?? ""},
      ${input.breakInfo?.trim() ?? ""}, ${input.finalTable?.trim() ?? ""},
      ${input.maxSeats}, ${input.onlineRegistration}, now(), now()
    )
    RETURNING *
  `;
  return mapTournamentRow(row, []);
}

/**
 * Duplique un tournoi existant : mêmes informations pratiques, mais
 * nouvel identifiant, nom suffixé "(copie)", et aucun inscrit repris
 * (c'est une nouvelle session, pas un doublon d'inscriptions).
 */
export async function duplicateTournament(
  id: string
): Promise<Tournament | null> {
  await ensureSeeded();
  const sql = await getSql();
  const [source] = await sql<TournamentRow[]>`
    SELECT * FROM tournaments WHERE id = ${id}
  `;
  if (!source) return null;

  const newId = globalThis.crypto.randomUUID();
  const [row] = await sql<TournamentRow[]>`
    INSERT INTO tournaments (
      id, name, description, date, venue, start_time, starting_stack,
      round_duration, break_info, final_table, max_seats,
      online_registration, created_at, updated_at
    ) VALUES (
      ${newId}, ${`${source.name} (copie)`}, ${source.description},
      ${source.date}, ${source.venue}, ${source.start_time},
      ${source.starting_stack}, ${source.round_duration}, ${source.break_info},
      ${source.final_table}, ${source.max_seats}, ${source.online_registration},
      now(), now()
    )
    RETURNING *
  `;
  return mapTournamentRow(row, []);
}

export type UpdateError = "not_found" | "invalid_input" | "below_registered";

export async function updateTournament(
  id: string,
  input: TournamentInput
): Promise<{ tournament: Tournament } | { error: UpdateError }> {
  await ensureSeeded();
  const name = input.name?.trim();
  const venue = input.venue?.trim();
  if (!name || !input.date || !venue) {
    return { error: "invalid_input" };
  }
  if (!Number.isFinite(input.maxSeats) || input.maxSeats < 2) {
    return { error: "invalid_input" };
  }

  const sql = await getSql();
  const [existing] = await sql<{ id: string }[]>`
    SELECT id FROM tournaments WHERE id = ${id}
  `;
  if (!existing) return { error: "not_found" };

  // On ne peut pas réduire le nombre de places sous le nombre d'inscrits.
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM registrants WHERE tournament_id = ${id}
  `;
  if (input.maxSeats < count) return { error: "below_registered" };

  const [row] = await sql<TournamentRow[]>`
    UPDATE tournaments SET
      name = ${name},
      description = ${input.description?.trim() ?? ""},
      date = ${input.date},
      venue = ${venue},
      start_time = ${input.startTime?.trim() ?? ""},
      starting_stack = ${input.startingStack?.trim() ?? ""},
      round_duration = ${input.roundDuration?.trim() ?? ""},
      break_info = ${input.breakInfo?.trim() ?? ""},
      final_table = ${input.finalTable?.trim() ?? ""},
      max_seats = ${input.maxSeats},
      online_registration = ${input.onlineRegistration},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  const registrantRows = await sql<RegistrantRow[]>`
    SELECT * FROM registrants WHERE tournament_id = ${id} ORDER BY created_at ASC
  `;
  return {
    tournament: mapTournamentRow(row, registrantRows.map(mapRegistrantRow)),
  };
}

export async function deleteTournament(id: string): Promise<boolean> {
  await ensureSeeded();
  const sql = await getSql();
  const result = await sql`DELETE FROM tournaments WHERE id = ${id}`;
  return result.count > 0;
}

/* ------------------------------------------------------------------------ *
 * Inscriptions
 * ------------------------------------------------------------------------ */

export type RegisterError =
  | "not_found"
  | "closed"
  | "full"
  | "offline_only"
  | "invalid_input"
  | "already_registered";

/** Normalise un nom pour comparaison : minuscules, sans accents, sans espaces superflus. */
function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class RegistrationError extends Error {
  constructor(public code: RegisterError) {
    super(code);
  }
}

/**
 * Cœur commun à l'inscription publique et à l'inscription manuelle admin.
 * Toute la vérification (places disponibles, doublon, tournoi passé) et
 * l'insertion se font dans une même transaction avec verrouillage de la
 * ligne du tournoi (`FOR UPDATE`), pour éviter qu'une double inscription
 * simultanée ne fasse dépasser le nombre de places (race condition).
 */
async function registerCore(
  tournamentId: string,
  data: { firstName: string; lastName: string; email: string; nickname?: string },
  opts: { requireOnline: boolean }
): Promise<{ tournament: Tournament; registrant: Registrant } | { error: RegisterError }> {
  await ensureSeeded();
  const sql = await getSql();
  try {
    return await sql.begin(async (tx) => {
      const [tournamentRow] = await tx<TournamentRow[]>`
        SELECT * FROM tournaments WHERE id = ${tournamentId} FOR UPDATE
      `;
      if (!tournamentRow) throw new RegistrationError("not_found");
      if (opts.requireOnline && !tournamentRow.online_registration) {
        throw new RegistrationError("offline_only");
      }
      if (tournamentRow.date.getTime() < Date.now()) {
        throw new RegistrationError("closed");
      }

      const existingRows = await tx<RegistrantRow[]>`
        SELECT * FROM registrants WHERE tournament_id = ${tournamentId} ORDER BY created_at ASC
      `;
      if (existingRows.length >= tournamentRow.max_seats) {
        throw new RegistrationError("full");
      }

      // Une seule inscription par personne et par tournoi : identifiée par
      // la combinaison prénom + nom (le pseudo, facultatif, n'est pas fiable
      // à lui seul comme critère d'unicité).
      const alreadyRegistered = existingRows.some(
        (r) =>
          normalizeName(r.first_name) === normalizeName(data.firstName) &&
          normalizeName(r.last_name) === normalizeName(data.lastName)
      );
      if (alreadyRegistered) throw new RegistrationError("already_registered");

      const id = globalThis.crypto.randomUUID();
      const [registrantRow] = await tx<RegistrantRow[]>`
        INSERT INTO registrants (id, tournament_id, first_name, last_name, email, nickname, created_at)
        VALUES (
          ${id}, ${tournamentId}, ${data.firstName}, ${data.lastName},
          ${data.email}, ${data.nickname ?? null}, now()
        )
        RETURNING *
      `;

      const registrant = mapRegistrantRow(registrantRow);
      const tournament = mapTournamentRow(tournamentRow, [
        ...existingRows.map(mapRegistrantRow),
        registrant,
      ]);
      return { tournament, registrant };
    });
  } catch (err) {
    if (err instanceof RegistrationError) return { error: err.code };
    throw err;
  }
}

export async function addRegistrant(
  tournamentId: string,
  input: RegistrantInput
): Promise<
  { tournament: Tournament; registrant: Registrant } | { error: RegisterError }
> {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();
  const nickname = input.nickname?.trim();
  if (!firstName || !lastName || !email || !EMAIL_RE.test(email)) {
    return { error: "invalid_input" };
  }
  return registerCore(
    tournamentId,
    { firstName, lastName, email, nickname },
    { requireOnline: true }
  );
}

export async function removeRegistrant(
  tournamentId: string,
  registrantId: string
): Promise<Tournament | null> {
  await ensureSeeded();
  const sql = await getSql();
  const [tournamentRow] = await sql<TournamentRow[]>`
    SELECT * FROM tournaments WHERE id = ${tournamentId}
  `;
  if (!tournamentRow) return null;
  await sql`
    DELETE FROM registrants WHERE id = ${registrantId} AND tournament_id = ${tournamentId}
  `;
  const registrantRows = await sql<RegistrantRow[]>`
    SELECT * FROM registrants WHERE tournament_id = ${tournamentId} ORDER BY created_at ASC
  `;
  return mapTournamentRow(tournamentRow, registrantRows.map(mapRegistrantRow));
}

export type ManualRegisterError = Exclude<RegisterError, "offline_only">;

/**
 * Inscription saisie par un administrateur : mêmes règles que l'inscription
 * publique (places disponibles, tournoi non passé, pas de doublon
 * prénom+nom), mais sans exiger que l'inscription en ligne soit activée —
 * un organisateur doit pouvoir enregistrer une inscription reçue par un
 * autre canal (téléphone, sur place, etc.). L'email reste facultatif ici :
 * s'il est fourni, un email de confirmation est envoyé à la personne.
 */
export async function addManualRegistrant(
  tournamentId: string,
  input: RegistrantInput
): Promise<
  | { tournament: Tournament; registrant: Registrant }
  | { error: ManualRegisterError }
> {
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();
  const nickname = input.nickname?.trim();
  if (!firstName || !lastName) {
    return { error: "invalid_input" };
  }
  if (email && !EMAIL_RE.test(email)) {
    return { error: "invalid_input" };
  }
  const result = await registerCore(
    tournamentId,
    { firstName, lastName, email: email ?? "", nickname },
    { requireOnline: false }
  );
  // `requireOnline: false` garantit que "offline_only" ne peut pas survenir ici.
  return result as
    | { tournament: Tournament; registrant: Registrant }
    | { error: ManualRegisterError };
}

/** Retire un inscrit en le retrouvant par son seul identifiant (utilisé par
 * le tableau de bord global des inscrits, qui ne connaît pas forcément le
 * tournoi concerné à l'avance). */
export async function removeRegistrantById(
  registrantId: string
): Promise<{ tournamentId: string } | null> {
  await ensureSeeded();
  const sql = await getSql();
  const [row] = await sql<{ tournament_id: string }[]>`
    DELETE FROM registrants WHERE id = ${registrantId}
    RETURNING tournament_id
  `;
  if (!row) return null;
  return { tournamentId: row.tournament_id };
}

/** Liste tous les inscrits, tous tournois confondus, du plus récent au plus ancien. */
export async function listAllRegistrants(): Promise<RegistrantWithTournament[]> {
  if (isBuildPhase) return [];
  await ensureSeeded();
  const sql = await getSql();
  const rows = await sql<
    (RegistrantRow & { tournament_name: string; tournament_date: Date })[]
  >`
    SELECT r.*, t.name AS tournament_name, t.date AS tournament_date
    FROM registrants r
    JOIN tournaments t ON t.id = r.tournament_id
    ORDER BY r.created_at DESC
  `;
  return rows.map((row) => ({
    ...mapRegistrantRow(row),
    tournamentId: row.tournament_id,
    tournamentName: row.tournament_name,
    tournamentDate: row.tournament_date.toISOString(),
  }));
}
