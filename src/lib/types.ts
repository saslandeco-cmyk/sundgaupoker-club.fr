export type Suit = "spade" | "heart" | "diamond" | "club";

export interface Registrant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  nickname?: string;
  createdAt: string;
}

export interface RegistrantInput {
  firstName: string;
  lastName: string;
  email?: string;
  nickname?: string;
}

/** Un inscrit enrichi des informations de son tournoi, pour le tableau de bord admin. */
export interface RegistrantWithTournament extends Registrant {
  tournamentId: string;
  tournamentName: string;
  tournamentDate: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  /** ISO 8601 datetime string */
  date: string;
  venue: string;
  startTime: string;
  startingStack: string;
  roundDuration: string;
  breakInfo: string;
  finalTable: string;
  maxSeats: number;
  onlineRegistration: boolean;
  registrants: Registrant[];
  createdAt: string;
  updatedAt: string;
}

export interface TournamentInput {
  name: string;
  description?: string;
  date: string;
  venue: string;
  startTime?: string;
  startingStack?: string;
  roundDuration?: string;
  breakInfo?: string;
  finalTable?: string;
  maxSeats: number;
  onlineRegistration: boolean;
}

/** Version publique d'un tournoi : jamais les noms des inscrits, juste le compte. */
export interface PublicTournament {
  id: string;
  name: string;
  description: string;
  date: string;
  venue: string;
  startTime: string;
  startingStack: string;
  roundDuration: string;
  breakInfo: string;
  finalTable: string;
  maxSeats: number;
  onlineRegistration: boolean;
  registeredCount: number;
  createdAt: string;
}

export type TournamentStatus = "upcoming" | "full" | "closed";

export function getStatus(t: {
  date: string;
  maxSeats: number;
  registeredCount: number;
}): TournamentStatus {
  const isPast = new Date(t.date).getTime() < Date.now();
  if (isPast) return "closed";
  if (t.registeredCount >= t.maxSeats) return "full";
  return "upcoming";
}

export function remainingSeats(t: {
  maxSeats: number;
  registeredCount: number;
}): number {
  return Math.max(0, t.maxSeats - t.registeredCount);
}

export function toPublicTournament(t: Tournament): PublicTournament {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    date: t.date,
    venue: t.venue,
    startTime: t.startTime,
    startingStack: t.startingStack,
    roundDuration: t.roundDuration,
    breakInfo: t.breakInfo,
    finalTable: t.finalTable,
    maxSeats: t.maxSeats,
    onlineRegistration: t.onlineRegistration,
    registeredCount: t.registrants.length,
    createdAt: t.createdAt,
  };
}
