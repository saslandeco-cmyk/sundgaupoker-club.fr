import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAllRegistrants, readTournaments } from "@/lib/store";
import { RegistrantsDashboard } from "@/components/admin/RegistrantsDashboard";

export default async function AdminRegistrantsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin@403115");
  }

  const [registrants, tournaments] = await Promise.all([
    listAllRegistrants(),
    readTournaments(),
  ]);

  return (
    <RegistrantsDashboard
      initialRegistrants={registrants}
      tournaments={tournaments.map((t) => ({ id: t.id, name: t.name, date: t.date }))}
    />
  );
}
