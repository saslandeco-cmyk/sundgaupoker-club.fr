import type { Metadata } from "next";
import { readTournaments } from "@/lib/store";
import { toPublicTournament } from "@/lib/types";
import { isSiteAuthenticated } from "@/lib/site-access";
import { PublicBoard } from "@/components/PublicBoard";
import { SiteAccessGate } from "@/components/SiteAccessGate";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

// Rendu à chaque requête : les places restantes et la liste des tournois
// changent en temps réel, une page générée statiquement au build afficherait
// des données figées jusqu'au prochain déploiement.
export const dynamic = "force-dynamic";

export default async function TournoisPage() {
  if (!(await isSiteAuthenticated())) {
    return <SiteAccessGate />;
  }

  const tournaments = await readTournaments();
  return (
    <PublicBoard initialTournaments={tournaments.map(toPublicTournament)} />
  );
}
