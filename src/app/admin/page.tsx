import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { readTournaments } from "@/lib/store";
import { AdminBoard } from "@/components/admin/AdminBoard";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin@403115");
  }

  const tournaments = await readTournaments();
  return <AdminBoard initialTournaments={tournaments} />;
}
