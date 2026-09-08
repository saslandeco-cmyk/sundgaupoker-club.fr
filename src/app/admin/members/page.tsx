import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAuthorizedMembers } from "@/lib/members";
import { MembersDashboard } from "@/components/admin/MembersDashboard";

export default async function AdminMembersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin@403115");
  }

  const members = await listAuthorizedMembers();

  return <MembersDashboard initialMembers={members} />;
}
